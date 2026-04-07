import { z } from 'zod'
import {
  EMAIL_DIGEST_OPTIONS,
  CALENDAR_VIEW_OPTIONS,
  DASHBOARD_WIDGET_OPTIONS,
} from '../types/settings.js'

export const updateSettingsSchema = z.object({
  notifyTaskAssignment: z.boolean().optional(),
  notifyChatMention: z.boolean().optional(),
  notifyForumReply: z.boolean().optional(),
  notifyProjectUpdate: z.boolean().optional(),
  notifyEventInvite: z.boolean().optional(),
  notifyGoalUpdate: z.boolean().optional(),
  emailDigest: z.enum(EMAIL_DIGEST_OPTIONS).optional(),
  dashboardWidgets: z.array(z.enum(DASHBOARD_WIDGET_OPTIONS)).optional(),
  timezone: z.string().max(100).optional(),
  workingHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format')
    .optional(),
  workingHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format')
    .optional(),
  defaultCalendarView: z.enum(CALENDAR_VIEW_OPTIONS).optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

export const muteEntitySchema = z.object({
  entityType: z.enum(['channel', 'project']),
  entityId: z.string().uuid(),
})

export type MuteEntityInput = z.infer<typeof muteEntitySchema>
