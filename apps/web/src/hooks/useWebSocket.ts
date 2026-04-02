'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { WsMessage } from '@sentralyzed/shared/types/websocket'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002'

type MessageHandler = (message: WsMessage) => void

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const reconnectAttempt = useRef(0)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      setIsConnected(true)
      reconnectAttempt.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as WsMessage
        const handlers = handlersRef.current.get(message.type)
        if (handlers) {
          for (const handler of handlers) handler(message)
        }
        // Also notify wildcard handlers
        const wildcardHandlers = handlersRef.current.get('*')
        if (wildcardHandlers) {
          for (const handler of wildcardHandlers) handler(message)
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      // Exponential backoff reconnect
      const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 30000)
      reconnectAttempt.current++
      reconnectTimer.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }))
    }
  }, [])

  const on = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set())
    }
    handlersRef.current.get(type)!.add(handler)

    return () => {
      handlersRef.current.get(type)?.delete(handler)
    }
  }, [])

  return { send, on, isConnected }
}
