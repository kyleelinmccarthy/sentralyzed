'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/stores/notifications'
import { useWebSocket } from '@/hooks/useWebSocket'
import { NotificationList } from './notification-list'
import type { WsMessage } from '@sentral/shared/types/websocket'
import type { NotificationPayload } from '@sentral/shared/types/websocket'

export function NotificationBell() {
  const { unreadCount, fetchNotifications, fetchUnreadCount, addNotification } =
    useNotificationStore()
  const { on } = useWebSocket()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch initial count on mount
  useEffect(() => {
    void fetchUnreadCount()
  }, [fetchUnreadCount])

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsubscribe = on('notification:new', (message: WsMessage) => {
      addNotification(message.payload as NotificationPayload)
    })
    return unsubscribe
  }, [on, addNotification])

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (isOpen) {
      void fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-gray dark:text-dark-text-secondary hover:bg-light-hover dark:hover:bg-dark-hover hover:text-jet dark:hover:text-dark-text transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-coral text-white text-[10px] font-bold leading-none px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-lg overflow-hidden z-50">
          <NotificationList />
        </div>
      )}
    </div>
  )
}
