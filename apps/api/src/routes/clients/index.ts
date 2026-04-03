import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createClientSchema,
  updateClientSchema,
  clientProjectSchema,
} from '@sentralyzed/shared/validators/client'
import { authMiddleware } from '../../middleware/auth.js'
import { clientsService } from '../../services/clients.service.js'
import type { AppEnv } from '../../types.js'

const clientsRouter = new Hono<AppEnv>()

clientsRouter.use('*', authMiddleware)

// List clients
clientsRouter.get('/', async (c) => {
  const status = c.req.query('status')
  const search = c.req.query('search')
  const clients = await clientsService.list({ status, search })
  return c.json({ clients })
})

// Get single client
clientsRouter.get('/:id', async (c) => {
  const client = await clientsService.getById(c.req.param('id'))
  if (!client) return c.json({ error: 'Client not found' }, 404)
  return c.json({ client })
})

// Create client
clientsRouter.post('/', zValidator('json', createClientSchema), async (c) => {
  const data = c.req.valid('json')
  const user = c.get('user')
  const client = await clientsService.create({ ...data, ownerId: user.id })
  return c.json({ client }, 201)
})

// Update client
clientsRouter.patch('/:id', zValidator('json', updateClientSchema), async (c) => {
  const client = await clientsService.update(c.req.param('id'), c.req.valid('json'))
  if (!client) return c.json({ error: 'Client not found' }, 404)
  return c.json({ client })
})

// Soft delete client
clientsRouter.delete('/:id', async (c) => {
  const client = await clientsService.softDelete(c.req.param('id'))
  if (!client) return c.json({ error: 'Client not found' }, 404)
  return c.json({ ok: true })
})

// Associate project with client
clientsRouter.post('/:id/projects', zValidator('json', clientProjectSchema), async (c) => {
  const { projectId, role, startDate, endDate } = c.req.valid('json')
  const clientProject = await clientsService.addProject(
    c.req.param('id'),
    projectId,
    role as any,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined,
  )
  return c.json({ clientProject }, 201)
})

// Get projects for a client
clientsRouter.get('/:id/projects', async (c) => {
  const clientProjects = await clientsService.getProjects(c.req.param('id'))
  return c.json({ clientProjects })
})

// Remove project association
clientsRouter.delete('/:id/projects/:projectId', async (c) => {
  await clientsService.removeProject(c.req.param('id'), c.req.param('projectId'))
  return c.json({ ok: true })
})

export { clientsRouter }
