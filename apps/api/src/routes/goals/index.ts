import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.js'
import { goalsService } from '../../services/goals.service.js'
import type { AppEnv } from '../../types.js'

const goalsRouter = new Hono<AppEnv>()

goalsRouter.use('*', authMiddleware)

const createGoalSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  level: z.enum(['company', 'team', 'personal']),
  parentGoalId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  targetDate: z.string().optional(),
})

const updateGoalSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'archived']).optional(),
  targetDate: z.string().optional(),
})

// List goals
goalsRouter.get('/', async (c) => {
  const level = c.req.query('level')
  const status = c.req.query('status')
  const ownerId = c.req.query('ownerId')

  // Members can only see their own personal goals + team/company goals
  const filters: { level?: string; status?: string; ownerId?: string } = {}
  if (level) filters.level = level
  if (status) filters.status = status
  if (ownerId) filters.ownerId = ownerId

  const goalsList = await goalsService.list(filters)
  return c.json({ goals: goalsList })
})

// Get single goal
goalsRouter.get('/:id', async (c) => {
  const goal = await goalsService.getById(c.req.param('id'))
  if (!goal) return c.json({ error: 'Goal not found' }, 404)
  return c.json({ goal })
})

// Get full alignment tree
goalsRouter.get('/:id/tree', async (c) => {
  const tree = await goalsService.getTree(c.req.param('id'))
  return c.json({ tree })
})

// Create goal
goalsRouter.post('/', zValidator('json', createGoalSchema), async (c) => {
  const data = c.req.valid('json')
  const user = c.get('user')

  // RBAC: only admin/manager can create company/team goals
  if (data.level !== 'personal' && user.role === 'member') {
    return c.json({ error: 'Members can only create personal goals' }, 403)
  }

  const goal = await goalsService.create({ ...data, ownerId: user.id })
  return c.json({ goal }, 201)
})

// Update goal
goalsRouter.patch('/:id', zValidator('json', updateGoalSchema), async (c) => {
  const goal = await goalsService.update(c.req.param('id'), c.req.valid('json'))
  if (!goal) return c.json({ error: 'Goal not found' }, 404)
  return c.json({ goal })
})

// Update progress
goalsRouter.patch(
  '/:id/progress',
  zValidator('json', z.object({ progress: z.number().min(0).max(100) })),
  async (c) => {
    const { progress } = c.req.valid('json')
    const goal = await goalsService.updateProgress(c.req.param('id'), progress)
    if (!goal) return c.json({ error: 'Goal not found' }, 404)
    return c.json({ goal })
  },
)

// Delete goal (soft)
goalsRouter.delete('/:id', async (c) => {
  const goal = await goalsService.softDelete(c.req.param('id'))
  if (!goal) return c.json({ error: 'Goal not found' }, 404)
  return c.json({ ok: true })
})

export { goalsRouter }
