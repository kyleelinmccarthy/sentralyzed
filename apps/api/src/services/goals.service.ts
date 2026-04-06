import { eq, and, isNull, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { goals } from '../db/schema/goals.js'
import { whereActiveById, softDelete } from './utils/db-helpers.js'

export class GoalsService {
  async list(filters?: { level?: string; status?: string; ownerId?: string }) {
    const conditions = [isNull(goals.deletedAt)]

    if (filters?.level) {
      conditions.push(eq(goals.level, filters.level as 'company' | 'team' | 'personal'))
    }
    if (filters?.status) {
      conditions.push(
        eq(
          goals.status,
          filters.status as 'not_started' | 'in_progress' | 'completed' | 'archived',
        ),
      )
    }
    if (filters?.ownerId) {
      conditions.push(eq(goals.ownerId, filters.ownerId))
    }

    return db.query.goals.findMany({
      where: and(...conditions),
      orderBy: (g, { desc }) => [desc(g.createdAt)],
    })
  }

  async getById(id: string) {
    return db.query.goals.findFirst({
      where: whereActiveById(goals.id, id, goals.deletedAt),
    })
  }

  async getTree(id: string) {
    // Recursive CTE to get full alignment tree
    const result = await db.execute(sql`
      WITH RECURSIVE goal_tree AS (
        SELECT *, 0 as depth
        FROM goals
        WHERE id = ${id} AND deleted_at IS NULL
        UNION ALL
        SELECT g.*, gt.depth + 1
        FROM goals g
        INNER JOIN goal_tree gt ON g.parent_goal_id = gt.id
        WHERE g.deleted_at IS NULL
      )
      SELECT * FROM goal_tree ORDER BY depth, created_at
    `)
    return result
  }

  async create(data: {
    title: string
    description?: string
    level: 'company' | 'team' | 'personal'
    parentGoalId?: string
    ownerId: string
    teamId?: string
    targetDate?: string
  }) {
    const [goal] = await db
      .insert(goals)
      .values({
        title: data.title,
        description: data.description,
        level: data.level,
        parentGoalId: data.parentGoalId,
        ownerId: data.ownerId,
        teamId: data.teamId,
        targetDate: data.targetDate,
      })
      .returning()
    return goal!
  }

  async update(
    id: string,
    data: Partial<{
      title: string
      description: string
      status: 'not_started' | 'in_progress' | 'completed' | 'archived'
      targetDate: string
    }>,
  ) {
    const [goal] = await db.update(goals).set(data).where(eq(goals.id, id)).returning()
    return goal
  }

  async updateProgress(id: string, progress: number) {
    const [goal] = await db
      .update(goals)
      .set({ progressPercentage: Math.min(100, Math.max(0, progress)) })
      .where(eq(goals.id, id))
      .returning()

    // Recalculate parent's progress
    if (goal?.parentGoalId) {
      await this.recalculateParentProgress(goal.parentGoalId)
    }

    return goal
  }

  private async recalculateParentProgress(parentId: string) {
    const children = await db.query.goals.findMany({
      where: and(eq(goals.parentGoalId, parentId), isNull(goals.deletedAt)),
    })

    if (children.length === 0) return

    const avgProgress = Math.round(
      children.reduce((sum, c) => sum + c.progressPercentage, 0) / children.length,
    )

    const [parent] = await db
      .update(goals)
      .set({ progressPercentage: avgProgress })
      .where(eq(goals.id, parentId))
      .returning()

    // Recurse up the tree
    if (parent?.parentGoalId) {
      await this.recalculateParentProgress(parent.parentGoalId)
    }
  }

  async softDelete(id: string) {
    return softDelete(goals, goals.id, id)
  }
}

export const goalsService = new GoalsService()
