'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket } from './useWebSocket'
import { useAuthStore } from '@/stores/auth'
import type { WsMessage } from '@sentral/shared/types/websocket'

interface ViewportState {
  pan: { x: number; y: number }
  zoom: number
}

interface WhiteboardUser {
  userId: string
  userName: string
}

interface UseWhiteboardPresenceOptions {
  whiteboardId: string
  currentViewport: ViewportState
  onViewportSync: (viewport: ViewportState) => void
}

const VIEWPORT_THROTTLE_MS = 50

export function useWhiteboardPresence({
  whiteboardId,
  currentViewport,
  onViewportSync,
}: UseWhiteboardPresenceOptions) {
  const { send, on, isConnected } = useWebSocket()
  const { user } = useAuthStore()
  const [presentUsers, setPresentUsers] = useState<WhiteboardUser[]>([])
  const [followingUserId, setFollowingUserId] = useState<string | null>(null)

  const followingRef = useRef<string | null>(null)
  const lastSendTime = useRef(0)
  const pendingViewport = useRef<ViewportState | null>(null)
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onViewportSyncRef = useRef(onViewportSync)
  onViewportSyncRef.current = onViewportSync

  // Keep ref in sync with state
  useEffect(() => {
    followingRef.current = followingUserId
  }, [followingUserId])

  const enabled = Boolean(whiteboardId && user)

  // Join/leave room
  useEffect(() => {
    if (!enabled || !isConnected) return

    send('whiteboard:join', { whiteboardId })

    return () => {
      send('whiteboard:leave', { whiteboardId })
    }
  }, [whiteboardId, enabled, isConnected, send])

  // Listen for presence updates (server-pushed roster)
  useEffect(() => {
    if (!enabled) return

    const unsub = on('whiteboard:presence', (msg: WsMessage) => {
      const payload = msg.payload as { whiteboardId: string; users: WhiteboardUser[] }
      if (payload.whiteboardId !== whiteboardId) return

      const otherUsers = payload.users.filter((u) => u.userId !== user!.id)
      // Seed the lastSeen map so presence is immediately visible
      const now = Date.now()
      for (const u of otherUsers) {
        lastSeenRef.current.set(u.userId, { userName: u.userName, time: now })
      }
      setPresentUsers(otherUsers)

      if (followingRef.current && !payload.users.some((u) => u.userId === followingRef.current)) {
        setFollowingUserId(null)
      }
    })

    return unsub
  }, [whiteboardId, enabled, on, user])

  // Listen for viewport updates — also derive presence from them
  const lastSeenRef = useRef<Map<string, { userName: string; time: number }>>(new Map())

  useEffect(() => {
    if (!enabled) return

    const unsub = on('whiteboard:viewport', (msg: WsMessage) => {
      const payload = msg.payload as {
        whiteboardId: string
        userId: string
        userName: string
        pan: { x: number; y: number }
        zoom: number
      }
      if (payload.whiteboardId !== whiteboardId) return
      if (payload.userId === user!.id) return

      // Track this user as present (heartbeat-style)
      lastSeenRef.current.set(payload.userId, {
        userName: payload.userName,
        time: Date.now(),
      })

      // Rebuild presentUsers from lastSeen map
      const now = Date.now()
      const STALE_MS = 5000
      const active: WhiteboardUser[] = []
      for (const [userId, info] of lastSeenRef.current) {
        if (now - info.time < STALE_MS) {
          active.push({ userId, userName: info.userName })
        } else {
          lastSeenRef.current.delete(userId)
        }
      }
      setPresentUsers(active)

      // Follow viewport sync
      if (payload.userId === followingRef.current) {
        onViewportSyncRef.current({ pan: payload.pan, zoom: payload.zoom })
      }
    })

    return unsub
  }, [whiteboardId, enabled, on, user])

  // Prune stale users periodically
  useEffect(() => {
    if (!enabled) return
    const STALE_MS = 5000
    const interval = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const [userId, info] of lastSeenRef.current) {
        if (now - info.time >= STALE_MS) {
          lastSeenRef.current.delete(userId)
          changed = true
        }
      }
      if (changed) {
        const active: WhiteboardUser[] = []
        for (const [userId, info] of lastSeenRef.current) {
          active.push({ userId, userName: info.userName })
        }
        setPresentUsers(active)

        // Auto-unfollow if followed user went stale
        if (followingRef.current && !lastSeenRef.current.has(followingRef.current)) {
          setFollowingUserId(null)
        }
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [enabled])

  // Throttled viewport broadcast
  useEffect(() => {
    if (!enabled || !isConnected) return

    const now = Date.now()
    const elapsed = now - lastSendTime.current

    const doSend = () => {
      const vp = pendingViewport.current ?? currentViewport
      send('whiteboard:viewport', {
        whiteboardId,
        pan: vp.pan,
        zoom: vp.zoom,
      })
      lastSendTime.current = Date.now()
      pendingViewport.current = null
    }

    if (elapsed >= VIEWPORT_THROTTLE_MS) {
      doSend()
    } else {
      pendingViewport.current = currentViewport
      if (!throttleTimer.current) {
        throttleTimer.current = setTimeout(() => {
          throttleTimer.current = null
          doSend()
        }, VIEWPORT_THROTTLE_MS - elapsed)
      }
    }

    return () => {
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current)
        throttleTimer.current = null
      }
    }
  }, [
    currentViewport.pan.x,
    currentViewport.pan.y,
    currentViewport.zoom,
    whiteboardId,
    enabled,
    isConnected,
    send,
  ])

  const toggleFollow = useCallback((userId: string) => {
    setFollowingUserId((prev) => (prev === userId ? null : userId))
  }, [])

  const unfollow = useCallback(() => {
    setFollowingUserId(null)
  }, [])

  return { presentUsers, followingUserId, toggleFollow, unfollow }
}
