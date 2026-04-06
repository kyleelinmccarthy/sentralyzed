import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, ne, and } from 'drizzle-orm'
import { authMiddleware } from '../../middleware/auth.js'
import { chatService } from '../../services/chat.service.js'
import { db } from '../../db/index.js'
import { users } from '../../db/schema/users.js'
import type { AppEnv } from '../../types.js'

const chatRouter = new Hono<AppEnv>()
chatRouter.use('*', authMiddleware)

// List users for DM (excludes current user)
chatRouter.get('/users', async (c) => {
  const currentUser = c.get('user')
  const allUsers = await db.query.users.findMany({
    where: and(ne(users.id, currentUser.id), eq(users.isActive, true)),
    columns: { id: true, name: true, email: true, avatarUrl: true },
    orderBy: (u, { asc }) => [asc(u.name)],
  })
  return c.json({ users: allUsers })
})

// Get or create a DM channel with another user
chatRouter.post('/dm/:userId', async (c) => {
  const currentUser = c.get('user')
  const targetUserId = c.req.param('userId')
  const channel = await chatService.getOrCreateDM(currentUser.id, targetUserId)
  return c.json({ channel })
})

chatRouter.get('/channels', async (c) => {
  const user = c.get('user')
  const channelList = await chatService.listChannels(user.id)
  return c.json({ channels: channelList })
})

chatRouter.post(
  '/channels',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      type: z.enum(['public', 'private', 'direct']).default('public'),
      projectId: z.string().uuid().optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')
    const channel = await chatService.createChannel({ ...data, createdBy: user.id })
    return c.json({ channel }, 201)
  },
)

chatRouter.patch(
  '/channels/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
    }),
  ),
  async (c) => {
    const channel = await chatService.updateChannel(c.req.param('id'), c.req.valid('json'))
    if (!channel) return c.json({ error: 'Not found or not editable' }, 404)
    return c.json({ channel })
  },
)

chatRouter.get('/channels/:id/messages', async (c) => {
  const cursor = c.req.query('cursor')
  const limit = c.req.query('limit')
  const msgs = await chatService.getMessages(
    c.req.param('id'),
    cursor || undefined,
    limit ? parseInt(limit, 10) : undefined,
  )
  return c.json({ messages: msgs })
})

chatRouter.patch(
  '/messages/:id',
  zValidator('json', z.object({ content: z.string().min(1) })),
  async (c) => {
    const user = c.get('user')
    const msg = await chatService.editMessage(
      c.req.param('id'),
      user.id,
      c.req.valid('json').content,
    )
    if (!msg) return c.json({ error: 'Not found or unauthorized' }, 404)
    return c.json({ message: msg })
  },
)

chatRouter.delete('/messages/:id', async (c) => {
  const user = c.get('user')
  const ok = await chatService.deleteMessage(c.req.param('id'), user.id)
  if (!ok) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ ok: true })
})

chatRouter.post(
  '/messages/:id/reactions',
  zValidator('json', z.object({ emoji: z.string().min(1).max(50) })),
  async (c) => {
    const user = c.get('user')
    const action = await chatService.toggleReaction(
      c.req.param('id'),
      user.id,
      c.req.valid('json').emoji,
    )
    return c.json({ action })
  },
)

chatRouter.post('/channels/:id/read', async (c) => {
  const user = c.get('user')
  await chatService.markRead(c.req.param('id'), user.id)
  return c.json({ ok: true })
})

chatRouter.post(
  '/channels/:id/members',
  zValidator('json', z.object({ userId: z.string().uuid() })),
  async (c) => {
    await chatService.addMember(c.req.param('id'), c.req.valid('json').userId)
    return c.json({ ok: true }, 201)
  },
)

chatRouter.get('/channels/:id/members', async (c) => {
  const members = await chatService.getMembers(c.req.param('id'))
  return c.json({ members })
})

export { chatRouter }
