import { WebSocketServer, type WebSocket } from 'ws'
import type { IncomingMessage, Server } from 'node:http'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { getSessionFromHeaders } from '../lib/better-auth.js'
import { db } from '../db/index.js'
import { users } from '../db/schema/users.js'
import {
  addConnection,
  removeConnection,
  getAllConnections,
  leaveAllWhiteboardRooms,
  getWhiteboardRoomMembers,
  broadcastToWhiteboardRoom,
} from './connections.js'
import { handleMessage } from './handlers.js'

const HEARTBEAT_INTERVAL = 30_000

// Accepts either a dedicated port (local dev) or an existing HTTP server
// (production — Railway exposes a single port per service, so WS and HTTP share it).
export type WsServerOpts = { port: number } | { server: Server }

export function createWebSocketServer(opts: WsServerOpts) {
  const wss =
    'server' in opts
      ? new WebSocketServer({ server: opts.server })
      : new WebSocketServer({ port: opts.port })

  if ('port' in opts) {
    console.log(`WebSocket server running on ws://localhost:${opts.port}`)
  } else {
    console.log('WebSocket server attached to existing HTTP server (shared port)')
  }

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const connId = randomUUID()

    // Authenticate via Better Auth — verifies the signed session cookie.
    const headers = new Headers()
    if (req.headers.cookie) headers.set('cookie', req.headers.cookie)

    const session = await getSessionFromHeaders(headers)
    if (!session?.user) {
      ws.close(4001, 'Unauthorized')
      return
    }

    // Look up our local user row to confirm they're still active and to grab
    // the display name (Better Auth's session.user.name should match).
    const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) })
    if (!user || !user.isActive) {
      ws.close(4001, 'Forbidden')
      return
    }

    addConnection(connId, ws, user.id, user.name)

    // Broadcast presence
    for (const [, conn] of getAllConnections()) {
      if (conn.ws.readyState === 1 && conn.userId !== user.id) {
        conn.ws.send(
          JSON.stringify({
            type: 'presence:online',
            payload: { userId: user.id, userName: user.name },
            timestamp: new Date().toISOString(),
          }),
        )
      }
    }

    // Heartbeat
    let alive = true
    const heartbeat = setInterval(() => {
      if (!alive) {
        ws.terminate()
        return
      }
      alive = false
      ws.ping()
    }, HEARTBEAT_INTERVAL)

    ws.on('pong', () => {
      alive = true
    })

    ws.on('message', (data) => {
      void handleMessage(connId, data.toString())
    })

    ws.on('close', () => {
      clearInterval(heartbeat)

      // Clean up whiteboard rooms before removing connection
      const affectedRooms = leaveAllWhiteboardRooms(connId)
      for (const { whiteboardId } of affectedRooms) {
        const roomUsers = getWhiteboardRoomMembers(whiteboardId)
        const presenceMsg = JSON.stringify({
          type: 'whiteboard:presence',
          payload: { whiteboardId, users: roomUsers },
          timestamp: new Date().toISOString(),
        })
        broadcastToWhiteboardRoom(whiteboardId, presenceMsg)
      }

      removeConnection(connId)

      // Broadcast offline
      for (const [, conn] of getAllConnections()) {
        if (conn.ws.readyState === 1) {
          conn.ws.send(
            JSON.stringify({
              type: 'presence:offline',
              payload: { userId: user.id, userName: user.name },
              timestamp: new Date().toISOString(),
            }),
          )
        }
      }
    })
  })

  return wss
}
