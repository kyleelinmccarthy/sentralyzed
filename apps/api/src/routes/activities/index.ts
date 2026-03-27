import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.js'
import { activitiesService } from '../../services/activities.service.js'
import type { AppEnv } from '../../types.js'

const activitiesRouter = new Hono<AppEnv>()

activitiesRouter.use('*', authMiddleware)

activitiesRouter.get('/', async (c) => {
  const entityType = c.req.query('entityType')
  const limit = c.req.query('limit')
  const activityList = await activitiesService.listActivities({
    entityType: entityType || undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
  })
  return c.json({ activities: activityList })
})

// Notifications
activitiesRouter.get('/notifications', async (c) => {
  const user = c.get('user')
  const notificationsList = await activitiesService.getUserNotifications(user.id)
  return c.json({ notifications: notificationsList })
})

activitiesRouter.get('/notifications/count', async (c) => {
  const user = c.get('user')
  const count = await activitiesService.getUnreadCount(user.id)
  return c.json({ count })
})

activitiesRouter.patch('/notifications/:id/read', async (c) => {
  const notification = await activitiesService.markRead(c.req.param('id'))
  if (!notification) return c.json({ error: 'Notification not found' }, 404)
  return c.json({ notification })
})

activitiesRouter.patch('/notifications/read-all', async (c) => {
  const user = c.get('user')
  await activitiesService.markAllRead(user.id)
  return c.json({ ok: true })
})

export { activitiesRouter }
