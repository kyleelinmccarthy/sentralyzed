import { createServer, type Server } from 'node:http'
import { WebSocket } from 'ws'
import { describe, it, expect, afterEach } from 'vitest'
import { createWebSocketServer } from '../ws/server.js'

// These tests verify the transport wiring only (port vs shared-server mode).
// Auth flow is exercised by higher-level integration tests; here we just check
// that an unauthenticated connection gets the 4001 close code, which proves the
// server is accepting upgrades on the expected binding.

async function waitForClose(ws: WebSocket): Promise<number> {
  return new Promise((resolve) => {
    ws.on('close', (code) => resolve(code))
    ws.on('error', () => {})
  })
}

describe('createWebSocketServer', () => {
  let httpServer: Server | undefined
  let wss: ReturnType<typeof createWebSocketServer> | undefined

  afterEach(async () => {
    if (wss) await new Promise<void>((r) => wss!.close(() => r()))
    if (httpServer) await new Promise<void>((r) => httpServer!.close(() => r()))
    wss = undefined
    httpServer = undefined
  })

  it('attaches to an existing HTTP server (shared-port mode)', async () => {
    httpServer = createServer()
    await new Promise<void>((r) => httpServer!.listen(0, () => r()))
    const port = (httpServer.address() as { port: number }).port

    wss = createWebSocketServer({ server: httpServer })
    expect(wss).toBeDefined()

    const ws = new WebSocket(`ws://localhost:${port}`)
    const closeCode = await waitForClose(ws)
    expect(closeCode).toBe(4001)
  })

  it('creates its own server when given a port (separate-port mode)', async () => {
    wss = createWebSocketServer({ port: 0 })
    const address = wss.address()
    expect(address).toBeDefined()
    expect(typeof address === 'object' && address !== null && 'port' in address).toBe(true)
    const port = (address as { port: number }).port
    expect(port).toBeGreaterThan(0)

    const ws = new WebSocket(`ws://localhost:${port}`)
    const closeCode = await waitForClose(ws)
    expect(closeCode).toBe(4001)
  })
})
