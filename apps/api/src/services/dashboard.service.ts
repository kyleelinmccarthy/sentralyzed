import { eq, and, isNull, ne, asc, gte, lte, inArray, or, gt, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks } from '../db/schema/tasks.js'
import { events, eventAttendees } from '../db/schema/calendar.js'
import { goals } from '../db/schema/goals.js'
import { feedback } from '../db/schema/feedback.js'
import { channels, channelMembers, messages } from '../db/schema/chat.js'
import { entityAssignments } from '../db/schema/assignments.js'
import { assignmentsService } from './assignments.service.js'
import type { MyItemsResponse } from '@sentral/shared/types/dashboard'

export class DashboardService {
  async getMyItems(userId: string, from: Date, to: Date): Promise<MyItemsResponse> {
    const [userTasks, userEvents, userGoals, userFeedback, chatNotifications, rawAssignments] =
      await Promise.all([
        this.getMyTasks(userId),
        this.getMyEvents(userId, from, to),
        this.getMyGoals(userId),
        this.getMyFeedback(userId),
        this.getChatNotifications(userId),
        assignmentsService.findByUser(userId),
      ])

    const assignments = rawAssignments.map((a) => ({
      id: a.id,
      entityType: a.entityType,
      entityId: a.entityId,
      role: a.role,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    }))

    return {
      tasks: userTasks,
      events: userEvents,
      goals: userGoals,
      feedbackItems: userFeedback,
      chatNotifications,
      assignments,
    }
  }

  private async getMyTasks(userId: string) {
    // Get task IDs where user is assigned via entity assignments (owner, assignee, etc.)
    const taskAssignments = await db
      .select({ entityId: entityAssignments.entityId })
      .from(entityAssignments)
      .where(and(eq(entityAssignments.entityType, 'task'), eq(entityAssignments.userId, userId)))

    const assignedTaskIds = taskAssignments.map((a) => a.entityId)

    // Build condition: assigneeId = userId OR task id in entity-assigned task IDs
    const ownershipCondition =
      assignedTaskIds.length > 0
        ? or(eq(tasks.assigneeId, userId), inArray(tasks.id, assignedTaskIds))
        : eq(tasks.assigneeId, userId)

    return db.query.tasks.findMany({
      where: and(ownershipCondition, isNull(tasks.deletedAt), ne(tasks.status, 'done')),
      orderBy: [asc(tasks.dueDate)],
      columns: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
      },
    })
  }

  private async getMyEvents(userId: string, from: Date, to: Date) {
    const rows = await db
      .select({
        events: {
          id: events.id,
          title: events.title,
          startTime: events.startTime,
          endTime: events.endTime,
          allDay: events.allDay,
        },
        event_attendees: {
          status: eventAttendees.status,
        },
      })
      .from(events)
      .innerJoin(eventAttendees, eq(events.id, eventAttendees.eventId))
      .where(
        and(
          eq(eventAttendees.userId, userId),
          ne(eventAttendees.status, 'declined'),
          gte(events.startTime, from),
          lte(events.startTime, to),
        ),
      )
      .orderBy(asc(events.startTime))

    return rows.map((row) => ({
      id: row.events.id,
      title: row.events.title,
      startTime: row.events.startTime.toISOString(),
      endTime: row.events.endTime.toISOString(),
      allDay: row.events.allDay,
      rsvpStatus: row.event_attendees.status,
    }))
  }

  private async getMyGoals(userId: string) {
    // Get goal IDs where user is assigned via entity assignments
    const goalAssignments = await db
      .select({ entityId: entityAssignments.entityId })
      .from(entityAssignments)
      .where(and(eq(entityAssignments.entityType, 'goal'), eq(entityAssignments.userId, userId)))

    const assignedGoalIds = goalAssignments.map((a) => a.entityId)

    const ownershipCondition =
      assignedGoalIds.length > 0
        ? or(eq(goals.ownerId, userId), inArray(goals.id, assignedGoalIds))
        : eq(goals.ownerId, userId)

    return db.query.goals.findMany({
      where: and(
        ownershipCondition,
        isNull(goals.deletedAt),
        ne(goals.status, 'completed'),
        ne(goals.status, 'archived'),
      ),
      orderBy: [asc(goals.targetDate)],
      columns: {
        id: true,
        title: true,
        status: true,
        progressPercentage: true,
        targetDate: true,
        level: true,
      },
    })
  }

  private async getMyFeedback(userId: string) {
    return db.query.feedback.findMany({
      where: and(
        or(eq(feedback.submittedBy, userId), eq(feedback.reviewedBy, userId)),
        isNull(feedback.deletedAt),
        ne(feedback.status, 'closed'),
        ne(feedback.status, 'resolved'),
      ),
      columns: {
        id: true,
        title: true,
        category: true,
        priority: true,
        status: true,
      },
    })
  }

  private async getChatNotifications(userId: string) {
    const rows = await db
      .select({
        channelId: channels.id,
        channelName: channels.name,
        lastReadAt: channelMembers.lastReadAt,
      })
      .from(channelMembers)
      .innerJoin(channels, eq(channelMembers.channelId, channels.id))
      .where(eq(channelMembers.userId, userId))

    const results = await Promise.all(
      rows.map(async (row) => {
        const condition = row.lastReadAt
          ? and(
              eq(messages.channelId, row.channelId),
              gt(messages.createdAt, row.lastReadAt),
              isNull(messages.deletedAt),
              ne(messages.authorId, userId),
            )
          : and(
              eq(messages.channelId, row.channelId),
              isNull(messages.deletedAt),
              ne(messages.authorId, userId),
            )

        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messages)
          .where(condition)

        return {
          channelId: row.channelId,
          channelName: row.channelName,
          unreadCount: result.count,
        }
      }),
    )

    // Only return channels with unread messages
    return results.filter((r) => r.unreadCount > 0)
  }
}

export const dashboardService = new DashboardService()
