import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { authService } from '../services/auth.service.js'
import type { Role } from '@sentral/shared/types/user'

const SESSION_COOKIE = 'sentral_session'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  avatarUrl: string | null
}

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, SESSION_COOKIE)

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = await authService.validateSession(token)
  if (!result) {
    return c.json({ error: 'Invalid or expired session' }, 401)
  }

  c.set('user', {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
    avatarUrl: result.user.avatarUrl,
  } satisfies AuthUser)

  await next()
}

export function requireRole(...roles: Role[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await next()
  }
}
