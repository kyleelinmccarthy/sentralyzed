import { z } from 'zod'

export const assignableEntityTypeSchema = z.enum([
  'task',
  'project',
  'goal',
  'whiteboard',
  'expense',
  'client',
])
export const assignmentRoleSchema = z.enum([
  'owner',
  'assignee',
  'reviewer',
  'collaborator',
  'viewer',
])

export const createAssignmentSchema = z.object({
  entityType: assignableEntityTypeSchema,
  entityId: z.string().uuid(),
  userId: z.string().uuid(),
  role: assignmentRoleSchema.optional(),
})

export const updateAssignmentSchema = z.object({
  role: assignmentRoleSchema,
})

export const assignmentQuerySchema = z.object({
  entityType: assignableEntityTypeSchema.optional(),
  entityId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
})
