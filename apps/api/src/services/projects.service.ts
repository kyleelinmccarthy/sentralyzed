import { eq, and, isNull, asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { projects, projectMembers } from '../db/schema/projects.js'

export class ProjectsService {
  async list(filters?: { status?: string; search?: string }) {
    const conditions = [isNull(projects.deletedAt)]

    if (filters?.status) {
      conditions.push(
        eq(projects.status, filters.status as 'active' | 'paused' | 'completed' | 'archived'),
      )
    }

    return db.query.projects.findMany({
      where: and(...conditions),
      orderBy: [asc(projects.priority)],
    })
  }

  async getById(id: string) {
    return db.query.projects.findFirst({
      where: and(eq(projects.id, id), isNull(projects.deletedAt)),
    })
  }

  async create(data: {
    name: string
    description?: string
    goalId?: string
    ownerId: string
    color?: string
    icon?: string
  }) {
    const [project] = await db
      .insert(projects)
      .values({
        name: data.name,
        description: data.description,
        goalId: data.goalId,
        ownerId: data.ownerId,
        color: data.color,
        icon: data.icon,
      })
      .returning()

    // Add owner as lead member
    await db.insert(projectMembers).values({
      projectId: project!.id,
      userId: data.ownerId,
      role: 'lead',
    })

    return project!
  }

  async update(
    id: string,
    data: Partial<{
      name: string
      description: string
      status: 'active' | 'paused' | 'completed' | 'archived'
      priority: number
      color: string
      icon: string
    }>,
  ) {
    const [project] = await db.update(projects).set(data).where(eq(projects.id, id)).returning()
    return project
  }

  async reorder(items: { id: string; priority: number }[]) {
    for (const item of items) {
      await db.update(projects).set({ priority: item.priority }).where(eq(projects.id, item.id))
    }
  }

  async addMember(projectId: string, userId: string, role: 'lead' | 'contributor' | 'viewer') {
    const [member] = await db.insert(projectMembers).values({ projectId, userId, role }).returning()
    return member
  }

  async getMembers(projectId: string) {
    return db.query.projectMembers.findMany({
      where: eq(projectMembers.projectId, projectId),
    })
  }

  async softDelete(id: string) {
    const [project] = await db
      .update(projects)
      .set({ deletedAt: new Date() })
      .where(eq(projects.id, id))
      .returning()
    return project
  }
}

export const projectsService = new ProjectsService()
