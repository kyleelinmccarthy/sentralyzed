import type { WebSocket } from 'ws'
import { redis } from '../lib/redis.js'

interface Connection {
  ws: WebSocket
  userId: string
  userName: string
}

const connections = new Map<string, Connection>()

export function addConnection(connId: string, ws: WebSocket, userId: string, userName: string) {
  connections.set(connId, { ws, userId, userName })
  void redis.sadd(`user:${userId}:connections`, connId)
  void redis.set(`conn:${connId}:user`, userId)
}

export async function removeConnection(connId: string) {
  const conn = connections.get(connId)
  if (conn) {
    await redis.srem(`user:${conn.userId}:connections`, connId)
    await redis.del(`conn:${connId}:user`)
    connections.delete(connId)
  }
}

export function getConnection(connId: string) {
  return connections.get(connId)
}

export function getConnectionsByUserId(userId: string): Connection[] {
  const result: Connection[] = []
  for (const conn of connections.values()) {
    if (conn.userId === userId) result.push(conn)
  }
  return result
}

export function getAllConnections() {
  return connections
}

export async function isUserOnline(userId: string): Promise<boolean> {
  const count = await redis.scard(`user:${userId}:connections`)
  return count > 0
}

export function sendToUser(userId: string, message: string) {
  const userConns = getConnectionsByUserId(userId)
  for (const conn of userConns) {
    if (conn.ws.readyState === 1) {
      conn.ws.send(message)
    }
  }
}

export function broadcastToChannel(
  _channelId: string,
  memberIds: string[],
  message: string,
  excludeUserId?: string,
) {
  for (const userId of memberIds) {
    if (userId === excludeUserId) continue
    const userConns = getConnectionsByUserId(userId)
    for (const conn of userConns) {
      if (conn.ws.readyState === 1) {
        conn.ws.send(message)
      }
    }
  }
}

// ─── Whiteboard Room Tracking ───

// Map<whiteboardId, Map<connId, { userId, userName }>>
const whiteboardRooms = new Map<string, Map<string, { userId: string; userName: string }>>()

export function joinWhiteboardRoom(
  whiteboardId: string,
  connId: string,
  userId: string,
  userName: string,
) {
  if (!whiteboardRooms.has(whiteboardId)) {
    whiteboardRooms.set(whiteboardId, new Map())
  }
  whiteboardRooms.get(whiteboardId)!.set(connId, { userId, userName })
}

export function leaveWhiteboardRoom(whiteboardId: string, connId: string) {
  const room = whiteboardRooms.get(whiteboardId)
  if (!room) return
  room.delete(connId)
  if (room.size === 0) {
    whiteboardRooms.delete(whiteboardId)
  }
}

export function leaveAllWhiteboardRooms(
  connId: string,
): Array<{ whiteboardId: string; userId: string; userName: string }> {
  const affected: Array<{ whiteboardId: string; userId: string; userName: string }> = []
  for (const [whiteboardId, room] of whiteboardRooms) {
    const member = room.get(connId)
    if (member) {
      room.delete(connId)
      affected.push({ whiteboardId, userId: member.userId, userName: member.userName })
      if (room.size === 0) {
        whiteboardRooms.delete(whiteboardId)
      }
    }
  }
  return affected
}

export function getWhiteboardRoomMembers(
  whiteboardId: string,
): Array<{ userId: string; userName: string }> {
  const room = whiteboardRooms.get(whiteboardId)
  if (!room) return []
  const seen = new Map<string, string>()
  for (const member of room.values()) {
    if (!seen.has(member.userId)) {
      seen.set(member.userId, member.userName)
    }
  }
  return Array.from(seen, ([userId, userName]) => ({ userId, userName }))
}

export function broadcastToWhiteboardRoom(
  whiteboardId: string,
  message: string,
  excludeConnId?: string,
) {
  const room = whiteboardRooms.get(whiteboardId)
  if (!room) return
  for (const [connId] of room) {
    if (connId === excludeConnId) continue
    const conn = connections.get(connId)
    if (conn && conn.ws.readyState === 1) {
      conn.ws.send(message)
    }
  }
}
