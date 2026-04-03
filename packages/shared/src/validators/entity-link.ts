import { z } from 'zod'

export const sourceTypeSchema = z.enum(['message', 'forum_thread', 'forum_reply'])
export const targetTypeSchema = z.enum(['project', 'goal', 'task'])

export const createEntityLinkSchema = z.object({
  sourceType: sourceTypeSchema,
  sourceId: z.string().uuid(),
  targetType: targetTypeSchema,
  targetId: z.string().uuid(),
})

export const entityLinkQuerySchema = z.object({
  sourceType: sourceTypeSchema.optional(),
  sourceId: z.string().uuid().optional(),
  targetType: targetTypeSchema.optional(),
  targetId: z.string().uuid().optional(),
})
