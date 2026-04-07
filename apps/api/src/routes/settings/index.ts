import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../middleware/auth.js'
import { settingsService } from '../../services/settings.service.js'
import { updateSettingsSchema, muteEntitySchema } from '@sentral/shared/validators/settings'
import type { AppEnv } from '../../types.js'

const settingsRouter = new Hono<AppEnv>()
settingsRouter.use('*', authMiddleware)

settingsRouter.get('/', async (c) => {
  const user = c.get('user')
  const settings = await settingsService.getByUserId(user.id)
  return c.json({ settings })
})

settingsRouter.patch('/', zValidator('json', updateSettingsSchema), async (c) => {
  const user = c.get('user')
  const settings = await settingsService.update(user.id, c.req.valid('json'))
  return c.json({ settings })
})

settingsRouter.post('/mute', zValidator('json', muteEntitySchema), async (c) => {
  const user = c.get('user')
  await settingsService.muteEntity(user.id, c.req.valid('json'))
  return c.json({ ok: true })
})

settingsRouter.delete('/mute', zValidator('json', muteEntitySchema), async (c) => {
  const user = c.get('user')
  await settingsService.unmuteEntity(user.id, c.req.valid('json'))
  return c.json({ ok: true })
})

export { settingsRouter }
