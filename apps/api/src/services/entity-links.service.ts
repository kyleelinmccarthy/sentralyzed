import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { entityLinks } from '../db/schema/entity-links.js'
import type { SourceType, TargetType } from '@sentralyzed/shared/types/entity-link'

const SOURCE_QUERIES: Record<SourceType, keyof typeof db.query> = {
  message: 'messages',
  forum_thread: 'forumThreads',
  forum_reply: 'forumReplies',
}

const TARGET_QUERIES: Record<TargetType, keyof typeof db.query> = {
  project: 'projects',
  goal: 'goals',
  task: 'tasks',
  asset: 'assets',
}

export class EntityLinksService {
  async create(data: {
    sourceType: SourceType
    sourceId: string
    targetType: TargetType
    targetId: string
    createdBy: string
  }) {
    await this.validateSourceExists(data.sourceType, data.sourceId)
    await this.validateTargetExists(data.targetType, data.targetId)

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

  async removeBySource(sourceType: SourceType, sourceId: string) {
    await db
      .delete(entityLinks)
      .where(and(eq(entityLinks.sourceType, sourceType), eq(entityLinks.sourceId, sourceId)))
  }

  async removeByTarget(targetType: TargetType, targetId: string) {
    await db
      .delete(entityLinks)
      .where(and(eq(entityLinks.targetType, targetType), eq(entityLinks.targetId, targetId)))
  }

  private async validateSourceExists(sourceType: SourceType, sourceId: string) {
    const queryKey = SOURCE_QUERIES[sourceType]
    const entity = await (db.query[queryKey] as any).findFirst({
      where: (t: any, { eq }: any) => eq(t.id, sourceId),
    })
    if (!entity) throw new EntityNotFoundError(`Source ${sourceType} not found`)
  }

  private async validateTargetExists(targetType: TargetType, targetId: string) {
    const queryKey = TARGET_QUERIES[targetType]
    const entity = await (db.query[queryKey] as any).findFirst({
      where: (t: any, { eq }: any) => eq(t.id, targetId),
    })
    if (!entity) throw new EntityNotFoundError(`Target ${targetType} not found`)
  }
}

export class EntityNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EntityNotFoundError'
  }
}

export const entityLinksService = new EntityLinksService()
