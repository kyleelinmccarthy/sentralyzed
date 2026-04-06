import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { ZodError } from 'zod'
import {
  createAssetSchema,
  updateAssetSchema,
  assetQuerySchema,
} from '@sentralyzed/shared/validators/asset'
import { authMiddleware } from '../../middleware/auth.js'
import { assetsService } from '../../services/assets.service.js'
import type { AppEnv } from '../../types.js'

const validationHook = (result: { success: boolean; error?: ZodError }, c: any) => {
  if (!result.success) {
    const messages = result.error!.issues.map((i) => i.message).join(', ')
    return c.json({ error: messages }, 400)
  }
}

const assetsRouter = new Hono<AppEnv>()

assetsRouter.use('*', authMiddleware)

// List assets
assetsRouter.get('/', zValidator('query', assetQuerySchema, validationHook), async (c) => {
  const query = c.req.valid('query')
  const assets = await assetsService.list(query)
  return c.json({ assets })
})

// Get single asset
assetsRouter.get('/:id', async (c) => {
  const asset = await assetsService.getById(c.req.param('id'))
  if (!asset) return c.json({ error: 'Asset not found' }, 404)
  return c.json({ asset })
})

// Get expenses for asset
assetsRouter.get('/:id/expenses', async (c) => {
  const expenses = await assetsService.getExpensesForAsset(c.req.param('id'))
  if (expenses === null) return c.json({ error: 'Asset not found' }, 404)
  return c.json({ expenses })
})

// Create asset
assetsRouter.post('/', zValidator('json', createAssetSchema, validationHook), async (c) => {
  const data = c.req.valid('json')
  const user = c.get('user')
  const asset = await assetsService.create(data, user.id)
  return c.json({ asset }, 201)
})

// Update asset
assetsRouter.patch('/:id', zValidator('json', updateAssetSchema, validationHook), async (c) => {
  const user = c.get('user')
  const result = await assetsService.update(
    c.req.param('id'),
    c.req.valid('json'),
    user.id,
    user.role,
  )
  if ('error' in result) return c.json({ error: result.error }, 400)
  return c.json({ asset: result })
})

// Soft delete asset
assetsRouter.delete('/:id', async (c) => {
  const user = c.get('user')
  const deleted = await assetsService.delete(c.req.param('id'), user.id, user.role)
  if (!deleted) return c.json({ error: 'Asset not found' }, 404)
  return c.json({ ok: true })
})

export { assetsRouter }
