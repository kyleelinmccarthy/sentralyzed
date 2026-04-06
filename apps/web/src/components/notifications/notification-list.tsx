'use client'

import { useRouter } from 'next/navigation'
import { useNotificationStore, type NotificationItem } from '@/stores/notifications'
import { CheckCheck } from 'lucide-react'

function formatNotificationMessage(item: NotificationItem): string {
  const actorName = item.actor?.name ?? 'Someone'
  const action = item.activity?.action ?? 'updated'
  const metadata = item.activity?.metadata as Record<string, unknown> | null
  const entityType = item.activity?.entityType ?? 'item'
  const title = (metadata?.taskTitle as string) ?? entityType

  switch (action) {
    case 'created':
      return `${actorName} assigned you to "${title}"`
    case 'assigned':
      return `${actorName} assigned you to "${title}"`
    case 'completed':
      return `${actorName} completed "${title}"`
    case 'commented':
      return `${actorName} commented on "${title}"`
    case 'deleted':
      if (metadata?.change === 'unassigned') {
        return `${actorName} removed your assignment from "${title}"`
      }
      return `${actorName} deleted "${title}"`
    case 'updated':
      if (metadata?.change === 'unassigned') {
        return `${actorName} unassigned you from "${title}"`
      }
      if (metadata?.change === 'role_updated') {
        return `${actorName} changed your role on "${title}" to ${metadata?.role ?? 'member'}`
      }
      return `${actorName} updated "${title}"`
    default:
      return `${actorName} ${action} "${title}"`
  }
}

function getEntityUrl(entityType: string, entityId: string): string {
  switch (entityType) {
    case 'task':
      return `/tasks`
    case 'project':
      return `/projects/${entityId}`
    case 'goal':
      return `/goals`
    case 'whiteboard':
      return `/whiteboards/${entityId}`
    case 'client':
      return `/clients/${entityId}`
    default:
      return '/'
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationList() {
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotificationStore()
  const router = useRouter()

  const handleClick = (item: NotificationItem) => {
    if (!item.notification.readAt) {
      void markAsRead(item.notification.id)
    }
    if (item.activity) {
      router.push(getEntityUrl(item.activity.entityType, item.activity.entityId))
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-french-gray dark:text-dark-text-secondary">
        Loading...
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-french-gray dark:text-dark-text-secondary">
        No notifications
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-light-border dark:border-dark-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-french-gray dark:text-dark-text-secondary">
          Notifications
        </span>
        <button
          onClick={() => void markAllAsRead()}
          className="flex items-center gap-1 text-xs text-indigo hover:text-blue transition-colors"
        >
          <CheckCheck size={13} />
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((item) => (
          <button
            key={item.notification.id}
            onClick={() => handleClick(item)}
            className={`w-full text-left px-4 py-3 border-b border-light-border/50 dark:border-dark-border/50 hover:bg-light-hover dark:hover:bg-dark-hover transition-colors ${
              !item.notification.readAt ? 'bg-indigo/5 dark:bg-indigo/10' : ''
            }`}
          >
            <p className="text-[13px] text-jet dark:text-dark-text leading-snug">
              {formatNotificationMessage(item)}
            </p>
            <p className="text-[11px] text-french-gray dark:text-dark-text-secondary mt-1">
              {timeAgo(item.notification.createdAt)}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
