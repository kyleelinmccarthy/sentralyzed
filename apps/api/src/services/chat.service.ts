import { eq, and, desc, lt, isNull, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { channels, channelMembers, messages, reactions } from '../db/schema/chat.js'
import { users } from '../db/schema/users.js'
import { DEFAULT_PAGE_LIMIT } from './utils/db-helpers.js'

export class ChatService {
  async listChannels(userId: string) {
    const memberships = await db.query.channelMembers.findMany({
      where: eq(channelMembers.userId, userId),
    })
    const channelIds = memberships.map((m) => m.channelId)
    if (channelIds.length === 0) return []

    const channelList = await db.query.channels.findMany({
      where: sql`${channels.id} IN ${channelIds}`,
    })

    // Batch-fetch all DM members and other users upfront to avoid N+1 queries
    const dmChannels = channelList.filter((ch) => ch.type === 'direct')
    const dmMembersMap = new Map<string, string>()

    if (dmChannels.length > 0) {
      const dmChannelIds = dmChannels.map((ch) => ch.id)
      const allDmMembers = await db.query.channelMembers.findMany({
        where: sql`${channelMembers.channelId} IN ${dmChannelIds}`,
      })

      const otherUserIds: string[] = []
      for (const ch of dmChannels) {
        const otherMember = allDmMembers.find((m) => m.channelId === ch.id && m.userId !== userId)
        if (otherMember) {
          otherUserIds.push(otherMember.userId)
          dmMembersMap.set(ch.id, otherMember.userId)
        }
      }

      if (otherUserIds.length > 0) {
        const otherUsers = await db.query.users.findMany({
          where: sql`${users.id} IN ${otherUserIds}`,
          columns: { id: true, name: true },
        })
        const userNameMap = new Map(otherUsers.map((u) => [u.id, u.name]))
        for (const [channelId, otherUserId] of dmMembersMap) {
          const name = userNameMap.get(otherUserId)
          if (name) dmMembersMap.set(channelId, name)
        }
      }
    }

    return Promise.all(
      channelList.map(async (ch) => {
        const membership = memberships.find((m) => m.channelId === ch.id)
        const lastRead = membership?.lastReadAt
        const unreadCount = lastRead
          ? (
              await db.query.messages.findMany({
                where: and(
                  eq(messages.channelId, ch.id),
                  isNull(messages.deletedAt),
                  sql`${messages.createdAt} > ${lastRead.toISOString()}`,
                ),
              })
            ).length
          : 0

        const displayName = ch.type === 'direct' ? (dmMembersMap.get(ch.id) ?? ch.name) : ch.name

        return { ...ch, name: displayName, unreadCount }
      }),
    )
  }

  async createChannel(data: {
    name: string
    description?: string
    type: 'public' | 'private' | 'direct'
    projectId?: string
    createdBy: string
  }) {
    const [channel] = await db.insert(channels).values(data).returning()
    await db.insert(channelMembers).values({ channelId: channel!.id, userId: data.createdBy })
    return channel!
  }

  async getOrCreateDM(userId1: string, userId2: string) {
    const [user1Channels, user2Channels] = await Promise.all([
      db.query.channelMembers.findMany({ where: eq(channelMembers.userId, userId1) }),
      db.query.channelMembers.findMany({ where: eq(channelMembers.userId, userId2) }),
    ])
    const user1ChannelIds = new Set(user1Channels.map((m) => m.channelId))
    const sharedChannelIds = user2Channels
      .filter((m) => user1ChannelIds.has(m.channelId))
      .map((m) => m.channelId)

    if (sharedChannelIds.length > 0) {
      const existing = await db.query.channels.findFirst({
        where: and(eq(channels.type, 'direct'), sql`${channels.id} IN ${sharedChannelIds}`),
      })
      if (existing) return existing
    }

    const [channel] = await db
      .insert(channels)
      .values({
        name: `dm-${userId1}-${userId2}`,
        type: 'direct',
        createdBy: userId1,
      })
      .returning()
    await db.insert(channelMembers).values([
      { channelId: channel!.id, userId: userId1 },
      { channelId: channel!.id, userId: userId2 },
    ])
    return channel!
  }

  async updateChannel(id: string, data: { name?: string; description?: string }) {
    const channel = await db.query.channels.findFirst({ where: eq(channels.id, id) })
    if (!channel || channel.type === 'direct') return null
    const [updated] = await db.update(channels).set(data).where(eq(channels.id, id)).returning()
    return updated
  }

  async getMessages(channelId: string, cursor?: string, limit = DEFAULT_PAGE_LIMIT) {
    const conditions = [eq(messages.channelId, channelId), isNull(messages.deletedAt)]
    if (cursor) {
      conditions.push(lt(messages.createdAt, new Date(cursor)))
    }
    return db.query.messages.findMany({
      where: and(...conditions),
      orderBy: [desc(messages.createdAt)],
      limit,
    })
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const msg = await db.query.messages.findFirst({ where: eq(messages.id, messageId) })
    if (!msg || msg.authorId !== userId) return null
    const [updated] = await db
      .update(messages)
      .set({ content, editedAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning()
    return updated
  }

  async deleteMessage(messageId: string, userId: string) {
    const msg = await db.query.messages.findFirst({ where: eq(messages.id, messageId) })
    if (!msg || msg.authorId !== userId) return false
    await db.update(messages).set({ deletedAt: new Date() }).where(eq(messages.id, messageId))
    return true
  }

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const existing = await db.query.reactions.findFirst({
      where: and(
        eq(reactions.messageId, messageId),
        eq(reactions.userId, userId),
        eq(reactions.emoji, emoji),
      ),
    })
    if (existing) {
      await db.delete(reactions).where(eq(reactions.id, existing.id))
      return 'removed'
    }
    await db.insert(reactions).values({ messageId, userId, emoji })
    return 'added'
  }

  async getReactions(messageId: string) {
    return db.query.reactions.findMany({ where: eq(reactions.messageId, messageId) })
  }

  async markRead(channelId: string, userId: string) {
    await db
      .update(channelMembers)
      .set({ lastReadAt: new Date() })
      .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)))
  }

  async addMember(channelId: string, userId: string) {
    await db.insert(channelMembers).values({ channelId, userId }).onConflictDoNothing()
  }

  async getMembers(channelId: string) {
    return db.query.channelMembers.findMany({ where: eq(channelMembers.channelId, channelId) })
  }
}

export const chatService = new ChatService()
