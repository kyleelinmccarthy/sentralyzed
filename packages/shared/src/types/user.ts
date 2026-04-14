export const ROLES = ['admin', 'manager', 'member'] as const
export type Role = (typeof ROLES)[number]

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  role: Role
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}
