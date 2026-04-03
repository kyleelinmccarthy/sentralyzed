import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware, requireRole } from '../../middleware/auth.js'
import { feedbackService } from '../../services/feedback.service.js'
import {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
  createFeedbackResponseSchema,
  feedbackQuerySchema,
} from '@sentralyzed/shared/validators/feedback'
import type { AppEnv } from '../../types.js'

const feedbackRouter = new Hono<AppEnv>()
feedbackRouter.use('*', authMiddleware)

feedbackRouter.post('/', zValidator('json', createFeedbackSchema), async (c) => {
  const user = c.get('user')
  const feedback = await feedbackService.create(c.req.valid('json'), user.id)
  return c.json({ feedback }, 201)
})

feedbackRouter.get('/', zValidator('query', feedbackQuerySchema), async (c) => {
  const user = c.get('user')
  const query = c.req.valid('query')
  const feedback = await feedbackService.list(query, user.id, user.role)
  return c.json({ feedback })
})

feedbackRouter.get('/:id', async (c) => {
  const user = c.get('user')
  const feedback = await feedbackService.getWithResponses(c.req.param('id'), user.id, user.role)
  if (!feedback) return c.json({ error: 'Feedback not found' }, 404)
  return c.json({ feedback })
})

feedbackRouter.patch(
  '/:id/status',
  requireRole('admin', 'manager'),
  zValidator('json', updateFeedbackStatusSchema),
  async (c) => {
    const user = c.get('user')
    const result = await feedbackService.updateStatus(
      c.req.param('id'),
      c.req.valid('json'),
      user.id,
    )
    if ('error' in result) return c.json({ error: result.error }, 400)
    return c.json({ feedback: result })
  },
)

feedbackRouter.post(
  '/:id/responses',
  requireRole('admin', 'manager'),
  zValidator('json', createFeedbackResponseSchema),
  async (c) => {
    const user = c.get('user')
    const result = await feedbackService.addResponse(
      c.req.param('id'),
      c.req.valid('json').message,
      user.id,
    )
    if ('error' in result) return c.json({ error: result.error }, 400)
    return c.json({ response: result }, 201)
  },
)

feedbackRouter.delete('/:id', async (c) => {
  const user = c.get('user')
  const ok = await feedbackService.softDelete(c.req.param('id'), user.id, user.role)
  if (!ok) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ ok: true })
})

export { feedbackRouter }
