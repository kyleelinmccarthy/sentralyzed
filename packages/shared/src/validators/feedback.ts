import { z } from 'zod'
import { FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, FEEDBACK_STATUSES } from '../types/feedback.js'

export const createFeedbackSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  category: z.enum(FEEDBACK_CATEGORIES),
  priority: z.enum(FEEDBACK_PRIORITIES).default('medium'),
})

export const updateFeedbackSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.enum(FEEDBACK_CATEGORIES).optional(),
  priority: z.enum(FEEDBACK_PRIORITIES).optional(),
})

export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES),
  adminNotes: z.string().max(2000).optional(),
})

export const createFeedbackResponseSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
})

export const feedbackQuerySchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  category: z.enum(FEEDBACK_CATEGORIES).optional(),
  priority: z.enum(FEEDBACK_PRIORITIES).optional(),
  submittedBy: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
})

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>
export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>
export type CreateFeedbackResponseInput = z.infer<typeof createFeedbackResponseSchema>
export type FeedbackQueryInput = z.infer<typeof feedbackQuerySchema>
