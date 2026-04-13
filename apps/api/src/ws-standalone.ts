import { createWebSocketServer } from './ws/server.js'

const wsPort = Number(process.env.WS_PORT) || 3002
createWebSocketServer(wsPort)
