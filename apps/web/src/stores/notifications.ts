'use client'

import { create } from 'zustand'
import { api } from '@/lib/api'
import type { NotificationPayload } from '@sentral/shared/types/websocket'

export interface NotificationItem {
  notification: {
    id: string
    userId: string
    activityId: string
    readAt: string | null
    createdAt: string
  }
  activity: {
    id: string
    action: string
    entityType: string
    entityId: string
    metadata: Record<string, unknown> | null
    actorId: string
    createdAt: string
  } | null
  actor: {
    name: string
  } | null
}

interface NotificationState {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (payload: NotificationPayload) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const data = await api.get<{ notifications: NotificationItem[] }>('/activities/notifications')
      set({ notifications: data.notifications, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await api.get<{ count: number }>('/activities/notifications/count')
      set({ unreadCount: data.count })
    } catch {
      // silently ignore
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/activities/notifications/${id}/read`, {})
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.notification.id === id
            ? { ...n, notification: { ...n.notification, readAt: new Date().toISOString() } }
            : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch {
      // silently ignore
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/activities/notifications/read-all', {})
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          notification: {
            ...n.notification,
            readAt: n.notification.readAt ?? new Date().toISOString(),
          },
        })),
        unreadCount: 0,
      }))
    } catch {
      // silently ignore
    }
  },

  addNotification: (payload: NotificationPayload) => {
    const newItem: NotificationItem = {
      notification: {
        id: payload.notificationId,
        userId: '',
        activityId: payload.activityId,
        readAt: null,
        createdAt: payload.createdAt,
      },
      activity: {
        id: payload.activityId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: payload.metadata,
        actorId: '',
        createdAt: payload.createdAt,
      },
      actor: payload.metadata?.actorName ? { name: payload.metadata.actorName as string } : null,
    }
    set((state) => ({
      notifications: [newItem, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }))
  },
}))
