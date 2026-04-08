'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { api } from '@/lib/api'
import { CheckSquare, CalendarDays, Target, MessageSquare } from 'lucide-react'
import type {
  MyItemsResponse,
  DashboardTask,
  DashboardEvent,
  DashboardGoal,
  DashboardFeedback,
  DashboardChatNotification,
} from '@sentral/shared/types/dashboard'

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

const typeGradients: Record<string, string> = {
  task: 'linear-gradient(135deg, #3B82F6, #1E3A8A)',
  event: 'linear-gradient(135deg, #26A69A, #1A7A70)',
  goal: 'linear-gradient(135deg, #64748B, #334155)',
  feedback: 'linear-gradient(135deg, #5C6BC0, #3949AB)',
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { settings, fetchSettings } = useSettingsStore()
  const [items, setItems] = useState<MyItemsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')

  const widgets = useMemo(
    () =>
      new Set(
        settings?.dashboardWidgets ?? [
          'tasks',
          'events',
          'goals',
          'feedbackItems',
          'chatNotifications',
        ],
      ),
    [settings?.dashboardWidgets],
  )

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

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
      ...(widgets.has('tasks')
        ? items.tasks.map((t) => ({
            type: 'task' as const,
            sortDate: t.dueDate ? new Date(t.dueDate).getTime() : Infinity,
            data: t,
          }))
        : []),
      ...(widgets.has('events')
        ? items.events.map((e) => ({
            type: 'event' as const,
            sortDate: new Date(e.startTime).getTime(),
            data: e,
          }))
        : []),
      ...(widgets.has('goals')
        ? items.goals.map((g) => ({
            type: 'goal' as const,
            sortDate: g.targetDate ? new Date(g.targetDate).getTime() : Infinity,
            data: g,
          }))
        : []),
      ...(widgets.has('feedbackItems')
        ? items.feedbackItems.map((f) => ({
            type: 'feedback' as const,
            sortDate: Infinity,
            data: f,
          }))
        : []),
    ]
    return merged.sort((a, b) => a.sortDate - b.sortDate)
  }, [items, widgets])

  const totalCount =
    (widgets.has('tasks') ? (items?.tasks.length ?? 0) : 0) +
    (widgets.has('events') ? (items?.events.length ?? 0) : 0) +
    (widgets.has('goals') ? (items?.goals.length ?? 0) : 0) +
    (widgets.has('feedbackItems') ? (items?.feedbackItems.length ?? 0) : 0)
  const showChat = widgets.has('chatNotifications')
  const isEmpty =
    items && totalCount === 0 && (!showChat || (items.chatNotifications?.length ?? 0) === 0)

  const displayItems = useMemo(() => {
    if (filter === 'tasks') return sortedItems.filter((i) => i.type === 'task')
    if (filter === 'events') return sortedItems.filter((i) => i.type === 'event')
    if (filter === 'goals') return sortedItems.filter((i) => i.type === 'goal')
    if (filter === 'feedback') return sortedItems.filter((i) => i.type === 'feedback')
    return sortedItems
  }, [sortedItems, filter])

  const allTabs: { key: FilterTab; widgetKey: string; label: string; count: number }[] = [
    { key: 'all', widgetKey: 'all', label: 'All', count: totalCount },
    { key: 'tasks', widgetKey: 'tasks', label: 'Tasks', count: items?.tasks.length ?? 0 },
    { key: 'events', widgetKey: 'events', label: 'Events', count: items?.events.length ?? 0 },
    { key: 'goals', widgetKey: 'goals', label: 'Goals', count: items?.goals.length ?? 0 },
    {
      key: 'feedback',
      widgetKey: 'feedbackItems',
      label: 'Feedback',
      count: items?.feedbackItems.length ?? 0,
    },
  ]
  const tabs = allTabs.filter((t) => t.widgetKey === 'all' || widgets.has(t.widgetKey))

  const totalUnread = showChat
    ? (items?.chatNotifications?.reduce((sum, n) => sum + n.unreadCount, 0) ?? 0)
    : 0

  const allQuickLinks = [
    {
      key: 'tasks',
      label: 'Tasks',
      desc: `${items?.tasks.length ?? 0} active`,
      gradient: typeGradients.task,
      icon: CheckSquare,
      href: '/tasks',
    },
    {
      key: 'events',
      label: 'Events',
      desc: `${items?.events.length ?? 0} upcoming`,
      gradient: typeGradients.event,
      icon: CalendarDays,
      href: '/calendar',
    },
    {
      key: 'goals',
      label: 'Goals',
      desc: `${items?.goals.length ?? 0} in progress`,
      gradient: typeGradients.goal,
      icon: Target,
      href: '/goals',
    },
    {
      key: 'feedbackItems',
      label: 'Feedback',
      desc: `${items?.feedbackItems.length ?? 0} open`,
      gradient: typeGradients.feedback,
      icon: MessageSquare,
      href: '/feedback',
    },
  ]
  const quickLinks = allQuickLinks.filter((l) => widgets.has(l.key))

  return (
    <div>
      <h1 className="text-2xl font-bold text-jet dark:text-dark-text mb-6">
        Welcome back, {user?.name?.split(' ')[0] || 'there'}
      </h1>

      {/* Quick link cards */}
      {quickLinks.length > 0 && (
        <div
          className={`grid grid-cols-2 ${quickLinks.length >= 4 ? 'lg:grid-cols-4' : quickLinks.length === 3 ? 'lg:grid-cols-3' : ''} gap-3 mb-6`}
        >
          {quickLinks.map((link) => (
            <Card
              key={link.label}
              gradient={link.gradient}
              className="p-4 text-white cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center justify-between mb-2">
                <link.icon size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold">{link.label}</h3>
              <p className="text-xs mt-0.5 opacity-80">{link.desc}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Chat notifications banner */}
      {showChat && totalUnread > 0 && (
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

      {/* To-Do List */}
      <div>
        <h2 className="text-lg font-semibold text-jet dark:text-dark-text mb-3">My To-Do List</h2>

        <div className="flex gap-1 mb-4 bg-light-surface dark:bg-dark-card rounded-lg p-1 border border-light-border dark:border-dark-border w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-indigo text-white shadow-sm'
                  : 'text-french-gray dark:text-dark-text-secondary hover:text-jet dark:hover:text-dark-text'
              }`}
            >
              {tab.label}
              {tab.count > 0 ? ` (${tab.count})` : ''}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo" />
            <span className="ml-3 text-sm text-french-gray">Loading your items...</span>
          </div>
        )}

        {!isLoading && isEmpty && (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-indigo/10 flex items-center justify-center mb-3">
              <CheckSquare size={24} className="text-indigo" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-jet dark:text-dark-text mb-1">
              You&apos;re all caught up
            </p>
            <p className="text-xs text-french-gray dark:text-dark-text-secondary max-w-[280px]">
              No items assigned to you. Tasks, events, goals, and feedback will appear here.
            </p>
          </Card>
        )}

        {!isLoading && !isEmpty && displayItems.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-sm text-french-gray dark:text-dark-text-secondary">
              No {filter} to show.
            </p>
          </Card>
        )}

        {!isLoading && displayItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayItems.map((item) => (
              <Card
                key={`${item.type}-${item.data.id}`}
                className="relative overflow-hidden p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Gradient accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: typeGradients[item.type] }}
                />

                <div className="flex items-start justify-between gap-2 mt-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{ background: typeGradients[item.type] }}
                      >
                        {item.type}
                      </span>
                      {item.type === 'task' && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: priorityColors[(item.data as DashboardTask).priority],
                          }}
                          title={(item.data as DashboardTask).priority + ' priority'}
                        />
                      )}
                      {item.type === 'feedback' && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              priorityColors[(item.data as DashboardFeedback).priority],
                          }}
                          title={(item.data as DashboardFeedback).priority + ' priority'}
                        />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-jet dark:text-dark-text truncate">
                      {item.data.title}
                    </p>
                  </div>

                  {/* Status badge */}
                  {item.type === 'task' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo/10 text-indigo whitespace-nowrap">
                      {statusLabels[(item.data as DashboardTask).status] ||
                        (item.data as DashboardTask).status}
                    </span>
                  )}
                  {item.type === 'event' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal/10 text-teal whitespace-nowrap">
                      {(item.data as DashboardEvent).rsvpStatus}
                    </span>
                  )}
                  {item.type === 'goal' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-gray/10 text-slate-gray whitespace-nowrap">
                      {statusLabels[(item.data as DashboardGoal).status] ||
                        (item.data as DashboardGoal).status}
                    </span>
                  )}
                  {item.type === 'feedback' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo/10 text-indigo whitespace-nowrap">
                      {statusLabels[(item.data as DashboardFeedback).status] ||
                        (item.data as DashboardFeedback).status}
                    </span>
                  )}
                </div>

                {/* Meta info row */}
                <div className="flex items-center gap-3 mt-2 text-xs text-french-gray dark:text-dark-text-secondary">
                  {item.type === 'task' && (
                    <span>{formatDate((item.data as DashboardTask).dueDate)}</span>
                  )}
                  {item.type === 'event' && (
                    <span>
                      {(item.data as DashboardEvent).allDay
                        ? formatDate((item.data as DashboardEvent).startTime)
                        : formatTime((item.data as DashboardEvent).startTime)}
                    </span>
                  )}
                  {item.type === 'goal' && (
                    <>
                      <span>{formatDate((item.data as DashboardGoal).targetDate)}</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        <div className="flex-1 max-w-[100px] h-1.5 rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-gray transition-all"
                            style={{
                              width: `${(item.data as DashboardGoal).progressPercentage}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-medium">
                          {(item.data as DashboardGoal).progressPercentage}%
                        </span>
                      </div>
                    </>
                  )}
                  {item.type === 'feedback' && (
                    <span>{feedbackCategoryLabels[(item.data as DashboardFeedback).category]}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
