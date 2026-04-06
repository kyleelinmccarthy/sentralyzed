import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { pinnedMessages } from '../db/schema/pins.js'
import { messages } from '../db/schema/chat.js'
import { forumReplies } from '../db/schema/forums.js'

type EntityType = 'message' | 'forum_reply'

const ENTITY_VALIDATORS: Record<EntityType, (id: string) => Promise<boolean>> = {
  message: async (id) => !!(await db.query.messages.findFirst({ where: eq(messages.id, id) })),
  forum_reply: async (id) =>
    !!(await db.query.forumReplies.findFirst({ where: eq(forumReplies.id, id) })),
}

export class PinService {
  async pinMessage(messageId: string, userId: string) {
    return this.pin('message', messageId, userId)
  }

  async unpinMessage(messageId: string) {
    return this.unpin('message', messageId)
  }

  async pinForumReply(replyId: string, userId: string) {
    return this.pin('forum_reply', replyId, userId)
  }

  async unpinForumReply(replyId: string) {
    return this.unpin('forum_reply', replyId)
  }

  async getPinnedMessages(channelId: string) {
    const channelMessages = await db.query.messages.findMany({
      where: eq(messages.channelId, channelId),
      columns: { id: true },
    })
    return this.findPinnedByIds(
      'message',
      channelMessages.map((m) => m.id),
    )
  }

  async getPinnedForumReplies(threadId: string) {
    const threadReplies = await db.query.forumReplies.findMany({
      where: eq(forumReplies.threadId, threadId),
      columns: { id: true },
    })
    return this.findPinnedByIds(
      'forum_reply',
      threadReplies.map((r) => r.id),
    )
  }

  async isPinned(entityType: EntityType, entityId: string): Promise<boolean> {
    const pin = await db.query.pinnedMessages.findFirst({
      where: and(eq(pinnedMessages.entityType, entityType), eq(pinnedMessages.entityId, entityId)),
    })
    return !!pin
  }

  private async pin(entityType: EntityType, entityId: string, userId: string) {
    const exists = await ENTITY_VALIDATORS[entityType](entityId)
    if (!exists) return null

    if (await this.isPinned(entityType, entityId)) return null

    const [pin] = await db
      .insert(pinnedMessages)
      .values({ entityType, entityId, pinnedBy: userId })
      .returning()
    return pin!
  }

  private async unpin(entityType: EntityType, entityId: string): Promise<boolean> {
    const pin = await db.query.pinnedMessages.findFirst({
      where: and(eq(pinnedMessages.entityType, entityType), eq(pinnedMessages.entityId, entityId)),
    })
    if (!pin) return false
    await db.delete(pinnedMessages).where(eq(pinnedMessages.id, pin.id))
    return true
  }

  private async findPinnedByIds(entityType: EntityType, ids: string[]) {
    if (ids.length === 0) return []

    return db.query.pinnedMessages.findMany({
      where: and(eq(pinnedMessages.entityType, entityType), inArray(pinnedMessages.entityId, ids)),
    })
  }
}

export const pinService = new PinService()
