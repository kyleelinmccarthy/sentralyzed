import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../../middleware/auth.js'
import { forumsService } from '../../services/forums.service.js'
import type { AppEnv } from '../../types.js'

const forumsRouter = new Hono<AppEnv>()
forumsRouter.use('*', authMiddleware)

// Categories (admin only for mutations)
forumsRouter.get('/categories', async (c) => {
  const categories = await forumsService.listCategories()
  return c.json({ categories })
})

forumsRouter.post(
  '/categories',
  requireRole('admin'),
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    }),
  ),
  async (c) => {
    const cat = await forumsService.createCategory(c.req.valid('json'))
    return c.json({ category: cat }, 201)
  },
)

forumsRouter.patch(
  '/categories/:id',
  requireRole('admin'),
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
      position: z.number().int().optional(),
    }),
  ),
  async (c) => {
    const cat = await forumsService.updateCategory(c.req.param('id'), c.req.valid('json'))
    return c.json({ category: cat })
  },
)

forumsRouter.delete('/categories/:id', requireRole('admin'), async (c) => {
  await forumsService.deleteCategory(c.req.param('id') as string)
  return c.json({ ok: true })
})

// Threads
forumsRouter.get('/threads', async (c) => {
  const categoryId = c.req.query('categoryId')
  const search = c.req.query('search')
  const threads = await forumsService.listThreads(categoryId || undefined, search || undefined)
  return c.json({ threads })
})

forumsRouter.get('/threads/:id', async (c) => {
  const thread = await forumsService.getThread(c.req.param('id'))
  if (!thread) return c.json({ error: 'Thread not found' }, 404)
  return c.json({ thread })
})

forumsRouter.post(
  '/threads',
  zValidator(
    'json',
    z.object({
      title: z.string().min(1).max(255),
      content: z.unknown().optional(),
      categoryId: z.string().uuid(),
    }),
  ),
  async (c) => {
    const user = c.get('user')
    const thread = await forumsService.createThread({ ...c.req.valid('json'), authorId: user.id })
    return c.json({ thread }, 201)
  },
)

forumsRouter.patch(
  '/threads/:id',
  zValidator(
    'json',
    z.object({
      title: z.string().min(1).max(255).optional(),
      content: z.unknown().optional(),
      isPinned: z.boolean().optional(),
      isLocked: z.boolean().optional(),
    }),
  ),
  async (c) => {
    const thread = await forumsService.updateThread(c.req.param('id'), c.req.valid('json'))
    return c.json({ thread })
  },
)

forumsRouter.delete('/threads/:id', async (c) => {
  await forumsService.deleteThread(c.req.param('id'))
  return c.json({ ok: true })
})

// Replies
forumsRouter.get('/threads/:id/replies', async (c) => {
  const replies = await forumsService.listReplies(c.req.param('id'))
  return c.json({ replies })
})

forumsRouter.post(
  '/threads/:id/replies',
  zValidator(
    'json',
    z.object({
      content: z.unknown().optional(),
      replyToId: z.string().uuid().optional(),
    }),
  ),
  async (c) => {
    const user = c.get('user')
    const reply = await forumsService.createReply({
      threadId: c.req.param('id'),
      authorId: user.id,
      ...c.req.valid('json'),
    })
    return c.json({ reply }, 201)
  },
)

forumsRouter.patch(
  '/replies/:id',
  zValidator('json', z.object({ content: z.any() })),
  async (c) => {
    const user = c.get('user')
    const reply = await forumsService.updateReply(c.req.param('id'), user.id, c.req.valid('json'))
    if (!reply) return c.json({ error: 'Not found or unauthorized' }, 404)
    return c.json({ reply })
  },
)

forumsRouter.delete('/replies/:id', async (c) => {
  await forumsService.deleteReply(c.req.param('id'))
  return c.json({ ok: true })
})

// Reactions
forumsRouter.post(
  '/reactions',
  zValidator(
    'json',
    z.object({
      entityType: z.enum(['thread', 'reply']),
      entityId: z.string().uuid(),
      emoji: z.string().min(1).max(50),
    }),
  ),
  async (c) => {
    const user = c.get('user')
    const { entityType, entityId, emoji } = c.req.valid('json')
    const action = await forumsService.toggleReaction(entityType, entityId, user.id, emoji)
    return c.json({ action })
  },
)

// Search
forumsRouter.get('/search', async (c) => {
  const q = c.req.query('q') || ''
  const results = await forumsService.search(q)
  return c.json(results)
})

export { forumsRouter }
