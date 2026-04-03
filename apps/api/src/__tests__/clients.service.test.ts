import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database module before importing the service
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockFindMany = vi.fn()
const mockFindFirst = vi.fn()
const mockClientProjectsFindMany = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    query: {
      clients: {
        findMany: mockFindMany,
        findFirst: mockFindFirst,
      },
      clientProjects: {
        findMany: mockClientProjectsFindMany,
      },
    },
  },
}))

// Must import after mocks
const { ClientsService } = await import('../services/clients.service.js')

describe('ClientsService', () => {
  let service: InstanceType<typeof ClientsService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ClientsService()
  })

  describe('list', () => {
    it('returns all non-deleted clients', async () => {
      const clientsList = [
        { id: 'c1', name: 'Acme Corp', status: 'active', deletedAt: null },
        { id: 'c2', name: 'Globex', status: 'lead', deletedAt: null },
      ]
      mockFindMany.mockResolvedValue(clientsList)

      const result = await service.list()

      expect(result).toEqual(clientsList)
      expect(mockFindMany).toHaveBeenCalled()
    })

    it('filters by status when provided', async () => {
      mockFindMany.mockResolvedValue([])

      await service.list({ status: 'active' })

      expect(mockFindMany).toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('returns a client when found', async () => {
      const client = { id: 'c1', name: 'Acme Corp', deletedAt: null }
      mockFindFirst.mockResolvedValue(client)

      const result = await service.getById('c1')

      expect(result).toEqual(client)
      expect(mockFindFirst).toHaveBeenCalled()
    })

    it('returns undefined when not found', async () => {
      mockFindFirst.mockResolvedValue(undefined)

      const result = await service.getById('nonexistent')

      expect(result).toBeUndefined()
    })
  })

  describe('create', () => {
    it('inserts a client and returns it', async () => {
      const client = {
        id: 'c1',
        name: 'Acme Corp',
        email: 'contact@acme.com',
        ownerId: 'user-1',
        status: 'lead',
      }
      const returning = vi.fn().mockResolvedValue([client])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })

      const result = await service.create({
        name: 'Acme Corp',
        email: 'contact@acme.com',
        ownerId: 'user-1',
      })

      expect(result).toEqual(client)
      expect(mockInsert).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('updates and returns the client', async () => {
      const updated = { id: 'c1', name: 'Acme Corp Updated' }
      const returning = vi.fn().mockResolvedValue([updated])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.update('c1', { name: 'Acme Corp Updated' })

      expect(result).toEqual(updated)
    })

    it('returns undefined when client not found', async () => {
      const returning = vi.fn().mockResolvedValue([])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.update('nonexistent', { name: 'Test' })

      expect(result).toBeUndefined()
    })
  })

  describe('softDelete', () => {
    it('sets deletedAt and returns the client', async () => {
      const deleted = { id: 'c1', deletedAt: new Date() }
      const returning = vi.fn().mockResolvedValue([deleted])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.softDelete('c1')

      expect(result).toEqual(deleted)
    })

    it('returns undefined when client not found', async () => {
      const returning = vi.fn().mockResolvedValue([])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.softDelete('nonexistent')

      expect(result).toBeUndefined()
    })
  })

  describe('addProject', () => {
    it('inserts a client-project association and returns it', async () => {
      const association = { id: 'cp1', clientId: 'c1', projectId: 'p1', role: 'stakeholder' }
      const returning = vi.fn().mockResolvedValue([association])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })

      const result = await service.addProject('c1', 'p1', 'stakeholder')

      expect(result).toEqual(association)
      expect(mockInsert).toHaveBeenCalled()
    })
  })

  describe('removeProject', () => {
    it('deletes the association', async () => {
      const where = vi.fn().mockResolvedValue(undefined)
      mockDelete.mockReturnValue({ where })

      await service.removeProject('c1', 'p1')

      expect(mockDelete).toHaveBeenCalled()
    })
  })

  describe('getProjects', () => {
    it('returns project associations for a client', async () => {
      const associations = [{ id: 'cp1', clientId: 'c1', projectId: 'p1', role: 'stakeholder' }]
      mockClientProjectsFindMany.mockResolvedValue(associations)

      const result = await service.getProjects('c1')

      expect(result).toEqual(associations)
      expect(mockClientProjectsFindMany).toHaveBeenCalled()
    })
  })
})
