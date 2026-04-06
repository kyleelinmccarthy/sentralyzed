import { eq, and, isNull, desc, asc, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { forumCategories, forumThreads, forumReplies, forumReactions } from '../db/schema/forums.js'
import { DEFAULT_PAGE_LIMIT } from './utils/db-helpers.js'

export class ForumsService {
  // Categories
  async listCategories() {
    return db.query.forumCategories.findMany({ orderBy: [asc(forumCategories.position)] })
  }

  async createCategory(data: { name: string; description?: string; color?: string }) {
    const [cat] = await db.insert(forumCategories).values(data).returning()
    return cat!
  }

  async updateCategory(
    id: string,
    data: Partial<{ name: string; description: string; color: string; position: number }>,
  ) {
    const [cat] = await db
      .update(forumCategories)
      .set(data)
      .where(eq(forumCategories.id, id))
      .returning()
    return cat
  }

  async deleteCategory(id: string) {
    await db.delete(forumCategories).where(eq(forumCategories.id, id))
  }

  // Threads
  async listThreads(categoryId?: string, search?: string) {
    if (search) {
      return this.searchThreads(search, DEFAULT_PAGE_LIMIT)
    }
    const conditions = categoryId ? [eq(forumThreads.categoryId, categoryId)] : []
    return db.query.forumThreads.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(forumThreads.isPinned), desc(forumThreads.createdAt)],
      limit: DEFAULT_PAGE_LIMIT,
    })
  }

  async getThread(id: string) {
    const thread = await db.query.forumThreads.findFirst({ where: eq(forumThreads.id, id) })
    if (thread) {
      await db
        .update(forumThreads)
        .set({ viewCount: thread.viewCount + 1 })
        .where(eq(forumThreads.id, id))
    }
    return thread
  }

  async createThread(data: {
    title: string
    content?: unknown
    categoryId: string
    authorId: string
  }) {
    const [thread] = await db.insert(forumThreads).values(data).returning()
    return thread!
  }

  async updateThread(
    id: string,
    data: Partial<{ title: string; content: unknown; isPinned: boolean; isLocked: boolean }>,
  ) {
    const [thread] = await db
      .update(forumThreads)
      .set(data)
      .where(eq(forumThreads.id, id))
      .returning()
    return thread
  }

  async deleteThread(id: string) {
    await db.delete(forumThreads).where(eq(forumThreads.id, id))
  }

  // Replies
  async listReplies(threadId: string) {
    return db.query.forumReplies.findMany({
      where: and(eq(forumReplies.threadId, threadId), isNull(forumReplies.deletedAt)),
      orderBy: [asc(forumReplies.createdAt)],
    })
  }

  async createReply(data: {
    threadId: string
    authorId: string
    content?: unknown
    replyToId?: string
  }) {
    const [reply] = await db.insert(forumReplies).values(data).returning()
    return reply!
  }

  async updateReply(id: string, userId: string, data: { content?: unknown }) {
    const reply = await db.query.forumReplies.findFirst({ where: eq(forumReplies.id, id) })
    if (!reply || reply.authorId !== userId) return null
    const [updated] = await db
      .update(forumReplies)
      .set({ content: data.content })
      .where(eq(forumReplies.id, id))
      .returning()
    return updated
  }

  async deleteReply(id: string) {
    await db.update(forumReplies).set({ deletedAt: new Date() }).where(eq(forumReplies.id, id))
  }

  // Reactions
  async toggleReaction(entityType: string, entityId: string, userId: string, emoji: string) {
    const existing = await db.query.forumReactions.findFirst({
      where: and(
        eq(forumReactions.entityType, entityType),
        eq(forumReactions.entityId, entityId),
        eq(forumReactions.userId, userId),
        eq(forumReactions.emoji, emoji),
      ),
    })
    if (existing) {
      await db.delete(forumReactions).where(eq(forumReactions.id, existing.id))
      return 'removed'
    }
    await db.insert(forumReactions).values({ entityType, entityId, userId, emoji })
    return 'added'
  }

  async search(query: string) {
    const threads = await this.searchThreads(query, 20)
    return { threads }
  }

  private async searchThreads(query: string, limit: number) {
    return db.query.forumThreads.findMany({
      where: sql`to_tsvector('english', ${forumThreads.title}) @@ plainto_tsquery('english', ${query})`,
      orderBy: [desc(forumThreads.createdAt)],
      limit,
    })
  }
}

export const forumsService = new ForumsService()
