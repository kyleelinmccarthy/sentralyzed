'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { useSettingsStore } from '@/stores/settings'
import { api } from '@/lib/api'
import { Bell, LayoutDashboard, Calendar, Check, AlertCircle, VolumeX, X, Plus } from 'lucide-react'
import {
  DASHBOARD_WIDGET_OPTIONS,
  DASHBOARD_WIDGET_LABELS,
  DASHBOARD_WIDGET_DESCRIPTIONS,
} from '@sentral/shared/types/settings'
import type { DashboardWidget } from '@sentral/shared/types/settings'

type MessageState = { type: 'success' | 'error'; text: string } | null

function StatusMessage({ message }: { message: MessageState }) {
  if (!message) return null
  return (
    <div
      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
        message.type === 'success'
          ? 'bg-teal/10 text-teal'
          : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
      }`}
    >
      {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
      {message.text}
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer group">
      <div>
        <p className="text-sm font-medium text-jet dark:text-dark-text">{label}</p>
        {description && (
          <p className="text-xs text-french-gray dark:text-dark-text-secondary mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo/30 ${
          checked ? 'bg-indigo' : 'bg-french-gray/30 dark:bg-dark-border'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}

function NotificationSettings() {
  const { settings, updateSettings } = useSettingsStore()
  const [message, setMessage] = useState<MessageState>(null)

  const handleToggle = async (key: string, value: boolean) => {
    setMessage(null)
    try {
      await updateSettings({ [key]: value })
      setMessage({ type: 'success', text: 'Setting updated' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update' })
    }
  }

  const handleDigest = async (value: string) => {
    setMessage(null)
    try {
      await updateSettings({ emailDigest: value as 'off' | 'daily' | 'weekly' })
      setMessage({ type: 'success', text: 'Email digest updated' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update' })
    }
  }

  if (!settings) return null

  const toggles = [
    {
      key: 'notifyTaskAssignment',
      label: 'Task assignments',
      description: 'When you are assigned to a task',
      checked: settings.notifyTaskAssignment,
    },
    {
      key: 'notifyChatMention',
      label: 'Chat mentions',
      description: 'When someone mentions you in chat',
      checked: settings.notifyChatMention,
    },
    {
      key: 'notifyForumReply',
      label: 'Forum replies',
      description: 'When someone replies to your forum thread',
      checked: settings.notifyForumReply,
    },
    {
      key: 'notifyProjectUpdate',
      label: 'Project updates',
      description: 'When a project you belong to is updated',
      checked: settings.notifyProjectUpdate,
    },
    {
      key: 'notifyEventInvite',
      label: 'Event invitations',
      description: 'When you are invited to a calendar event',
      checked: settings.notifyEventInvite,
    },
    {
      key: 'notifyGoalUpdate',
      label: 'Goal updates',
      description: 'When a goal you own is updated',
      checked: settings.notifyGoalUpdate,
    },
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={16} className="text-indigo" />
        <h2 className="text-base font-semibold text-jet dark:text-dark-text">Notifications</h2>
      </div>

      <div className="divide-y divide-light-border dark:divide-dark-border">
        {toggles.map((t) => (
          <Toggle
            key={t.key}
            label={t.label}
            description={t.description}
            checked={t.checked}
            onChange={(val) => handleToggle(t.key, val)}
          />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
        <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
          Email Digest
        </label>
        <select
          value={settings.emailDigest}
          onChange={(e) => handleDigest(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
        >
          <option value="off">Off</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <p className="text-xs text-french-gray dark:text-dark-text-secondary mt-1">
          Receive a summary of your notifications via email
        </p>
      </div>

      <div className="mt-4">
        <StatusMessage message={message} />
      </div>
    </Card>
  )
}

interface SimpleEntity {
  id: string
  name: string
}

function MuteSettings() {
  const { settings, muteEntity, unmuteEntity } = useSettingsStore()
  const [channels, setChannels] = useState<SimpleEntity[]>([])
  const [projects, setProjects] = useState<SimpleEntity[]>([])
  const [showChannelPicker, setShowChannelPicker] = useState(false)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const [message, setMessage] = useState<MessageState>(null)

  const fetchLists = useCallback(async () => {
    try {
      const [chData, prData] = await Promise.all([
        api.get<{ channels: SimpleEntity[] }>('/chat/channels'),
        api.get<{ projects: SimpleEntity[] }>('/projects'),
      ])
      setChannels(chData.channels || [])
      setProjects(prData.projects || [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    void fetchLists()
  }, [fetchLists])

  if (!settings) return null

  const mutedChannelIds = new Set(settings.mutedChannels.map((m) => m.entityId))
  const mutedProjectIds = new Set(settings.mutedProjects.map((m) => m.entityId))
  const availableChannels = channels.filter((c) => !mutedChannelIds.has(c.id))
  const availableProjects = projects.filter((p) => !mutedProjectIds.has(p.id))

  const handleMute = async (type: 'channel' | 'project', id: string) => {
    setMessage(null)
    try {
      await muteEntity(type, id)
      setShowChannelPicker(false)
      setShowProjectPicker(false)
      setMessage({ type: 'success', text: `${type === 'channel' ? 'Channel' : 'Project'} muted` })
    } catch {
      setMessage({ type: 'error', text: 'Failed to mute' })
    }
  }

  const handleUnmute = async (type: 'channel' | 'project', id: string) => {
    setMessage(null)
    try {
      await unmuteEntity(type, id)
      setMessage({
        type: 'success',
        text: `${type === 'channel' ? 'Channel' : 'Project'} unmuted`,
      })
    } catch {
      setMessage({ type: 'error', text: 'Failed to unmute' })
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <VolumeX size={16} className="text-indigo" />
        <h2 className="text-base font-semibold text-jet dark:text-dark-text">Muted</h2>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-jet dark:text-dark-text">Channels</h3>
            <button
              onClick={() => setShowChannelPicker(!showChannelPicker)}
              className="text-xs font-medium text-indigo hover:text-indigo/80 flex items-center gap-1 transition-colors"
            >
              <Plus size={12} /> Mute channel
            </button>
          </div>

          {showChannelPicker && availableChannels.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleMute('channel', e.target.value)
              }}
              className="w-full mb-2 px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
            >
              <option value="" disabled>
                Select a channel to mute...
              </option>
              {availableChannels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          )}

          {settings.mutedChannels.length === 0 ? (
            <p className="text-xs text-french-gray dark:text-dark-text-secondary">
              No muted channels
            </p>
          ) : (
            <div className="space-y-1">
              {settings.mutedChannels.map((ch) => (
                <div
                  key={ch.entityId}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-light-muted dark:bg-dark-bg"
                >
                  <span className="text-sm text-jet dark:text-dark-text">{ch.name}</span>
                  <button
                    onClick={() => handleUnmute('channel', ch.entityId)}
                    className="p-1 rounded text-french-gray hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Unmute"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-jet dark:text-dark-text">Projects</h3>
            <button
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className="text-xs font-medium text-indigo hover:text-indigo/80 flex items-center gap-1 transition-colors"
            >
              <Plus size={12} /> Mute project
            </button>
          </div>

          {showProjectPicker && availableProjects.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleMute('project', e.target.value)
              }}
              className="w-full mb-2 px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
            >
              <option value="" disabled>
                Select a project to mute...
              </option>
              {availableProjects.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </select>
          )}

          {settings.mutedProjects.length === 0 ? (
            <p className="text-xs text-french-gray dark:text-dark-text-secondary">
              No muted projects
            </p>
          ) : (
            <div className="space-y-1">
              {settings.mutedProjects.map((pr) => (
                <div
                  key={pr.entityId}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-light-muted dark:bg-dark-bg"
                >
                  <span className="text-sm text-jet dark:text-dark-text">{pr.name}</span>
                  <button
                    onClick={() => handleUnmute('project', pr.entityId)}
                    className="p-1 rounded text-french-gray hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Unmute"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <StatusMessage message={message} />
      </div>
    </Card>
  )
}

function AppearanceSettings() {
  const { settings, updateSettings } = useSettingsStore()
  const [message, setMessage] = useState<MessageState>(null)

  if (!settings) return null

  const handleToggleWidget = async (widget: DashboardWidget) => {
    setMessage(null)
    const current = settings.dashboardWidgets as DashboardWidget[]
    const updated = current.includes(widget)
      ? current.filter((w) => w !== widget)
      : [...current, widget]

    try {
      await updateSettings({ dashboardWidgets: updated })
      setMessage({ type: 'success', text: 'Dashboard updated' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update' })
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <LayoutDashboard size={16} className="text-indigo" />
        <h2 className="text-base font-semibold text-jet dark:text-dark-text">Dashboard Widgets</h2>
      </div>
      <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-4">
        Choose which sections appear on your dashboard
      </p>

      <div className="divide-y divide-light-border dark:divide-dark-border">
        {DASHBOARD_WIDGET_OPTIONS.map((widget) => {
          const active = (settings.dashboardWidgets as string[]).includes(widget)
          return (
            <Toggle
              key={widget}
              label={DASHBOARD_WIDGET_LABELS[widget]}
              description={DASHBOARD_WIDGET_DESCRIPTIONS[widget]}
              checked={active}
              onChange={() => handleToggleWidget(widget)}
            />
          )
        })}
      </div>

      <div className="mt-4">
        <StatusMessage message={message} />
      </div>
    </Card>
  )
}

function CalendarSettings() {
  const { settings, updateSettings } = useSettingsStore()
  const [timezone, setTimezone] = useState('')
  const [workStart, setWorkStart] = useState('')
  const [workEnd, setWorkEnd] = useState('')
  const [calView, setCalView] = useState<'week' | 'month'>('week')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<MessageState>(null)

  useEffect(() => {
    if (settings) {
      setTimezone(settings.timezone)
      setWorkStart(settings.workingHoursStart)
      setWorkEnd(settings.workingHoursEnd)
      setCalView(settings.defaultCalendarView)
    }
  }, [settings])

  const timezones = (() => {
    try {
      return Intl.supportedValuesOf('timeZone')
    } catch {
      return [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Australia/Sydney',
      ]
    }
  })()

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updateSettings({
        timezone,
        workingHoursStart: workStart,
        workingHoursEnd: workEnd,
        defaultCalendarView: calView,
      })
      setMessage({ type: 'success', text: 'Calendar settings saved' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  if (!settings) return null

  const hasChanges =
    timezone !== settings.timezone ||
    workStart !== settings.workingHoursStart ||
    workEnd !== settings.workingHoursEnd ||
    calView !== settings.defaultCalendarView

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={16} className="text-indigo" />
        <h2 className="text-base font-semibold text-jet dark:text-dark-text">
          Calendar & Scheduling
        </h2>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
            Working Hours
          </label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
            />
            <span className="text-sm text-french-gray dark:text-dark-text-secondary">to</span>
            <input
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
            Default Calendar View
          </label>
          <div className="flex gap-2">
            {(['week', 'month'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalView(view)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  calView === view
                    ? 'border-indigo bg-indigo/5 text-indigo dark:bg-indigo/10'
                    : 'border-light-border dark:border-dark-border text-french-gray dark:text-dark-text-secondary hover:border-indigo/30'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo text-white hover:bg-indigo/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        <StatusMessage message={message} />
      </div>
    </Card>
  )
}

type Tab = 'notifications' | 'appearance' | 'calendar'

export default function SettingsPage() {
  const { settings, isLoading, fetchSettings } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<Tab>('appearance')

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: 'Appearance', icon: <LayoutDashboard size={14} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={14} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-jet dark:text-dark-text mb-6">Settings</h1>

      <div className="flex gap-1 mb-6 border-b border-light-border dark:border-dark-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-indigo text-indigo'
                : 'border-transparent text-french-gray dark:text-dark-text-secondary hover:text-jet dark:hover:text-dark-text'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading || !settings ? (
        <div className="space-y-4 max-w-2xl">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 w-32 bg-light-muted dark:bg-dark-card rounded mb-4" />
              <div className="space-y-3">
                <div className="h-3 w-full bg-light-muted dark:bg-dark-card rounded" />
                <div className="h-3 w-3/4 bg-light-muted dark:bg-dark-card rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {activeTab === 'notifications' && (
            <>
              <NotificationSettings />
              <MuteSettings />
            </>
          )}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'calendar' && <CalendarSettings />}
        </div>
      )}
    </div>
  )
}
