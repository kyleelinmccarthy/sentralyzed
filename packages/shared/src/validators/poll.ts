import { z } from 'zod'
import { POLL_CONTEXT_TYPES } from '../types/poll.js'

export const pollContextTypeSchema = z.enum(POLL_CONTEXT_TYPES)

export const createPollSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  contextType: pollContextTypeSchema,
  contextId: z.string().uuid(),
  options: z
    .array(z.string().min(1, 'Option text is required').max(200))
    .min(2, 'At least 2 options required')
    .max(10, 'Maximum 10 options'),
  allowMultiple: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
})

export const votePollSchema = z.object({
  optionIds: z.array(z.string().uuid()).min(1, 'At least one option must be selected'),
})

export const pollVotePayloadSchema = z.object({
  pollId: z.string().uuid(),
  optionIds: z.array(z.string().uuid()).min(1),
})

export type CreatePollInput = z.infer<typeof createPollSchema>
export type VotePollInput = z.infer<typeof votePollSchema>
