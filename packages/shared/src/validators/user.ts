import { z } from 'zod'
import { ROLES } from '../types/user.js'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  inviteToken: z.string().min(1, 'Invitation token is required'),
})

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  avatarUrl: z.string().url().nullable(),
  role: z.enum(ROLES),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
