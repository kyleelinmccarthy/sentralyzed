import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { pinnedMessages } from '../db/schema/pins.js'
import { messages } from '../db/schema/chat.js'
import { forumReplies } from '../db/schema/forums.js'

type EntityType = 'message' | 'forum_reply'

export class PinService {
  async pinMessage(messageId: string, userId: string) {
    const msg = await db.query.messages.findFirst({ where: eq(messages.id, messageId) })
    if (!msg) return null

    if (await this.isPinned('message', messageId)) return null

    const [pin] = await db
      .insert(pinnedMessages)
      .values({ entityType: 'message', entityId: messageId, pinnedBy: userId })
      .returning()
    return pin!
  }

  async unpinMessage(messageId: string) {
    return this.unpin('message', messageId)
  }

  async pinForumReply(replyId: string, userId: string) {
    const reply = await db.query.forumReplies.findFirst({ where: eq(forumReplies.id, replyId) })
    if (!reply) return null

    if (await this.isPinned('forum_reply', replyId)) return null

    const [pin] = await db
      .insert(pinnedMessages)
      .values({ entityType: 'forum_reply', entityId: replyId, pinnedBy: userId })
      .returning()
    return pin!
  }

  async unpinForumReply(replyId: string) {
    return this.unpin('forum_reply', replyId)
  }

  async getPinnedMessages(channelId: string) {
    // Get message IDs belonging to this channel, then find which are pinned
    const channelMessages = await db.query.messages.findMany({
      where: eq(messages.channelId, channelId),
      columns: { id: true },
    })
    const messageIds = channelMessages.map((m) => m.id)
    if (messageIds.length === 0) return []

    return db.query.pinnedMessages.findMany({
      where: and(
        eq(pinnedMessages.entityType, 'message'),
        inArray(pinnedMessages.entityId, messageIds),
      ),
    })
  }

  async getPinnedForumReplies(threadId: string) {
    // Get reply IDs belonging to this thread, then find which are pinned
    const threadReplies = await db.query.forumReplies.findMany({
      where: eq(forumReplies.threadId, threadId),
      columns: { id: true },
    })
    const replyIds = threadReplies.map((r) => r.id)
    if (replyIds.length === 0) return []

    return db.query.pinnedMessages.findMany({
      where: and(
        eq(pinnedMessages.entityType, 'forum_reply'),
        inArray(pinnedMessages.entityId, replyIds),
      ),
    })
  }

  async isPinned(entityType: EntityType, entityId: string): Promise<boolean> {
    const pin = await db.query.pinnedMessages.findFirst({
      where: and(eq(pinnedMessages.entityType, entityType), eq(pinnedMessages.entityId, entityId)),
    })
    return !!pin
  }

  private async unpin(entityType: EntityType, entityId: string): Promise<boolean> {
    const pin = await db.query.pinnedMessages.findFirst({
      where: and(eq(pinnedMessages.entityType, entityType), eq(pinnedMessages.entityId, entityId)),
    })
    if (!pin) return false
    await db.delete(pinnedMessages).where(eq(pinnedMessages.id, pin.id))
    return true
  }
}

export const pinService = new PinService()
