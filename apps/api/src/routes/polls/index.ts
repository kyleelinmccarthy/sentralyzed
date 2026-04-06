import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../middleware/auth.js'
import { pollsService } from '../../services/polls.service.js'
import {
  createPollSchema,
  votePollSchema,
  pollContextTypeSchema,
} from '@sentralyzed/shared/validators/poll'
import type { PollContextType } from '@sentralyzed/shared/types/poll'
import type { AppEnv } from '../../types.js'

const pollsRouter = new Hono<AppEnv>()
pollsRouter.use('*', authMiddleware)

// List polls — optionally filtered by context
pollsRouter.get('/', async (c) => {
  const rawContextType = c.req.query('contextType')
  const contextId = c.req.query('contextId')
  const user = c.get('user')

  if (rawContextType && contextId) {
    const parsed = pollContextTypeSchema.safeParse(rawContextType)
    if (!parsed.success) {
      return c.json({ error: 'Invalid contextType' }, 400)
    }
    const polls = await pollsService.getByContext(
      parsed.data as PollContextType,
      contextId,
      user.id,
    )
    return c.json({ polls })
  }

  // No filter — return all polls (most recent first)
  const polls = await pollsService.getAll(user.id)
  return c.json({ polls })
})

// Get a single poll
pollsRouter.get('/:id', async (c) => {
  const user = c.get('user')
  const poll = await pollsService.getById(c.req.param('id'), user.id)
  if (!poll) return c.json({ error: 'Poll not found' }, 404)
  return c.json({ poll })
})

// Create a poll
pollsRouter.post('/', zValidator('json', createPollSchema), async (c) => {
  const user = c.get('user')
  const poll = await pollsService.create(c.req.valid('json'), user.id)
  return c.json({ poll }, 201)
})

// Vote on a poll
pollsRouter.post('/:id/vote', zValidator('json', votePollSchema), async (c) => {
  const user = c.get('user')
  const result = await pollsService.vote(c.req.param('id'), c.req.valid('json').optionIds, user.id)
  if ('error' in result) return c.json({ error: result.error }, 400)
  return c.json({ poll: result.poll })
})

// Close a poll (creator only)
pollsRouter.post('/:id/close', async (c) => {
  const user = c.get('user')
  const poll = await pollsService.close(c.req.param('id'), user.id)
  if (!poll) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ poll })
})

// Delete a poll (creator only)
pollsRouter.delete('/:id', async (c) => {
  const user = c.get('user')
  const ok = await pollsService.deletePoll(c.req.param('id'), user.id)
  if (!ok) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ ok: true })
})

export { pollsRouter }
