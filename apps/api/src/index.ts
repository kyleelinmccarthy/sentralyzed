import { serve } from '@hono/node-server'
import { app } from './app.js'

const port = Number(process.env.PORT) || 3001

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server running on http://localhost:${info.port}`)
})

// Start WebSocket server alongside API in local dev
if (process.env.ENABLE_WS === 'true') {
  const wsPort = Number(process.env.WS_PORT) || 3002
  import('./ws/server.js').then(({ createWebSocketServer }) => {
    createWebSocketServer(wsPort)
  })
}
