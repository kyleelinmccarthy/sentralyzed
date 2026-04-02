import { serve } from '@hono/node-server'
import { app } from './app.js'
import { createWebSocketServer } from './ws/server.js'

const port = Number(process.env.PORT) || 3001
const wsPort = Number(process.env.WS_PORT) || 3002

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server running on http://localhost:${info.port}`)
})

createWebSocketServer(wsPort)
