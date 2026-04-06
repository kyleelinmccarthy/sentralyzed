'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import type {
  MyItemsResponse,
  DashboardTask,
  DashboardEvent,
  DashboardGoal,
  DashboardFeedback,
  DashboardChatNotification,
} from '@sentralyzed/shared/types/dashboard'

type FilterTab = 'all' | 'tasks' | 'events' | 'goals' | 'feedback'

const priorityColors: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
}

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  not_started: 'Not Started',
  open: 'Open',
}

const feedbackCategoryLabels: Record<string, string> = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  improvement: 'Improvement',
  question: 'Question',
  other: 'Other',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No date'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

type TodoItem =
  | { type: 'task'; sortDate: number; data: DashboardTask }
  | { type: 'event'; sortDate: number; data: DashboardEvent }
  | { type: 'goal'; sortDate: number; data: DashboardGoal }
  | { type: 'feedback'; sortDate: number; data: DashboardFeedback }

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [items, setItems] = useState<MyItemsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await api.get<{ items: MyItemsResponse }>('/dashboard/my-items')
        setItems(data.items)
      } finally {
        setIsLoading(false)
      }
    }
    void loadItems()
  }, [])

  const sortedItems = useMemo<TodoItem[]>(() => {
    if (!items) return []
    const merged: TodoItem[] = [
      ...items.tasks.map((t) => ({
        type: 'task' as const,
        sortDate: t.dueDate ? new Date(t.dueDate).getTime() : Infinity,
        data: t,
      })),
      ...items.events.map((e) => ({
        type: 'event' as const,
        sortDate: new Date(e.startTime).getTime(),
        data: e,
      })),
      ...items.goals.map((g) => ({
        type: 'goal' as const,
        sortDate: g.targetDate ? new Date(g.targetDate).getTime() : Infinity,
        data: g,
      })),
      ...items.feedbackItems.map((f) => ({
        type: 'feedback' as const,
        sortDate: Infinity,
        data: f,
      })),
    ]
    return merged.sort((a, b) => a.sortDate - b.sortDate)
  }, [items])

  const totalCount =
    (items?.tasks.length ?? 0) +
    (items?.events.length ?? 0) +
    (items?.goals.length ?? 0) +
    (items?.feedbackItems.length ?? 0)
  const isEmpty = items && totalCount === 0 && (items.chatNotifications?.length ?? 0) === 0

  const displayItems = useMemo(() => {
    if (filter === 'tasks') return sortedItems.filter((i) => i.type === 'task')
    if (filter === 'events') return sortedItems.filter((i) => i.type === 'event')
    if (filter === 'goals') return sortedItems.filter((i) => i.type === 'goal')
    if (filter === 'feedback') return sortedItems.filter((i) => i.type === 'feedback')
    return sortedItems
  }, [sortedItems, filter])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'tasks', label: 'Tasks', count: items?.tasks.length ?? 0 },
    { key: 'events', label: 'Events', count: items?.events.length ?? 0 },
    { key: 'goals', label: 'Goals', count: items?.goals.length ?? 0 },
    { key: 'feedback', label: 'Feedback', count: items?.feedbackItems.length ?? 0 },
  ]

  const totalUnread = items?.chatNotifications?.reduce((sum, n) => sum + n.unreadCount, 0) ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-jet dark:text-dark-text mb-6">
        Welcome back, {user?.name?.split(' ')[0] || 'there'}
      </h1>

      {/* Chat notifications banner */}
      {totalUnread > 0 && (
        <Card className="p-4 mb-4 border-indigo/30 bg-indigo/5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo text-white text-[11px] font-bold">
              {totalUnread}
            </span>
            <span className="text-sm font-medium text-jet dark:text-dark-text">
              Unread messages
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {items?.chatNotifications?.map((n: DashboardChatNotification) => (
              <span
                key={n.channelId}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-dark-hover text-xs text-jet dark:text-dark-text border border-light-border dark:border-dark-border"
              >
                <span className="font-medium">#{n.channelName}</span>
                <span className="text-french-gray dark:text-dark-text-secondary">
                  ({n.unreadCount})
                </span>
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-jet dark:text-dark-text mb-4">My To-Do List</h2>

        <div className="flex gap-4 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-sm font-medium pb-1 whitespace-nowrap ${
                filter === tab.key
                  ? 'text-indigo border-b-2 border-indigo'
                  : 'text-french-gray dark:text-dark-text-secondary'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo" />
            <span className="ml-3 text-sm text-french-gray">Loading your items...</span>
          </div>
        )}

        {!isLoading && isEmpty && (
          <p className="text-sm text-french-gray dark:text-dark-text-secondary py-4">
            No items assigned to you. Tasks, events, goals, and feedback will appear here.
          </p>
        )}

        {!isLoading && !isEmpty && displayItems.length === 0 && (
          <p className="text-sm text-french-gray dark:text-dark-text-secondary py-4">
            No {filter} to show.
          </p>
        )}

        {!isLoading &&
          displayItems.map((item) => (
            <div
              key={`${item.type}-${item.data.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-hover dark:hover:bg-dark-hover transition-colors mb-2"
            >
              {item.type === 'task' && (
                <>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: priorityColors[(item.data as DashboardTask).priority],
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-jet dark:text-dark-text truncate">
                      {item.data.title}
                    </p>
                    <p className="text-xs text-french-gray dark:text-dark-text-secondary">
                      {formatDate((item.data as DashboardTask).dueDate)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo/10 text-indigo">
                    {statusLabels[(item.data as DashboardTask).status] ||
                      (item.data as DashboardTask).status}
                  </span>
                  <span className="text-[10px] uppercase font-medium text-french-gray dark:text-dark-text-secondary">
                    Task
                  </span>
                </>
              )}

              {item.type === 'event' && (
                <>
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-teal" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-jet dark:text-dark-text truncate">
                      {item.data.title}
                    </p>
                    <p className="text-xs text-french-gray dark:text-dark-text-secondary">
                      {(item.data as DashboardEvent).allDay
                        ? formatDate((item.data as DashboardEvent).startTime)
                        : formatTime((item.data as DashboardEvent).startTime)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal/10 text-teal">
                    {(item.data as DashboardEvent).rsvpStatus}
                  </span>
                  <span className="text-[10px] uppercase font-medium text-french-gray dark:text-dark-text-secondary">
                    Event
                  </span>
                </>
              )}

              {item.type === 'goal' && (
                <>
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-amber-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-jet dark:text-dark-text truncate">
                      {item.data.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-french-gray dark:text-dark-text-secondary">
                        {formatDate((item.data as DashboardGoal).targetDate)}
                      </p>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${(item.data as DashboardGoal).progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-french-gray dark:text-dark-text-secondary">
                          {(item.data as DashboardGoal).progressPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600">
                    {statusLabels[(item.data as DashboardGoal).status] ||
                      (item.data as DashboardGoal).status}
                  </span>
                  <span className="text-[10px] uppercase font-medium text-french-gray dark:text-dark-text-secondary">
                    Goal
                  </span>
                </>
              )}

              {item.type === 'feedback' && (
                <>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: priorityColors[(item.data as DashboardFeedback).priority],
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-jet dark:text-dark-text truncate">
                      {item.data.title}
                    </p>
                    <p className="text-xs text-french-gray dark:text-dark-text-secondary">
                      {feedbackCategoryLabels[(item.data as DashboardFeedback).category]}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600">
                    {statusLabels[(item.data as DashboardFeedback).status] ||
                      (item.data as DashboardFeedback).status}
                  </span>
                  <span className="text-[10px] uppercase font-medium text-french-gray dark:text-dark-text-secondary">
                    Feedback
                  </span>
                </>
              )}
            </div>
          ))}
      </Card>
    </div>
  )
}
