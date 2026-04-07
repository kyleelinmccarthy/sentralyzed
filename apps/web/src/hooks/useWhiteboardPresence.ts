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
  const user = useAuthStore((s) => s.user)
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

  // Listen for presence updates
  useEffect(() => {
    if (!enabled) return

    const unsub = on('whiteboard:presence', (msg: WsMessage) => {
      const payload = msg.payload as { whiteboardId: string; users: WhiteboardUser[] }
      if (payload.whiteboardId !== whiteboardId) return

      const otherUsers = payload.users.filter((u) => u.userId !== user!.id)
      setPresentUsers(otherUsers)

      // Auto-unfollow if followed user left
      if (followingRef.current && !payload.users.some((u) => u.userId === followingRef.current)) {
        setFollowingUserId(null)
      }
    })

    return unsub
  }, [whiteboardId, enabled, on, user])

  // Listen for viewport updates from followed user
  useEffect(() => {
    if (!enabled) return

    const unsub = on('whiteboard:viewport', (msg: WsMessage) => {
      const payload = msg.payload as {
        whiteboardId: string
        userId: string
        pan: { x: number; y: number }
        zoom: number
      }
      if (payload.whiteboardId !== whiteboardId) return
      if (payload.userId !== followingRef.current) return

      onViewportSyncRef.current({ pan: payload.pan, zoom: payload.zoom })
    })

    return unsub
  }, [whiteboardId, enabled, on])

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
