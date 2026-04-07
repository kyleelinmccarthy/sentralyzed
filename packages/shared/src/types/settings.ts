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
  'assignments',
] as const
export type DashboardWidget = (typeof DASHBOARD_WIDGET_OPTIONS)[number]

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidget, string> = {
  tasks: 'Tasks',
  events: 'Events',
  goals: 'Goals',
  feedbackItems: 'Feedback',
  chatNotifications: 'Chat',
  assignments: 'Assignments',
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
