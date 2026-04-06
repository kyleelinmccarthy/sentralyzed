import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.js'
import { dashboardService } from '../../services/dashboard.service.js'
import type { AppEnv } from '../../types.js'

export const dashboardRouter = new Hono<AppEnv>()

dashboardRouter.use('*', authMiddleware)

dashboardRouter.get('/my-items', async (c) => {
  const user = c.get('user')
  const { from: fromParam, to: toParam } = c.req.query()

  const from = fromParam ? new Date(fromParam) : new Date()
  const to = toParam ? new Date(toParam) : new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000)

  const items = await dashboardService.getMyItems(user.id, from, to)
  return c.json({ items })
})
