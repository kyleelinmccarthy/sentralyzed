import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.js'
import { githubService } from '../../services/github.service.js'
import type { AppEnv } from '../../types.js'

const githubRouter = new Hono<AppEnv>()

// Webhook endpoint (no auth middleware — GitHub calls this)
githubRouter.post('/webhook', async (c) => {
  const signature = c.req.header('x-hub-signature-256') || ''
  const eventType = c.req.header('x-github-event') || ''
  const body = await c.req.text()

  if (!githubService.verifyWebhookSignature(body, signature)) {
    return c.json({ error: 'Invalid signature' }, 401)
  }

  const payload = JSON.parse(body) as Record<string, unknown>
  await githubService.handleWebhook(eventType, payload)
  return c.json({ ok: true })
})

// Authenticated routes
githubRouter.use('/repos/*', authMiddleware)
githubRouter.use('/connect', authMiddleware)

githubRouter.post(
  '/repos/link',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      projectId: z.string().uuid(),
      githubRepoId: z.number(),
      fullName: z.string(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const repo = await githubService.linkRepo(data.projectId, data.githubRepoId, data.fullName)
    return c.json({ repo }, 201)
  },
)

githubRouter.get('/repos/:projectId', authMiddleware, async (c) => {
  const repo = await githubService.getRepoByProject(c.req.param('projectId') as string)
  if (!repo) return c.json({ error: 'No linked repo' }, 404)
  return c.json({ repo })
})

githubRouter.get('/repos/:projectId/events', authMiddleware, async (c) => {
  const repo = await githubService.getRepoByProject(c.req.param('projectId') as string)
  if (!repo) return c.json({ error: 'No linked repo' }, 404)
  const events = await githubService.listRepoEvents(repo.id)
  return c.json({ events })
})

export { githubRouter }
