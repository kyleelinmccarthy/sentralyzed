import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { authService } from '../../services/auth.service.js'
import { authMiddleware } from '../../middleware/auth.js'
import { auth as betterAuth } from '../../lib/better-auth.js'
import { db } from '../../db/index.js'
import { users } from '../../db/schema/users.js'
import { invitations } from '../../db/schema/invitations.js'
import { hashToken } from '../../lib/auth.js'
import type { AppEnv } from '../../types.js'

const auth = new Hono<AppEnv>()

// ─── Current user (authenticated) ───
auth.get('/me', authMiddleware, (c) => {
  const user = c.get('user')
  return c.json({ user })
})

// ─── Update profile (authenticated) ───
// Updates our local users row AND syncs name/image to Better Auth so the session
// reflects the new values immediately.
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

// ─── Export user data (authenticated, GDPR) ───
auth.get('/export', authMiddleware, async (c) => {
  const user = c.get('user')
  const data = await authService.exportUserData(user.id)
  return c.json(data)
})

// ─── Delete account (authenticated) ───
// The frontend should call authClient.deleteUser() first to remove the Better
// Auth session/account records, then this endpoint to soft-delete our local row
// and anonymize PII.
auth.post('/delete-account', authMiddleware, async (c) => {
  const user = c.get('user')
  try {
    await authService.deleteAccount(user.id)
    return c.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete account'
    return c.json({ error: message }, 400)
  }
})

// ─── Validate an invitation token (public) ───
// Used by the /register page to confirm a token is valid before showing the form.
// Returns email + role so the form can pre-fill / display them.
auth.get('/invitations/:token', async (c) => {
  const token = c.req.param('token')
  const tokenHash = hashToken(token)
  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.tokenHash, tokenHash),
  })

  if (!invite) {
    return c.json({ error: 'Invitation not found' }, 404)
  }
  if (invite.acceptedAt) {
    return c.json({ error: 'Invitation already used' }, 400)
  }
  if (invite.expiresAt < new Date()) {
    return c.json({ error: 'Invitation expired' }, 400)
  }

  return c.json({ email: invite.email, role: invite.role })
})

// ─── Invitation-gated email signup (public) ───
// Validates the invite, calls Better Auth's internal signUp.email API (bypassing
// the public `disableSignUp` gate), then upgrades the new user with the role
// and invitedBy from the invitation. Better Auth's autoSignIn issues the session
// cookie automatically.
auth.post(
  '/invitation-signup',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      name: z.string().min(1),
      password: z.string().min(8),
      inviteToken: z.string().min(1),
    }),
  ),
  async (c) => {
    const { email, name, password, inviteToken } = c.req.valid('json')

    const tokenHash = hashToken(inviteToken)
    const invite = await db.query.invitations.findFirst({
      where: and(eq(invitations.tokenHash, tokenHash), eq(invitations.email, email)),
    })

    if (!invite) {
      return c.json({ error: 'Invalid invitation token' }, 400)
    }
    if (invite.acceptedAt) {
      return c.json({ error: 'Invitation already used' }, 400)
    }
    if (invite.expiresAt < new Date()) {
      return c.json({ error: 'Invitation expired' }, 400)
    }

    // Sign up via Better Auth — `asResponse: true` returns the raw Response so
    // we can forward the Set-Cookie header that establishes the session.
    let response: Response
    try {
      response = await betterAuth.api.signUpEmail({
        body: { email, name, password },
        asResponse: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed'
      return c.json({ error: message }, 400)
    }

    if (!response.ok) {
      return new Response(response.body, { status: response.status, headers: response.headers })
    }

    // Upgrade the freshly-created user with role + invitedBy from the invite,
    // and mark the invitation accepted.
    await db
      .update(users)
      .set({ role: invite.role, invitedBy: invite.invitedBy, emailVerified: true })
      .where(eq(users.email, email))

    await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invite.id))

    return new Response(response.body, { status: response.status, headers: response.headers })
  },
)

export { auth }
