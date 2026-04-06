import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.js'
import { pinService } from '../../services/pin.service.js'
import type { AppEnv } from '../../types.js'

const pinRouter = new Hono<AppEnv>()
pinRouter.use('*', authMiddleware)

// --- Chat message pins ---

pinRouter.post('/messages/:id', async (c) => {
  const user = c.get('user')
  const pin = await pinService.pinMessage(c.req.param('id'), user.id)
  if (!pin) return c.json({ error: 'Message not found or already pinned' }, 404)
  return c.json({ pin }, 201)
})

pinRouter.delete('/messages/:id', async (c) => {
  const ok = await pinService.unpinMessage(c.req.param('id'))
  if (!ok) return c.json({ error: 'Message is not pinned' }, 404)
  return c.json({ ok: true })
})

pinRouter.get('/channels/:id', async (c) => {
  const pins = await pinService.getPinnedMessages(c.req.param('id'))
  return c.json({ pins })
})

// --- Forum reply pins ---

pinRouter.post('/forum-replies/:id', async (c) => {
  const user = c.get('user')
  const pin = await pinService.pinForumReply(c.req.param('id'), user.id)
  if (!pin) return c.json({ error: 'Reply not found or already pinned' }, 404)
  return c.json({ pin }, 201)
})

pinRouter.delete('/forum-replies/:id', async (c) => {
  const ok = await pinService.unpinForumReply(c.req.param('id'))
  if (!ok) return c.json({ error: 'Reply is not pinned' }, 404)
  return c.json({ ok: true })
})

pinRouter.get('/threads/:id', async (c) => {
  const pins = await pinService.getPinnedForumReplies(c.req.param('id'))
  return c.json({ pins })
})

export { pinRouter }
