import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock auth middleware to inject a test user
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set('user', { id: 'user-1', role: 'member' })
    await next()
  }),
}))

// Mock entity-links service
const mockCreate = vi.fn()
const mockFindBySource = vi.fn()
const mockFindByTarget = vi.fn()
const mockRemove = vi.fn()

class EntityNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EntityNotFoundError'
  }
}

vi.mock('../services/entity-links.service.js', () => ({
  entityLinksService: {
    create: mockCreate,
    findBySource: mockFindBySource,
    findByTarget: mockFindByTarget,
    remove: mockRemove,
  },
  EntityNotFoundError,
}))

const { entityLinksRouter } = await import('../routes/entity-links/index.js')

const app = new Hono()
app.route('/entity-links', entityLinksRouter)

describe('Entity Links Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /entity-links', () => {
    it('creates a link and returns 201', async () => {
      const link = {
        id: 'link-1',
        sourceType: 'message',
        sourceId: '550e8400-e29b-41d4-a716-446655440001',
        targetType: 'task',
        targetId: '550e8400-e29b-41d4-a716-446655440002',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
      }
      mockCreate.mockResolvedValue(link)

      const res = await app.request('/entity-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'message',
          sourceId: '550e8400-e29b-41d4-a716-446655440001',
          targetType: 'task',
          targetId: '550e8400-e29b-41d4-a716-446655440002',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.link).toEqual(link)
      expect(mockCreate).toHaveBeenCalledWith({
        sourceType: 'message',
        sourceId: '550e8400-e29b-41d4-a716-446655440001',
        targetType: 'task',
        targetId: '550e8400-e29b-41d4-a716-446655440002',
        createdBy: 'user-1',
      })
    })

    it('returns 404 when source entity does not exist', async () => {
      mockCreate.mockRejectedValue(new EntityNotFoundError('Source message not found'))

      const res = await app.request('/entity-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'message',
          sourceId: '550e8400-e29b-41d4-a716-446655440001',
          targetType: 'task',
          targetId: '550e8400-e29b-41d4-a716-446655440002',
        }),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('Source message not found')
    })

    it('returns 404 when target entity does not exist', async () => {
      mockCreate.mockRejectedValue(new EntityNotFoundError('Target task not found'))

      const res = await app.request('/entity-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'message',
          sourceId: '550e8400-e29b-41d4-a716-446655440001',
          targetType: 'task',
          targetId: '550e8400-e29b-41d4-a716-446655440002',
        }),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('Target task not found')
    })

    it('rejects invalid sourceType with 400', async () => {
      const res = await app.request('/entity-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'invalid',
          sourceId: '550e8400-e29b-41d4-a716-446655440001',
          targetType: 'task',
          targetId: '550e8400-e29b-41d4-a716-446655440002',
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /entity-links/source/:sourceType/:sourceId', () => {
    it('returns links for a source', async () => {
      const links = [{ id: 'link-1', targetType: 'task', targetId: 'task-1' }]
      mockFindBySource.mockResolvedValue(links)

      const res = await app.request(
        '/entity-links/source/message/550e8400-e29b-41d4-a716-446655440001',
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.links).toEqual(links)
    })
  })

  describe('GET /entity-links/target/:targetType/:targetId', () => {
    it('returns links for a target', async () => {
      const links = [{ id: 'link-2', sourceType: 'forum_thread', sourceId: 'thread-1' }]
      mockFindByTarget.mockResolvedValue(links)

      const res = await app.request(
        '/entity-links/target/project/550e8400-e29b-41d4-a716-446655440001',
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.links).toEqual(links)
    })
  })

  describe('DELETE /entity-links/:id', () => {
    it('deletes a link and returns ok', async () => {
      mockRemove.mockResolvedValue(true)

      const res = await app.request('/entity-links/550e8400-e29b-41d4-a716-446655440001', {
        method: 'DELETE',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
    })

    it('returns 404 when link not found or unauthorized', async () => {
      mockRemove.mockResolvedValue(false)

      const res = await app.request('/entity-links/550e8400-e29b-41d4-a716-446655440001', {
        method: 'DELETE',
      })

      expect(res.status).toBe(404)
    })
  })
})
