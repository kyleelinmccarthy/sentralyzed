import { eq, and, isNull, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { activities, notifications } from '../db/schema/activities.js'

type ActivityAction = 'created' | 'updated' | 'deleted' | 'commented' | 'assigned' | 'completed'

export class ActivitiesService {
  async log(data: {
    actorId: string
    action: ActivityAction
    entityType: string
    entityId: string
    metadata?: unknown
    notifyUserIds?: string[]
  }) {
    const [activity] = await db
      .insert(activities)
      .values({
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata,
      })
      .returning()

    // Create notifications for specified users
    if (data.notifyUserIds?.length) {
      await db.insert(notifications).values(
        data.notifyUserIds
          .filter((id) => id !== data.actorId) // Don't notify the actor
          .map((userId) => ({
            userId,
            activityId: activity!.id,
          })),
      )
    }

    return activity!
  }

  async listActivities(filters?: { entityType?: string; limit?: number }) {
    return db.query.activities.findMany({
      orderBy: [desc(activities.createdAt)],
      limit: filters?.limit || 50,
    })
  }

  async getUserNotifications(userId: string) {
    return db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    })
  }

  async markRead(notificationId: string) {
    const [notification] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning()
    return notification
  }

  async markAllRead(userId: string) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  }

  async getUnreadCount(userId: string) {
    const result = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    })
    return result.length
  }
}

export const activitiesService = new ActivitiesService()
