#!/usr/bin/env node

/**
 * Simulates a second user in a whiteboard for testing presence & follow.
 *
 * Usage:
 *   node scripts/simulate-whiteboard-user.mjs <email> <password> <whiteboardId>
 *
 * Example:
 *   node scripts/simulate-whiteboard-user.mjs test@example.com password123 some-uuid-here
 *
 * The simulated user will:
 *   1. Log in via the API
 *   2. Connect to the WebSocket server
 *   3. Join the specified whiteboard room
 *   4. Pan around slowly so you can test following their viewport
 *
 * Press Ctrl+C to disconnect (triggers presence:offline + whiteboard leave).
 */

import WebSocket from 'ws'

const API_URL = process.env.API_URL || 'http://localhost:3001'
const WS_URL = process.env.WS_URL || 'ws://localhost:3002'

const [email, password, whiteboardId] = process.argv.slice(2)

if (!email || !password || !whiteboardId) {
  console.error(
    'Usage: node scripts/simulate-whiteboard-user.mjs <email> <password> <whiteboardId>',
  )
  process.exit(1)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

async function main() {
  // Step 1: Log in
  console.log(`Logging in as ${email}...`)
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text())
    process.exit(1)
  }

  // Extract session cookie
  const setCookies = loginRes.headers.getSetCookie()
  const sessionCookie = setCookies.find((c) => c.startsWith('sentral_session='))?.split(';')[0]

  if (!sessionCookie) {
    console.error('No session cookie received')
    process.exit(1)
  }

  const userData = await loginRes.json()
  console.log(`Logged in as: ${userData.user.name} (${userData.user.id})`)

  // Step 2: Connect to WebSocket
  console.log(`Connecting to ${WS_URL}...`)
  const ws = new WebSocket(WS_URL, {
    headers: { Cookie: sessionCookie },
  })

  function send(type, payload) {
    ws.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }))
  }

  ws.on('open', () => {
    console.log('WebSocket connected!')
    console.log(`Joining whiteboard ${whiteboardId}...`)
    send('whiteboard:join', { whiteboardId })

    // Step 3: Simulate viewport — move to a position, hold, move again
    const waypoints = [
      { pan: { x: 0, y: 0 }, zoom: 1 },
      { pan: { x: -200, y: -100 }, zoom: 1.2 },
      { pan: { x: 300, y: 50 }, zoom: 0.8 },
      { pan: { x: -100, y: 250 }, zoom: 1.5 },
      { pan: { x: 150, y: -200 }, zoom: 1 },
    ]

    let wpIndex = 0
    let current = { ...waypoints[0].pan }
    let currentZoom = waypoints[0].zoom
    let target = waypoints[1]
    let progress = 0

    console.log('\nSimulating viewport — moves to a new position every ~3 seconds')
    console.log('Press Ctrl+C to disconnect\n')

    const interval = setInterval(() => {
      // Lerp toward target
      progress += 0.02 // ~50 steps at 100ms = ~5s per move
      const t = Math.min(progress, 1)
      const ease = t * t * (3 - 2 * t) // smoothstep

      current.x = lerp(waypoints[wpIndex].pan.x, target.pan.x, ease)
      current.y = lerp(waypoints[wpIndex].pan.y, target.pan.y, ease)
      currentZoom = lerp(waypoints[wpIndex].zoom, target.zoom, ease)

      send('whiteboard:viewport', {
        whiteboardId,
        pan: { x: current.x, y: current.y },
        zoom: currentZoom,
      })

      process.stdout.write(
        `\r  Waypoint ${(wpIndex % waypoints.length) + 1}/${waypoints.length} | ` +
          `pan(${current.x.toFixed(0)}, ${current.y.toFixed(0)}) zoom(${currentZoom.toFixed(2)}) ` +
          `[${(t * 100).toFixed(0)}%]`,
      )

      if (progress >= 1.6) {
        // Hold at target for ~0.6 * interval after arriving
        wpIndex = (wpIndex + 1) % waypoints.length
        target = waypoints[(wpIndex + 1) % waypoints.length]
        progress = 0
        console.log('') // newline between waypoints
      }
    }, 100)

    // Cleanup on exit
    const cleanup = () => {
      clearInterval(interval)
      console.log('\nLeaving whiteboard...')
      send('whiteboard:leave', { whiteboardId })
      setTimeout(() => {
        ws.close()
        process.exit(0)
      }, 200)
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  })

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString())
    if (msg.type === 'whiteboard:presence') {
      const names = msg.payload.users.map((u) => u.userName).join(', ')
      console.log(`\nPresence update: [${names}]`)
    }
  })

  ws.on('close', () => {
    console.log('\nWebSocket disconnected')
    process.exit(0)
  })

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message)
    process.exit(1)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
