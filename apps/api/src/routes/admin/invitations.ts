import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../../middleware/auth.js'
import { authService } from '../../services/auth.service.js'
import { db } from '../../db/index.js'
import { invitations } from '../../db/schema/invitations.js'
import { eq } from 'drizzle-orm'
import type { AppEnv } from '../../types.js'

const adminInvitations = new Hono<AppEnv>()

adminInvitations.use('*', authMiddleware)
adminInvitations.use('*', requireRole('admin'))

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'member']),
})

adminInvitations.post('/', zValidator('json', createInvitationSchema), async (c) => {
  const { email, role } = c.req.valid('json')
  const user = c.get('user')

  try {
    const invitation = await authService.createInvitation(email, role, user.id)
    return c.json({ invitation: { id: invitation.id, email, role, token: invitation.token } }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create invitation'
    return c.json({ error: message }, 400)
  }
})

adminInvitations.get('/', async (c) => {
  const allInvitations = await db.query.invitations.findMany({
    orderBy: (inv, { desc }) => [desc(inv.createdAt)],
  })
  return c.json({
    invitations: allInvitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
      acceptedAt: inv.acceptedAt,
      createdAt: inv.createdAt,
    })),
  })
})

adminInvitations.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await db.delete(invitations).where(eq(invitations.id, id))
  return c.json({ ok: true })
})

export { adminInvitations }
