import { redisSub } from '../lib/redis.js'
import { broadcastToChannel, getConnection, getAllConnections } from './connections.js'
import {
  chatMessagePayloadSchema,
  typingPayloadSchema,
  reactionPayloadSchema,
} from '@sentralyzed/shared/validators/websocket'
import { db } from '../db/index.js'
import { messages, reactions, channelMembers } from '../db/schema/chat.js'
import { eq } from 'drizzle-orm'

export async function setupPubSub() {
  await redisSub.subscribe('chat:broadcast', 'presence:broadcast')

  redisSub.on('message', (channel, message) => {
    if (channel === 'chat:broadcast' || channel === 'presence:broadcast') {
      // Broadcast to all local connections
      for (const [, conn] of getAllConnections()) {
        if (conn.ws.readyState === 1) {
          conn.ws.send(message)
        }
      }
    }
  })
}

export async function handleMessage(connId: string, data: string) {
  const conn = getConnection(connId)
  if (!conn) return

  let parsed: { type: string; payload: unknown }
  try {
    parsed = JSON.parse(data) as { type: string; payload: unknown }
  } catch {
    return
  }

  switch (parsed.type) {
    case 'chat:message':
      await handleChatMessage(conn.userId, conn.userName, parsed.payload)
      break
    case 'chat:typing':
      await handleTyping(conn.userId, conn.userName, parsed.payload)
      break
    case 'chat:reaction':
      await handleReaction(conn.userId, parsed.payload)
      break
    case 'presence:ping':
      conn.ws.send(JSON.stringify({ type: 'presence:pong', timestamp: new Date().toISOString() }))
      break
  }
}

async function handleChatMessage(userId: string, userName: string, payload: unknown) {
  const parsed = chatMessagePayloadSchema.safeParse(payload)
  if (!parsed.success) return

  const { channelId, content, replyToId } = parsed.data

  // Save to database
  const [msg] = await db
    .insert(messages)
    .values({
      channelId,
      authorId: userId,
      content,
      replyToId,
    })
    .returning()

  // Get channel member IDs
  const members = await db.query.channelMembers.findMany({
    where: eq(channelMembers.channelId, channelId),
  })
  const memberIds = members.map((m) => m.userId)

  const broadcastMsg = JSON.stringify({
    type: 'chat:message',
    payload: {
      channelId,
      messageId: msg!.id,
      authorId: userId,
      authorName: userName,
      content,
      replyToId,
      createdAt: msg!.createdAt.toISOString(),
    },
    timestamp: new Date().toISOString(),
  })

  broadcastToChannel(channelId, memberIds, broadcastMsg, userId)
}

async function handleTyping(userId: string, userName: string, payload: unknown) {
  const parsed = typingPayloadSchema.safeParse(payload)
  if (!parsed.success) return

  const members = await db.query.channelMembers.findMany({
    where: eq(channelMembers.channelId, parsed.data.channelId),
  })
  const memberIds = members.map((m) => m.userId)

  const msg = JSON.stringify({
    type: 'chat:typing',
    payload: { channelId: parsed.data.channelId, userId, userName },
    timestamp: new Date().toISOString(),
  })

  broadcastToChannel(parsed.data.channelId, memberIds, msg, userId)
}

async function handleReaction(userId: string, payload: unknown) {
  const parsed = reactionPayloadSchema.safeParse(payload)
  if (!parsed.success) return

  const { messageId, emoji, action } = parsed.data

  if (action === 'add') {
    await db.insert(reactions).values({ messageId, userId, emoji }).onConflictDoNothing()
  } else {
    await db.delete(reactions).where(eq(reactions.messageId, messageId))
  }

  // Get channel for this message
  const msg = await db.query.messages.findFirst({ where: eq(messages.id, messageId) })
  if (!msg) return

  const members = await db.query.channelMembers.findMany({
    where: eq(channelMembers.channelId, msg.channelId),
  })

  const broadcastMsg = JSON.stringify({
    type: 'chat:reaction',
    payload: { messageId, userId, emoji, action },
    timestamp: new Date().toISOString(),
  })

  broadcastToChannel(
    msg.channelId,
    members.map((m) => m.userId),
    broadcastMsg,
  )
}
