export const AUTH_PROVIDERS = ['email', 'google'] as const
export type AuthProvider = (typeof AUTH_PROVIDERS)[number]

export const ROLES = ['admin', 'manager', 'member'] as const
export type Role = (typeof ROLES)[number]

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  authProvider: AuthProvider
  role: Role
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
