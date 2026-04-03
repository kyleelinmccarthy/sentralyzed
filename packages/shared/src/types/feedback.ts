export const FEEDBACK_CATEGORIES = [
  'bug',
  'feature_request',
  'improvement',
  'question',
  'other',
] as const

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]

export const FEEDBACK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type FeedbackPriority = (typeof FEEDBACK_PRIORITIES)[number]

export const FEEDBACK_STATUSES = ['open', 'in_review', 'resolved', 'closed'] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export interface Feedback {
  id: string
  title: string
  description: string
  category: FeedbackCategory
  priority: FeedbackPriority
  status: FeedbackStatus
  submittedBy: string
  reviewedBy: string | null
  reviewedAt: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface FeedbackResponse {
  id: string
  feedbackId: string
  respondedBy: string
  message: string
  createdAt: string
}

export interface FeedbackWithResponses extends Feedback {
  responses: FeedbackResponse[]
}
