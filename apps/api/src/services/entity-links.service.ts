import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { entityLinks } from '../db/schema/entity-links.js'
import type { SourceType, TargetType } from '@sentralyzed/shared/types/entity-link'

export class EntityLinksService {
  async create(data: {
    sourceType: SourceType
    sourceId: string
    targetType: TargetType
    targetId: string
    createdBy: string
  }) {
    const [link] = await db.insert(entityLinks).values(data).returning()
    return link!
  }

  async findBySource(sourceType: SourceType, sourceId: string) {
    return db.query.entityLinks.findMany({
      where: and(eq(entityLinks.sourceType, sourceType), eq(entityLinks.sourceId, sourceId)),
    })
  }

  async findByTarget(targetType: TargetType, targetId: string) {
    return db.query.entityLinks.findMany({
      where: and(eq(entityLinks.targetType, targetType), eq(entityLinks.targetId, targetId)),
    })
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const link = await db.query.entityLinks.findFirst({
      where: eq(entityLinks.id, id),
    })
    if (!link || link.createdBy !== userId) return false
    await db.delete(entityLinks).where(eq(entityLinks.id, id))
    return true
  }
}

export const entityLinksService = new EntityLinksService()
