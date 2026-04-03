import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { Context, Next } from 'hono'

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: Context, next: Next) => {
    c.set('user', { id: 'user-1', role: 'member' })
    await next()
  }),
}))

const mockAssign = vi.fn()
const mockFindByEntity = vi.fn()
const mockFindByUser = vi.fn()
const mockUpdateRole = vi.fn()
const mockRemove = vi.fn()

vi.mock('../services/assignments.service.js', () => ({
  assignmentsService: {
    assign: mockAssign,
    findByEntity: mockFindByEntity,
    findByUser: mockFindByUser,
    updateRole: mockUpdateRole,
    remove: mockRemove,
  },
}))

const { assignmentsRouter } = await import('../routes/assignments/index.js')

const app = new Hono()
app.route('/assignments', assignmentsRouter)

describe('Assignments Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /assignments', () => {
    it('creates an assignment and returns 201', async () => {
      const assignment = {
        id: 'assign-1',
        entityType: 'task',
        entityId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        role: 'assignee',
        assignedBy: 'user-1',
        createdAt: new Date().toISOString(),
      }
      mockAssign.mockResolvedValue(assignment)

      const res = await app.request('/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'task',
          entityId: '550e8400-e29b-41d4-a716-446655440001',
          userId: '550e8400-e29b-41d4-a716-446655440002',
          role: 'assignee',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.assignment).toEqual(assignment)
      expect(mockAssign).toHaveBeenCalledWith({
        entityType: 'task',
        entityId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        role: 'assignee',
        assignedBy: 'user-1',
      })
    })

    it('returns 409 when assignment already exists', async () => {
      mockAssign.mockResolvedValue(null)

      const res = await app.request('/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'task',
          entityId: '550e8400-e29b-41d4-a716-446655440001',
          userId: '550e8400-e29b-41d4-a716-446655440002',
        }),
      })

      expect(res.status).toBe(409)
    })

    it('rejects invalid entityType with 400', async () => {
      const res = await app.request('/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'invalid',
          entityId: '550e8400-e29b-41d4-a716-446655440001',
          userId: '550e8400-e29b-41d4-a716-446655440002',
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /assignments/entity/:entityType/:entityId', () => {
    it('returns assignments for an entity', async () => {
      const assignments = [{ id: 'assign-1', userId: 'user-2', role: 'assignee' }]
      mockFindByEntity.mockResolvedValue(assignments)

      const res = await app.request('/assignments/entity/task/550e8400-e29b-41d4-a716-446655440001')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.assignments).toEqual(assignments)
    })
  })

  describe('GET /assignments/user/:userId', () => {
    it('returns assignments for a user', async () => {
      const assignments = [
        { id: 'assign-1', entityType: 'task', entityId: 'task-1' },
        { id: 'assign-2', entityType: 'project', entityId: 'proj-1' },
      ]
      mockFindByUser.mockResolvedValue(assignments)

      const res = await app.request('/assignments/user/550e8400-e29b-41d4-a716-446655440001')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.assignments).toEqual(assignments)
    })
  })

  describe('PATCH /assignments/:id', () => {
    it('updates the role and returns 200', async () => {
      const updated = { id: 'assign-1', role: 'reviewer' }
      mockUpdateRole.mockResolvedValue(updated)

      const res = await app.request('/assignments/550e8400-e29b-41d4-a716-446655440001', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reviewer' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.assignment).toEqual(updated)
    })

    it('returns 404 when assignment not found', async () => {
      mockUpdateRole.mockResolvedValue(undefined)

      const res = await app.request('/assignments/550e8400-e29b-41d4-a716-446655440001', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reviewer' }),
      })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /assignments/:id', () => {
    it('deletes an assignment and returns ok', async () => {
      mockRemove.mockResolvedValue(true)

      const res = await app.request('/assignments/550e8400-e29b-41d4-a716-446655440001', {
        method: 'DELETE',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
    })

    it('returns 404 when assignment not found', async () => {
      mockRemove.mockResolvedValue(false)

      const res = await app.request('/assignments/550e8400-e29b-41d4-a716-446655440001', {
        method: 'DELETE',
      })

      expect(res.status).toBe(404)
    })
  })
})
