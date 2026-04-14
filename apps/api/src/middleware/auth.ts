import type { Context, Next } from 'hono'
import { eq } from 'drizzle-orm'
import { getSessionFromHeaders } from '../lib/better-auth.js'
import { db } from '../db/index.js'
import { users } from '../db/schema/users.js'
import type { Role } from '@sentral/shared/types/user'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  avatarUrl: string | null
}

export async function authMiddleware(c: Context, next: Next) {
  // Fast path: header set by the Next.js catch-all (extracts session once per request)
  let userId = c.req.header('x-auth-user-id')

  // Fallback: WS server / standalone API in local dev hits Better Auth directly
  if (!userId) {
    const session = await getSessionFromHeaders(c.req.raw.headers)
    userId = session?.user?.id
  }

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user || !user.isActive) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  c.set('user', {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
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
