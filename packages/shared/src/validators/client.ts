import { z } from 'zod'
import { CLIENT_STATUSES, CLIENT_PROJECT_ROLES } from '../types/client.js'

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  notes: z.string().optional(),
  status: z.enum(CLIENT_STATUSES).optional(),
})

export const updateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email('Invalid email address').nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  company: z.string().max(255).nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(CLIENT_STATUSES).optional(),
})

export const clientProjectSchema = z.object({
  projectId: z.string().uuid(),
  role: z.enum(CLIENT_PROJECT_ROLES).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type ClientProjectInput = z.infer<typeof clientProjectSchema>
