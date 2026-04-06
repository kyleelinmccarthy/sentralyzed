import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../middleware/auth.js'
import { entityLinksService, EntityNotFoundError } from '../../services/entity-links.service.js'
import {
  createEntityLinkSchema,
  sourceTypeSchema,
  targetTypeSchema,
} from '@sentralyzed/shared/validators/entity-link'
import type { AppEnv } from '../../types.js'

const entityLinksRouter = new Hono<AppEnv>()
entityLinksRouter.use('*', authMiddleware)

entityLinksRouter.post('/', zValidator('json', createEntityLinkSchema), async (c) => {
  const data = c.req.valid('json')
  const user = c.get('user')
  try {
    const link = await entityLinksService.create({ ...data, createdBy: user.id })
    return c.json({ link }, 201)
  } catch (e) {
    if (e instanceof EntityNotFoundError) {
      return c.json({ error: e.message }, 404)
    }
    throw e
  }
})

entityLinksRouter.get('/source/:sourceType/:sourceId', async (c) => {
  const sourceType = sourceTypeSchema.parse(c.req.param('sourceType'))
  const sourceId = c.req.param('sourceId')
  const links = await entityLinksService.findBySource(sourceType, sourceId)
  return c.json({ links })
})

entityLinksRouter.get('/target/:targetType/:targetId', async (c) => {
  const targetType = targetTypeSchema.parse(c.req.param('targetType'))
  const targetId = c.req.param('targetId')
  const links = await entityLinksService.findByTarget(targetType, targetId)
  return c.json({ links })
})

entityLinksRouter.delete('/:id', async (c) => {
  const user = c.get('user')
  const ok = await entityLinksService.remove(c.req.param('id'), user.id)
  if (!ok) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ ok: true })
})

export { entityLinksRouter }
