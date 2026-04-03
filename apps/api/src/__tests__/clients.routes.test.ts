import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock auth middleware to inject a test user
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set('user', { id: 'user-1', role: 'member' })
    await next()
  }),
}))

// Mock clients service
const mockList = vi.fn()
const mockGetById = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockSoftDelete = vi.fn()
const mockAddProject = vi.fn()
const mockRemoveProject = vi.fn()
const mockGetProjects = vi.fn()

vi.mock('../services/clients.service.js', () => ({
  clientsService: {
    list: mockList,
    getById: mockGetById,
    create: mockCreate,
    update: mockUpdate,
    softDelete: mockSoftDelete,
    addProject: mockAddProject,
    removeProject: mockRemoveProject,
    getProjects: mockGetProjects,
  },
}))

const { clientsRouter } = await import('../routes/clients/index.js')

const app = new Hono()
app.route('/clients', clientsRouter)

describe('Clients Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /clients', () => {
    it('returns a list of clients', async () => {
      const clients = [{ id: 'c1', name: 'Acme Corp' }]
      mockList.mockResolvedValue(clients)

      const res = await app.request('/clients')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.clients).toEqual(clients)
    })
  })

  describe('GET /clients/:id', () => {
    it('returns a client when found', async () => {
      const client = { id: 'c1', name: 'Acme Corp' }
      mockGetById.mockResolvedValue(client)

      const res = await app.request('/clients/c1')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.client).toEqual(client)
    })

    it('returns 404 when not found', async () => {
      mockGetById.mockResolvedValue(undefined)

      const res = await app.request('/clients/nonexistent')

      expect(res.status).toBe(404)
    })
  })

  describe('POST /clients', () => {
    it('creates a client and returns 201', async () => {
      const client = { id: 'c1', name: 'Acme Corp', ownerId: 'user-1' }
      mockCreate.mockResolvedValue(client)

      const res = await app.request('/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Acme Corp' }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.client).toEqual(client)
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Acme Corp',
        ownerId: 'user-1',
      })
    })

    it('rejects missing name with 400', async () => {
      const res = await app.request('/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
    })

    it('rejects invalid email with 400', async () => {
      const res = await app.request('/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'not-an-email' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('PATCH /clients/:id', () => {
    it('updates a client', async () => {
      const client = { id: 'c1', name: 'Updated Name' }
      mockUpdate.mockResolvedValue(client)

      const res = await app.request('/clients/c1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.client).toEqual(client)
    })

    it('returns 404 when not found', async () => {
      mockUpdate.mockResolvedValue(undefined)

      const res = await app.request('/clients/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /clients/:id', () => {
    it('soft deletes a client', async () => {
      mockSoftDelete.mockResolvedValue({ id: 'c1', deletedAt: new Date() })

      const res = await app.request('/clients/c1', { method: 'DELETE' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
    })

    it('returns 404 when not found', async () => {
      mockSoftDelete.mockResolvedValue(undefined)

      const res = await app.request('/clients/nonexistent', { method: 'DELETE' })

      expect(res.status).toBe(404)
    })
  })

  describe('POST /clients/:id/projects', () => {
    it('associates a project with a client', async () => {
      const association = {
        id: 'cp1',
        clientId: 'c1',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'stakeholder',
      }
      mockAddProject.mockResolvedValue(association)

      const res = await app.request('/clients/c1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: '550e8400-e29b-41d4-a716-446655440000' }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.clientProject).toEqual(association)
    })

    it('rejects invalid projectId with 400', async () => {
      const res = await app.request('/clients/c1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'not-a-uuid' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /clients/:id/projects', () => {
    it('returns project associations', async () => {
      const associations = [{ id: 'cp1', clientId: 'c1', projectId: 'p1', role: 'stakeholder' }]
      mockGetProjects.mockResolvedValue(associations)

      const res = await app.request('/clients/c1/projects')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.clientProjects).toEqual(associations)
    })
  })

  describe('DELETE /clients/:id/projects/:projectId', () => {
    it('removes a project association', async () => {
      mockRemoveProject.mockResolvedValue(undefined)

      const res = await app.request('/clients/c1/projects/p1', { method: 'DELETE' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
    })
  })
})
