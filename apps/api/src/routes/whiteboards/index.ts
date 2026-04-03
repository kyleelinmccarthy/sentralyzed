import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.js'
import { whiteboardsService } from '../../services/whiteboards.service.js'
import type { AppEnv } from '../../types.js'

const whiteboardsRouter = new Hono<AppEnv>()

whiteboardsRouter.use('*', authMiddleware)

const createSchema = z.object({
  name: z.string().min(1).max(255),
  projectId: z.string().uuid().optional(),
})

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  shapesData: z.array(z.record(z.unknown())).optional(),
})

// List whiteboards
whiteboardsRouter.get('/', async (c) => {
  const user = c.get('user')
  const list = await whiteboardsService.list(user.id)
  return c.json({ whiteboards: list })
})

// Get single whiteboard (with shapes)
whiteboardsRouter.get('/:id', async (c) => {
  const whiteboard = await whiteboardsService.getById(c.req.param('id'))
  if (!whiteboard) return c.json({ error: 'Whiteboard not found' }, 404)
  return c.json({ whiteboard })
})

// Create whiteboard
whiteboardsRouter.post('/', zValidator('json', createSchema), async (c) => {
  const data = c.req.valid('json')
  const user = c.get('user')
  const whiteboard = await whiteboardsService.create({ ...data, createdBy: user.id })
  return c.json({ whiteboard }, 201)
})

// Update whiteboard (name and/or shapes)
whiteboardsRouter.patch('/:id', zValidator('json', updateSchema), async (c) => {
  const whiteboard = await whiteboardsService.update(c.req.param('id'), c.req.valid('json'))
  if (!whiteboard) return c.json({ error: 'Whiteboard not found' }, 404)
  return c.json({ whiteboard })
})

// Delete whiteboard (soft)
whiteboardsRouter.delete('/:id', async (c) => {
  const whiteboard = await whiteboardsService.softDelete(c.req.param('id'))
  if (!whiteboard) return c.json({ error: 'Whiteboard not found' }, 404)
  return c.json({ ok: true })
})

export { whiteboardsRouter }
