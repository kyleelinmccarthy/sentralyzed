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
