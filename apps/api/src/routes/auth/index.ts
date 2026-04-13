import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { zValidator } from '@hono/zod-validator'
import { loginSchema, registerSchema } from '@sentral/shared/validators/user'
import { authService } from '../../services/auth.service.js'
import { authMiddleware } from '../../middleware/auth.js'
import { env } from '../../lib/env.js'
import type { AppEnv } from '../../types.js'
import { google } from 'googleapis'
import { z } from 'zod'

const SESSION_COOKIE = 'sentral_session'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
}

const auth = new Hono<AppEnv>()

// Google OAuth
const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_CALLBACK_URL,
)

auth.get('/google', (c) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
  })
  return c.redirect(url)
})

auth.get('/google/callback', async (c) => {
  const code = c.req.query('code')
  if (!code) {
    return c.json({ error: 'Missing authorization code' }, 400)
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data } = await oauth2.userinfo.get()

    if (!data.email) {
      return c.json({ error: 'Could not retrieve email from Google' }, 400)
    }

    const result = await authService.googleAuth(
      data.id || '',
      data.email,
      data.name || data.email,
      data.picture || null,
    )

    setCookie(c, SESSION_COOKIE, result.session.token, COOKIE_OPTIONS)
    return c.redirect(env.FRONTEND_URL)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    return c.json({ error: message }, 400)
  }
})

// Email/password auth
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const result = await authService.login(email, password)

  if (!result) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  setCookie(c, SESSION_COOKIE, result.session.token, COOKIE_OPTIONS)
  return c.json({
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      avatarUrl: result.user.avatarUrl,
      authProvider: result.user.authProvider,
    },
  })
})

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, name, password, inviteToken } = c.req.valid('json')

  try {
    const result = await authService.register(email, name, password, inviteToken)
    setCookie(c, SESSION_COOKIE, result.session.token, COOKIE_OPTIONS)
    return c.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          avatarUrl: result.user.avatarUrl,
        },
      },
      201,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    return c.json({ error: message }, 400)
  }
})

auth.post('/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) {
    await authService.logout(token)
    deleteCookie(c, SESSION_COOKIE)
  }
  return c.json({ ok: true })
})

auth.post(
  '/forgot-password',
  zValidator('json', z.object({ email: z.string().email() })),
  async (c) => {
    const { email } = c.req.valid('json')
    // MVP: just log the reset token to console
    console.log(`[AUTH] Password reset requested for: ${email}`)
    // Always return success to prevent email enumeration
    return c.json({ message: 'If an account exists, a reset link will be sent' })
  },
)

// Get current user (authenticated)
auth.get('/me', authMiddleware, (c) => {
  const user = c.get('user')
  return c.json({ user })
})

// Change password (authenticated)
auth.post(
  '/change-password',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }),
  ),
  async (c) => {
    const user = c.get('user')
    const { currentPassword, newPassword } = c.req.valid('json')

    try {
      await authService.changePassword(user.id, currentPassword, newPassword)
      return c.json({ message: 'Password changed successfully' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password'
      return c.json({ error: message }, 400)
    }
  },
)

// Update profile (authenticated)
auth.patch(
  '/profile',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).optional(),
      avatarUrl: z.string().url().nullable().optional(),
    }),
  ),
  async (c) => {
    const currentUser = c.get('user')
    const data = c.req.valid('json')

    try {
      const updated = await authService.updateProfile(currentUser.id, data)
      return c.json({
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role,
          avatarUrl: updated.avatarUrl,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      return c.json({ error: message }, 400)
    }
  },
)

// List active sessions
auth.get('/sessions', authMiddleware, async (c) => {
  const user = c.get('user')
  const token = getCookie(c, SESSION_COOKIE)!
  const currentTokenHash = await import('../../lib/auth.js').then((m) => m.hashToken(token))
  const sessionList = await authService.getSessions(user.id, currentTokenHash)
  return c.json({ sessions: sessionList })
})

// Revoke a specific session
auth.delete('/sessions/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const sessionId = c.req.param('id') as string
  try {
    await authService.revokeSession(user.id, sessionId)
    return c.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to revoke session'
    return c.json({ error: message }, 400)
  }
})

// Revoke all other sessions
auth.post('/sessions/revoke-others', authMiddleware, async (c) => {
  const user = c.get('user')
  const token = getCookie(c, SESSION_COOKIE)!
  const currentTokenHash = await import('../../lib/auth.js').then((m) => m.hashToken(token))
  await authService.revokeOtherSessions(user.id, currentTokenHash)
  return c.json({ ok: true })
})

// Export user data
auth.get('/export', authMiddleware, async (c) => {
  const user = c.get('user')
  const data = await authService.exportUserData(user.id)
  return c.json(data)
})

// Delete account
auth.post(
  '/delete-account',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      password: z.string().nullable(),
    }),
  ),
  async (c) => {
    const user = c.get('user')
    const { password } = c.req.valid('json')
    try {
      await authService.deleteAccount(user.id, password)
      deleteCookie(c, SESSION_COOKIE)
      return c.json({ ok: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account'
      return c.json({ error: message }, 400)
    }
  },
)

export { auth }
