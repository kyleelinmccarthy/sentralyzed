import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.js'
import { projectsService } from '../../services/projects.service.js'
import type { AppEnv } from '../../types.js'

const projectsRouter = new Hono<AppEnv>()

projectsRouter.use('*', authMiddleware)

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  goalId: z.string().uuid().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(50).optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  priority: z.number().int().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(50).optional(),
})

projectsRouter.get('/', async (c) => {
  const status = c.req.query('status')
  const search = c.req.query('search')
  const projectsList = await projectsService.list({ status, search })
  return c.json({ projects: projectsList })
})

projectsRouter.get('/:id', async (c) => {
  const project = await projectsService.getById(c.req.param('id'))
  if (!project) return c.json({ error: 'Project not found' }, 404)
  return c.json({ project })
})

projectsRouter.post('/', zValidator('json', createProjectSchema), async (c) => {
  const data = c.req.valid('json')
  const user = c.get('user')
  const project = await projectsService.create({ ...data, ownerId: user.id })
  return c.json({ project }, 201)
})

projectsRouter.patch('/:id', zValidator('json', updateProjectSchema), async (c) => {
  const project = await projectsService.update(c.req.param('id'), c.req.valid('json'))
  if (!project) return c.json({ error: 'Project not found' }, 404)
  return c.json({ project })
})

projectsRouter.put(
  '/:id/reorder',
  zValidator(
    'json',
    z.object({ items: z.array(z.object({ id: z.string().uuid(), priority: z.number().int() })) }),
  ),
  async (c) => {
    const { items } = c.req.valid('json')
    await projectsService.reorder(items)
    return c.json({ ok: true })
  },
)

projectsRouter.post(
  '/:id/members',
  zValidator(
    'json',
    z.object({ userId: z.string().uuid(), role: z.enum(['lead', 'contributor', 'viewer']) }),
  ),
  async (c) => {
    const { userId, role } = c.req.valid('json')
    const member = await projectsService.addMember(c.req.param('id'), userId, role)
    return c.json({ member }, 201)
  },
)

projectsRouter.get('/:id/members', async (c) => {
  const members = await projectsService.getMembers(c.req.param('id'))
  return c.json({ members })
})

projectsRouter.delete('/:id', async (c) => {
  const project = await projectsService.softDelete(c.req.param('id'))
  if (!project) return c.json({ error: 'Project not found' }, 404)
  return c.json({ ok: true })
})

export { projectsRouter }
