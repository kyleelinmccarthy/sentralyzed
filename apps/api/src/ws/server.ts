import { WebSocketServer, type WebSocket } from 'ws'
import type { IncomingMessage } from 'node:http'
import { randomUUID } from 'node:crypto'
import { parse as parseCookie } from 'cookie'
import { authService } from '../services/auth.service.js'
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
const SESSION_COOKIE = 'sentral_session'

export function createWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port })

  console.log(`WebSocket server running on ws://localhost:${port}`)

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const connId = randomUUID()

    // Authenticate via cookie
    const cookies = parseCookie(req.headers.cookie || '')
    const token = cookies[SESSION_COOKIE]

    if (!token) {
      ws.close(4001, 'Unauthorized')
      return
    }

    const session = await authService.validateSession(token)
    if (!session) {
      ws.close(4001, 'Invalid session')
      return
    }

    const { user } = session
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
        const users = getWhiteboardRoomMembers(whiteboardId)
        const presenceMsg = JSON.stringify({
          type: 'whiteboard:presence',
          payload: { whiteboardId, users },
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
