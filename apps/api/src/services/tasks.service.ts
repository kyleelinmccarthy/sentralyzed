import { eq, and, isNull, asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks, taskComments } from '../db/schema/tasks.js'

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
      where: and(eq(tasks.id, id), isNull(tasks.deletedAt)),
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
  ) {
    const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning()
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

  async addComment(taskId: string, authorId: string, content: string) {
    const [comment] = await db
      .insert(taskComments)
      .values({ taskId, authorId, content })
      .returning()
    return comment!
  }

  async getComments(taskId: string) {
    return db.query.taskComments.findMany({
      where: eq(taskComments.taskId, taskId),
      orderBy: (c, { asc: a }) => [a(c.createdAt)],
    })
  }

  async softDelete(id: string) {
    const [task] = await db
      .update(tasks)
      .set({ deletedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning()
    return task
  }
}

export const tasksService = new TasksService()
