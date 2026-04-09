import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { Context, Next } from 'hono'

// Mock auth middleware — default user is a member
const mockUser = { id: 'user-1', role: 'member' }
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: Context, next: Next) => {
    c.set('user', { ...mockUser })
    await next()
  }),
  requireRole:
    (...roles: string[]) =>
    async (c: Context, next: Next) => {
      const user = c.get('user')
      if (!user) return c.json({ error: 'Unauthorized' }, 401)
      if (!roles.includes(user.role)) return c.json({ error: 'Forbidden' }, 403)
      await next()
    },
}))

// Mock feedback service
const mockCreate = vi.fn()
const mockGetById = vi.fn()
const mockList = vi.fn()
const mockUpdate = vi.fn()
const mockUpdateStatus = vi.fn()
const mockAddResponse = vi.fn()
const mockGetWithResponses = vi.fn()
const mockSoftDelete = vi.fn()

vi.mock('../services/feedback.service.js', () => ({
  feedbackService: {
    create: mockCreate,
    getById: mockGetById,
    list: mockList,
    update: mockUpdate,
    updateStatus: mockUpdateStatus,
    addResponse: mockAddResponse,
    getWithResponses: mockGetWithResponses,
    softDelete: mockSoftDelete,
  },
}))

const { feedbackRouter } = await import('../routes/feedback/index.js')

const app = new Hono()
app.route('/feedback', feedbackRouter)

const validFeedbackBody = {
  title: 'Login is slow',
  description: 'Takes 5 seconds to load the login page',
  category: 'bug',
  priority: 'high',
}

describe('Feedback Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.id = 'user-1'
    mockUser.role = 'member'
  })

  // --- CRUD ---

  describe('POST /feedback', () => {
    it('creates feedback and returns 201', async () => {
      const fb = { id: 'fb-1', ...validFeedbackBody, status: 'open' }
      mockCreate.mockResolvedValue(fb)

      const res = await app.request('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validFeedbackBody),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.feedback).toEqual(fb)
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining(validFeedbackBody), 'user-1')
    })

    it('rejects missing title with 400', async () => {
      const res = await app.request('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Some feedback', category: 'bug' }),
      })

      expect(res.status).toBe(400)
    })

    it('rejects invalid category with 400', async () => {
      const res = await app.request('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validFeedbackBody, category: 'invalid_cat' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /feedback', () => {
    it('returns feedback list', async () => {
      const items = [{ id: 'fb-1' }, { id: 'fb-2' }]
      mockList.mockResolvedValue(items)

      const res = await app.request('/feedback')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.feedback).toEqual(items)
    })
  })

  describe('GET /feedback/:id', () => {
    it('returns feedback with responses', async () => {
      const fb = { id: 'fb-1', title: 'Test', responses: [] }
      mockGetWithResponses.mockResolvedValue(fb)

      const res = await app.request('/feedback/fb-1')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.feedback).toEqual(fb)
    })

    it('returns 404 when not found', async () => {
      mockGetWithResponses.mockResolvedValue(null)

      const res = await app.request('/feedback/nonexistent')

      expect(res.status).toBe(404)
    })
  })

  // --- Edit (submitter only) ---

  describe('PATCH /feedback/:id', () => {
    it('updates feedback fields', async () => {
      const updated = {
        id: 'fb-1',
        title: 'Updated title',
        description: 'New desc',
        category: 'feature_request',
        priority: 'low',
      }
      mockUpdate.mockResolvedValue(updated)

      const res = await app.request('/feedback/fb-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated title',
          description: 'New desc',
          category: 'feature_request',
          priority: 'low',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.feedback).toEqual(updated)
      expect(mockUpdate).toHaveBeenCalledWith(
        'fb-1',
        expect.objectContaining({ title: 'Updated title' }),
        'user-1',
      )
    })

    it('returns 400 when service returns error', async () => {
      mockUpdate.mockResolvedValue({ error: 'Unauthorized' })

      const res = await app.request('/feedback/fb-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New title' }),
      })

      expect(res.status).toBe(400)
    })

    it('rejects invalid category', async () => {
      const res = await app.request('/feedback/fb-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'not_a_category' }),
      })

      expect(res.status).toBe(400)
    })
  })

  // --- Status Update (admin/manager only) ---

  describe('PATCH /feedback/:id/status', () => {
    it('updates status as manager', async () => {
      mockUser.role = 'manager'
      const updated = { id: 'fb-1', status: 'in_review' }
      mockUpdateStatus.mockResolvedValue(updated)

      const res = await app.request('/feedback/fb-1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_review' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.feedback).toEqual(updated)
    })

    it('updates status as admin with notes', async () => {
      mockUser.role = 'admin'
      const updated = { id: 'fb-1', status: 'resolved', adminNotes: 'Fixed in v2.1' }
      mockUpdateStatus.mockResolvedValue(updated)

      const res = await app.request('/feedback/fb-1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', adminNotes: 'Fixed in v2.1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.feedback).toEqual(updated)
    })

    it('returns 403 for member', async () => {
      mockUser.role = 'member'

      const res = await app.request('/feedback/fb-1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_review' }),
      })

      expect(res.status).toBe(403)
    })

    it('returns 400 when service returns error', async () => {
      mockUser.role = 'admin'
      mockUpdateStatus.mockResolvedValue({ error: 'Feedback not found' })

      const res = await app.request('/feedback/fb-1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_review' }),
      })

      expect(res.status).toBe(400)
    })
  })

  // --- Responses (admin/manager only) ---

  describe('POST /feedback/:id/responses', () => {
    it('adds a response as admin', async () => {
      mockUser.role = 'admin'
      const response = { id: 'resp-1', feedbackId: 'fb-1', message: 'Looking into it' }
      mockAddResponse.mockResolvedValue(response)

      const res = await app.request('/feedback/fb-1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Looking into it' }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.response).toEqual(response)
    })

    it('returns 403 for member', async () => {
      mockUser.role = 'member'

      const res = await app.request('/feedback/fb-1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Looking into it' }),
      })

      expect(res.status).toBe(403)
    })

    it('returns 400 when feedback not found', async () => {
      mockUser.role = 'admin'
      mockAddResponse.mockResolvedValue({ error: 'Feedback not found' })

      const res = await app.request('/feedback/nonexistent/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      })

      expect(res.status).toBe(400)
    })
  })

  // --- Delete ---

  describe('DELETE /feedback/:id', () => {
    it('deletes feedback', async () => {
      mockSoftDelete.mockResolvedValue(true)

      const res = await app.request('/feedback/fb-1', { method: 'DELETE' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
    })

    it('returns 404 when not found or unauthorized', async () => {
      mockSoftDelete.mockResolvedValue(false)

      const res = await app.request('/feedback/fb-1', { method: 'DELETE' })

      expect(res.status).toBe(404)
    })
  })
})
