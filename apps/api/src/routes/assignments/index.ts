import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../middleware/auth.js'
import { assignmentsService } from '../../services/assignments.service.js'
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  assignableEntityTypeSchema,
} from '@sentralyzed/shared/validators/assignment'
import type { AppEnv } from '../../types.js'

const assignmentsRouter = new Hono<AppEnv>()
assignmentsRouter.use('*', authMiddleware)

assignmentsRouter.post('/', zValidator('json', createAssignmentSchema), async (c) => {
  const data = c.req.valid('json')
  const user = c.get('user')
  const assignment = await assignmentsService.assign({ ...data, assignedBy: user.id })
  if (!assignment) return c.json({ error: 'Assignment already exists' }, 409)
  return c.json({ assignment }, 201)
})

assignmentsRouter.get('/entity/:entityType/:entityId', async (c) => {
  const entityType = assignableEntityTypeSchema.parse(c.req.param('entityType'))
  const entityId = c.req.param('entityId')
  const assignments = await assignmentsService.findByEntity(entityType, entityId)
  return c.json({ assignments })
})

assignmentsRouter.get('/user/:userId', async (c) => {
  const userId = c.req.param('userId')
  const assignments = await assignmentsService.findByUser(userId)
  return c.json({ assignments })
})

assignmentsRouter.patch('/:id', zValidator('json', updateAssignmentSchema), async (c) => {
  const { role } = c.req.valid('json')
  const assignment = await assignmentsService.updateRole(c.req.param('id'), role)
  if (!assignment) return c.json({ error: 'Assignment not found' }, 404)
  return c.json({ assignment })
})

assignmentsRouter.delete('/:id', async (c) => {
  const ok = await assignmentsService.remove(c.req.param('id'))
  if (!ok) return c.json({ error: 'Assignment not found' }, 404)
  return c.json({ ok: true })
})

export { assignmentsRouter }
