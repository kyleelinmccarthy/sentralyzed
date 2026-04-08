export const EMAIL_DIGEST_OPTIONS = ['off', 'daily', 'weekly'] as const
export type EmailDigest = (typeof EMAIL_DIGEST_OPTIONS)[number]

export const CALENDAR_VIEW_OPTIONS = ['week', 'month'] as const
export type CalendarView = (typeof CALENDAR_VIEW_OPTIONS)[number]

export const DASHBOARD_WIDGET_OPTIONS = [
  'tasks',
  'events',
  'goals',
  'feedbackItems',
  'chatNotifications',
] as const
export type DashboardWidget = (typeof DASHBOARD_WIDGET_OPTIONS)[number]

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidget, string> = {
  tasks: 'Tasks',
  events: 'Events',
  goals: 'Goals',
  feedbackItems: 'Feedback',
  chatNotifications: 'Chat',
}

export const DASHBOARD_WIDGET_DESCRIPTIONS: Record<DashboardWidget, string> = {
  tasks: 'Show your assigned tasks and to-dos',
  events: 'Show upcoming calendar events',
  goals: 'Show goals you own or are assigned to',
  feedbackItems: 'Show feedback items you submitted or review',
  chatNotifications: 'Show unread message counts from your channels',
}

export interface UserSettings {
  id: string
  notifyTaskAssignment: boolean
  notifyChatMention: boolean
  notifyForumReply: boolean
  notifyProjectUpdate: boolean
  notifyEventInvite: boolean
  notifyGoalUpdate: boolean
  emailDigest: EmailDigest
  dashboardWidgets: string[]
  timezone: string
  workingHoursStart: string
  workingHoursEnd: string
  defaultCalendarView: CalendarView
  mutedChannels: MutedEntity[]
  mutedProjects: MutedEntity[]
}

export interface MutedEntity {
  entityId: string
  name: string
}
