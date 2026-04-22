import { serve } from '@hono/node-server'
import type { Server } from 'node:http'
import { app } from './app.js'
import { createWebSocketServer } from './ws/server.js'

const port = Number(process.env.PORT) || 3001

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server running on http://localhost:${info.port}`)
}) as unknown as Server

// WS mode is derived from env:
// - No WS_PORT (or WS_PORT === PORT) → attach to HTTP server (Railway single-port).
// - WS_PORT !== PORT → bind separate port (local dev convenience).
if (process.env.ENABLE_WS !== 'false') {
  const wsPort = Number(process.env.WS_PORT) || port
  if (wsPort === port) {
    createWebSocketServer({ server })
  } else {
    createWebSocketServer({ port: wsPort })
  }
}
