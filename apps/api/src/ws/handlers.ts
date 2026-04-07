import { redisSub } from '../lib/redis.js'
import {
  broadcastToChannel,
  getConnection,
  getAllConnections,
  joinWhiteboardRoom,
  leaveWhiteboardRoom,
  getWhiteboardRoomMembers,
  broadcastToWhiteboardRoom,
} from './connections.js'
import {
  chatMessagePayloadSchema,
  typingPayloadSchema,
  reactionPayloadSchema,
  whiteboardJoinPayloadSchema,
  whiteboardLeavePayloadSchema,
  whiteboardViewportPayloadSchema,
} from '@sentral/shared/validators/websocket'
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
      await handleChatMessage(connId, conn.userId, conn.userName, parsed.payload)
      break
    case 'chat:typing':
      await handleTyping(conn.userId, conn.userName, parsed.payload)
      break
    case 'chat:reaction':
      await handleReaction(conn.userId, parsed.payload)
      break
    case 'whiteboard:join':
      handleWhiteboardJoin(connId, conn.userId, conn.userName, parsed.payload)
      break
    case 'whiteboard:leave':
      handleWhiteboardLeave(connId, parsed.payload)
      break
    case 'whiteboard:viewport':
      handleWhiteboardViewport(connId, conn.userId, conn.userName, parsed.payload)
      break
    case 'presence:ping':
      conn.ws.send(JSON.stringify({ type: 'presence:pong', timestamp: new Date().toISOString() }))
      break
  }
}

async function handleChatMessage(
  connId: string,
  userId: string,
  userName: string,
  payload: unknown,
) {
  const parsed = chatMessagePayloadSchema.safeParse(payload)
  if (!parsed.success) return

  const { channelId, content, replyToId, tempId } = parsed.data

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

  // Send ack to sender with real message ID so they can replace the temp ID
  if (tempId) {
    const senderConn = getConnection(connId)
    if (senderConn && senderConn.ws.readyState === 1) {
      senderConn.ws.send(
        JSON.stringify({
          type: 'chat:message:ack',
          payload: { tempId, messageId: msg!.id },
          timestamp: new Date().toISOString(),
        }),
      )
    }
  }

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

// ─── Whiteboard Handlers ───

function broadcastWhiteboardPresence(whiteboardId: string) {
  const users = getWhiteboardRoomMembers(whiteboardId)
  const msg = JSON.stringify({
    type: 'whiteboard:presence',
    payload: { whiteboardId, users },
    timestamp: new Date().toISOString(),
  })
  broadcastToWhiteboardRoom(whiteboardId, msg)
}

function handleWhiteboardJoin(connId: string, userId: string, userName: string, payload: unknown) {
  const parsed = whiteboardJoinPayloadSchema.safeParse(payload)
  if (!parsed.success) return

  const { whiteboardId } = parsed.data
  joinWhiteboardRoom(whiteboardId, connId, userId, userName)
  broadcastWhiteboardPresence(whiteboardId)
}

function handleWhiteboardLeave(connId: string, payload: unknown) {
  const parsed = whiteboardLeavePayloadSchema.safeParse(payload)
  if (!parsed.success) return

  const { whiteboardId } = parsed.data
  leaveWhiteboardRoom(whiteboardId, connId)
  broadcastWhiteboardPresence(whiteboardId)
}

function handleWhiteboardViewport(
  connId: string,
  userId: string,
  userName: string,
  payload: unknown,
) {
  const parsed = whiteboardViewportPayloadSchema.safeParse(payload)
  if (!parsed.success) return

  const { whiteboardId, pan, zoom } = parsed.data
  const msg = JSON.stringify({
    type: 'whiteboard:viewport',
    payload: { whiteboardId, userId, userName, pan, zoom },
    timestamp: new Date().toISOString(),
  })
  broadcastToWhiteboardRoom(whiteboardId, msg, connId)
}
