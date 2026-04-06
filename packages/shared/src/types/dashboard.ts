export interface DashboardTask {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  dueDate: string | null
  projectId: string
}

export interface DashboardEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  allDay: boolean
  rsvpStatus: 'pending' | 'accepted' | 'declined'
}

export interface DashboardGoal {
  id: string
  title: string
  status: 'not_started' | 'in_progress' | 'completed' | 'archived'
  progressPercentage: number
  targetDate: string | null
  level: 'company' | 'team' | 'personal'
}

export interface DashboardFeedback {
  id: string
  title: string
  category: 'bug' | 'feature_request' | 'improvement' | 'question' | 'other'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_review' | 'resolved' | 'closed'
}

export interface DashboardChatNotification {
  channelId: string
  channelName: string
  unreadCount: number
}

export interface DashboardAssignment {
  id: string
  entityType: string
  entityId: string
  role: string | null
  createdAt: string
}

export interface MyItemsResponse {
  tasks: DashboardTask[]
  events: DashboardEvent[]
  goals: DashboardGoal[]
  feedbackItems: DashboardFeedback[]
  chatNotifications: DashboardChatNotification[]
  assignments: DashboardAssignment[]
}
