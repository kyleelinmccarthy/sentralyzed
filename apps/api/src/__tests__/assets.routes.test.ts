import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { Context, Next } from 'hono'

// Mock auth middleware to inject a test user
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: Context, next: Next) => {
    c.set('user', { id: 'user-1', role: 'admin' })
    await next()
  }),
}))

// Mock assets service
const mockCreate = vi.fn()
const mockGetById = vi.fn()
const mockList = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockGetExpensesForAsset = vi.fn()

vi.mock('../services/assets.service.js', () => ({
  assetsService: {
    create: mockCreate,
    getById: mockGetById,
    list: mockList,
    update: mockUpdate,
    delete: mockDelete,
    getExpensesForAsset: mockGetExpensesForAsset,
  },
}))

const { assetsRouter } = await import('../routes/assets/index.js')

const app = new Hono()
app.route('/assets', assetsRouter)

describe('Assets Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /assets', () => {
    it('creates an asset and returns 201', async () => {
      const asset = { id: 'a1', name: 'MacBook Pro', category: 'laptop', createdBy: 'user-1' }
      mockCreate.mockResolvedValue(asset)

      const res = await app.request('/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'MacBook Pro', category: 'laptop' }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.asset).toEqual(asset)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'MacBook Pro', category: 'laptop' }),
        'user-1',
      )
    })

    it('rejects missing name with 400', async () => {
      const res = await app.request('/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'laptop' }),
      })

      expect(res.status).toBe(400)
    })

    it('rejects invalid category with 400', async () => {
      const res = await app.request('/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', category: 'invalid_category' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /assets', () => {
    it('returns a list of assets', async () => {
      const assets = [{ id: 'a1', name: 'MacBook' }]
      mockList.mockResolvedValue(assets)

      const res = await app.request('/assets')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.assets).toEqual(assets)
    })
  })

  describe('GET /assets/:id', () => {
    it('returns an asset when found', async () => {
      const asset = { id: 'a1', name: 'MacBook' }
      mockGetById.mockResolvedValue(asset)

      const res = await app.request('/assets/a1')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.asset).toEqual(asset)
    })

    it('returns 404 when not found', async () => {
      mockGetById.mockResolvedValue(null)

      const res = await app.request('/assets/nonexistent')

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /assets/:id', () => {
    it('updates an asset', async () => {
      const asset = { id: 'a1', name: 'Updated MacBook' }
      mockUpdate.mockResolvedValue(asset)

      const res = await app.request('/assets/a1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated MacBook' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.asset).toEqual(asset)
    })

    it('returns 400 when update returns error', async () => {
      mockUpdate.mockResolvedValue({ error: 'Asset not found' })

      const res = await app.request('/assets/a1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /assets/:id/expenses', () => {
    it('returns expenses linked to an asset', async () => {
      const expenses = [
        { id: 'exp-1', assetId: 'a1', amountCents: 150000 },
        { id: 'exp-2', assetId: 'a1', amountCents: 5000 },
      ]
      mockGetExpensesForAsset.mockResolvedValue(expenses)

      const res = await app.request('/assets/a1/expenses')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.expenses).toEqual(expenses)
      expect(mockGetExpensesForAsset).toHaveBeenCalledWith('a1')
    })

    it('returns 404 when asset not found', async () => {
      mockGetExpensesForAsset.mockResolvedValue(null)

      const res = await app.request('/assets/nonexistent/expenses')

      expect(res.status).toBe(404)
    })

    it('returns empty array when asset has no expenses', async () => {
      mockGetExpensesForAsset.mockResolvedValue([])

      const res = await app.request('/assets/a1/expenses')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.expenses).toEqual([])
    })
  })

  describe('DELETE /assets/:id', () => {
    it('soft-deletes an asset', async () => {
      mockDelete.mockResolvedValue(true)

      const res = await app.request('/assets/a1', { method: 'DELETE' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
    })

    it('returns 404 when not found', async () => {
      mockDelete.mockResolvedValue(false)

      const res = await app.request('/assets/nonexistent', { method: 'DELETE' })

      expect(res.status).toBe(404)
    })
  })
})
