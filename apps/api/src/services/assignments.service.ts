import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { entityAssignments } from '../db/schema/assignments.js'
import { activitiesService } from './activities.service.js'
import type { AssignableEntityType, AssignmentRole } from '@sentral/shared/types/assignment'

export class AssignmentsService {
  async assign(data: {
    entityType: AssignableEntityType
    entityId: string
    userId: string
    role?: AssignmentRole
    assignedBy: string
  }) {
    const [assignment] = await db
      .insert(entityAssignments)
      .values({
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        role: data.role ?? null,
        assignedBy: data.assignedBy,
      })
      .onConflictDoNothing()
      .returning()

    if (!assignment) return null

    await activitiesService.log({
      actorId: data.assignedBy,
      action: 'assigned',
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: { userId: data.userId, role: data.role },
      notifyUserIds: [data.userId],
    })

    return assignment
  }

  async findByEntity(entityType: AssignableEntityType, entityId: string) {
    return db.query.entityAssignments.findMany({
      where: and(
        eq(entityAssignments.entityType, entityType),
        eq(entityAssignments.entityId, entityId),
      ),
    })
  }

  async findByUser(userId: string) {
    return db.query.entityAssignments.findMany({
      where: eq(entityAssignments.userId, userId),
    })
  }

  async updateRole(id: string, role: AssignmentRole, actorId?: string) {
    const existing = actorId
      ? await db.query.entityAssignments.findFirst({
          where: eq(entityAssignments.id, id),
        })
      : null

    const [updated] = await db
      .update(entityAssignments)
      .set({ role })
      .where(eq(entityAssignments.id, id))
      .returning()

    if (updated && existing && actorId) {
      await activitiesService.log({
        actorId,
        action: 'updated',
        entityType: existing.entityType,
        entityId: existing.entityId,
        metadata: { change: 'role_updated', role, userId: existing.userId },
        notifyUserIds: [existing.userId],
      })
    }

    return updated
  }

  async remove(id: string, actorId?: string): Promise<boolean> {
    const assignment = await db.query.entityAssignments.findFirst({
      where: eq(entityAssignments.id, id),
    })
    if (!assignment) return false

    await db.delete(entityAssignments).where(eq(entityAssignments.id, id))

    if (actorId) {
      await activitiesService.log({
        actorId,
        action: 'deleted',
        entityType: assignment.entityType,
        entityId: assignment.entityId,
        metadata: { change: 'unassigned', userId: assignment.userId },
        notifyUserIds: [assignment.userId],
      })
    }

    return true
  }
}

export const assignmentsService = new AssignmentsService()
