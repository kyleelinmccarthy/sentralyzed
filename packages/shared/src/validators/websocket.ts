import { z } from 'zod'

export const wsMessageSchema = z.object({
  type: z.enum([
    'chat:message',
    'chat:typing',
    'chat:reaction',
    'notification:new',
    'notification:read',
    'whiteboard:update',
    'presence:online',
    'presence:offline',
  ]),
  payload: z.unknown(),
  timestamp: z.string(),
})

export const chatMessagePayloadSchema = z.object({
  channelId: z.string().uuid(),
  content: z.string().min(1),
  replyToId: z.string().uuid().optional(),
})

export const typingPayloadSchema = z.object({
  channelId: z.string().uuid(),
})

export const reactionPayloadSchema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().min(1).max(50),
  action: z.enum(['add', 'remove']),
})
