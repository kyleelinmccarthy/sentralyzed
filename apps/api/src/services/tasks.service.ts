import { eq, and, isNull, asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks, taskComments } from '../db/schema/tasks.js'
import { activitiesService } from './activities.service.js'
import { whereActiveById, softDelete, getUniqueNotifyIds } from './utils/db-helpers.js'

type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

export class TasksService {
  async listByProject(
    projectId: string,
    filters?: { status?: string; assigneeId?: string; priority?: string },
  ) {
    const conditions = [eq(tasks.projectId, projectId), isNull(tasks.deletedAt)]

    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status as TaskStatus))
    }
    if (filters?.assigneeId) {
      conditions.push(eq(tasks.assigneeId, filters.assigneeId))
    }
    if (filters?.priority) {
      conditions.push(eq(tasks.priority, filters.priority as TaskPriority))
    }

    return db.query.tasks.findMany({
      where: and(...conditions),
      orderBy: [asc(tasks.position)],
    })
  }

  async getById(id: string) {
    return db.query.tasks.findFirst({
      where: whereActiveById(tasks.id, id, tasks.deletedAt),
    })
  }

  async create(data: {
    title: string
    description?: unknown
    projectId: string
    assigneeId?: string
    reporterId: string
    priority?: TaskPriority
    dueDate?: string
    labels?: string[]
    actorName?: string
  }) {
    const [task] = await db
      .insert(tasks)
      .values({
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
        reporterId: data.reporterId,
        priority: data.priority || 'medium',
        dueDate: data.dueDate,
        labels: data.labels,
      })
      .returning()

    if (data.assigneeId && data.assigneeId !== data.reporterId) {
      await activitiesService.log({
        actorId: data.reporterId,
        action: 'created',
        entityType: 'task',
        entityId: task!.id,
        metadata: { taskTitle: data.title, actorName: data.actorName },
        notifyUserIds: [data.assigneeId],
      })
    }

    return task!
  }

  async update(
    id: string,
    data: Partial<{
      title: string
      description: unknown
      status: TaskStatus
      priority: TaskPriority
      assigneeId: string
      dueDate: string
      position: number
      labels: string[]
    }>,
    actorId?: string,
    actorName?: string,
  ) {
    // Pre-fetch to detect changes for notifications
    const existing = actorId ? await this.getById(id) : null

    const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning()
    if (!task || !actorId || !existing) return task

    const isReassignment = data.assigneeId && data.assigneeId !== existing.assigneeId
    const isCompletion = data.status === 'done' && existing.status !== 'done'

    if (isReassignment) {
      // Notify new assignee
      await activitiesService.log({
        actorId,
        action: 'assigned',
        entityType: 'task',
        entityId: id,
        metadata: {
          taskTitle: existing.title,
          actorName,
          newAssigneeId: data.assigneeId,
          previousAssigneeId: existing.assigneeId,
        },
        notifyUserIds: [data.assigneeId!],
      })
      // Notify old assignee
      if (existing.assigneeId) {
        await activitiesService.log({
          actorId,
          action: 'updated',
          entityType: 'task',
          entityId: id,
          metadata: {
            taskTitle: existing.title,
            actorName,
            change: 'unassigned',
            newAssigneeId: data.assigneeId,
          },
          notifyUserIds: [existing.assigneeId],
        })
      }
    } else if (isCompletion) {
      const uniqueIds = getUniqueNotifyIds([existing.assigneeId, existing.reporterId])
      await activitiesService.log({
        actorId,
        action: 'completed',
        entityType: 'task',
        entityId: id,
        metadata: { taskTitle: existing.title, actorName },
        notifyUserIds: uniqueIds,
      })
    } else if (existing.assigneeId && existing.assigneeId !== actorId) {
      // General update — notify assignee only if they're not the actor
      await activitiesService.log({
        actorId,
        action: 'updated',
        entityType: 'task',
        entityId: id,
        metadata: { taskTitle: existing.title, actorName },
        notifyUserIds: [existing.assigneeId],
      })
    }

    return task
  }

  async reorder(items: { id: string; status: TaskStatus; position: number }[]) {
    for (const item of items) {
      await db
        .update(tasks)
        .set({ status: item.status, position: item.position })
        .where(eq(tasks.id, item.id))
    }
  }

  async addComment(taskId: string, authorId: string, content: string, actorName?: string) {
    const task = await this.getById(taskId)

    const [comment] = await db
      .insert(taskComments)
      .values({ taskId, authorId, content })
      .returning()

    if (task) {
      const uniqueIds = getUniqueNotifyIds([task.assigneeId, task.reporterId])
      if (uniqueIds.length) {
        await activitiesService.log({
          actorId: authorId,
          action: 'commented',
          entityType: 'task',
          entityId: taskId,
          metadata: { taskTitle: task.title, actorName },
          notifyUserIds: uniqueIds,
        })
      }
    }

    return comment!
  }

  async getComments(taskId: string) {
    return db.query.taskComments.findMany({
      where: eq(taskComments.taskId, taskId),
      orderBy: (c, { asc: a }) => [a(c.createdAt)],
    })
  }

  async softDelete(id: string, actorId?: string, actorName?: string) {
    const task = actorId ? await this.getById(id) : null

    const deleted = await softDelete(tasks, tasks.id, id)

    if (task && actorId && task.assigneeId) {
      await activitiesService.log({
        actorId,
        action: 'deleted',
        entityType: 'task',
        entityId: id,
        metadata: { taskTitle: task.title, actorName },
        notifyUserIds: [task.assigneeId],
      })
    }

    return deleted
  }
}

export const tasksService = new TasksService()
