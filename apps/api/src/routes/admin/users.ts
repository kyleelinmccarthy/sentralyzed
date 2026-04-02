import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { authMiddleware, requireRole } from '../../middleware/auth.js'
import { db } from '../../db/index.js'
import { users } from '../../db/schema/users.js'
import { activities } from '../../db/schema/activities.js'
import type { AppEnv } from '../../types.js'

const adminUsersRouter = new Hono<AppEnv>()
adminUsersRouter.use('*', authMiddleware)
adminUsersRouter.use('*', requireRole('admin'))

adminUsersRouter.get('/', async (c) => {
  const allUsers = await db.query.users.findMany({
    columns: { passwordHash: false },
    orderBy: (u, { desc: d }) => [d(u.createdAt)],
  })
  return c.json({ users: allUsers })
})

adminUsersRouter.get('/:id', async (c) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, c.req.param('id')),
    columns: { passwordHash: false },
  })
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({ user })
})

adminUsersRouter.patch(
  '/:id',
  zValidator(
    'json',
    z.object({
      role: z.enum(['admin', 'manager', 'member']).optional(),
      isActive: z.boolean().optional(),
    }),
  ),
  async (c) => {
    const [user] = await db
      .update(users)
      .set(c.req.valid('json'))
      .where(eq(users.id, c.req.param('id')))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
      })
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json({ user })
  },
)

adminUsersRouter.delete('/:id', async (c) => {
  const [user] = await db
    .update(users)
    .set({ isActive: false })
    .where(eq(users.id, c.req.param('id')))
    .returning()
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({ ok: true })
})

adminUsersRouter.get('/:id/activity', async (c) => {
  const userActivities = await db.query.activities.findMany({
    where: eq(activities.actorId, c.req.param('id')),
    orderBy: (a, { desc: d }) => [d(a.createdAt)],
    limit: 50,
  })
  return c.json({ activities: userActivities })
})

export { adminUsersRouter }
