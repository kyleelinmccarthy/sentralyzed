import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database module before importing the service
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockFindMany = vi.fn()
const mockFindFirst = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    query: {
      entityLinks: {
        findMany: mockFindMany,
        findFirst: mockFindFirst,
      },
    },
  },
}))

// Must import after mocks
const { EntityLinksService } = await import('../services/entity-links.service.js')

describe('EntityLinksService', () => {
  let service: InstanceType<typeof EntityLinksService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new EntityLinksService()
  })

  describe('create', () => {
    it('inserts a link and returns it', async () => {
      const link = {
        id: 'link-1',
        sourceType: 'message',
        sourceId: 'msg-1',
        targetType: 'task',
        targetId: 'task-1',
        createdBy: 'user-1',
        createdAt: new Date(),
      }
      const returning = vi.fn().mockResolvedValue([link])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })

      const result = await service.create({
        sourceType: 'message',
        sourceId: 'msg-1',
        targetType: 'task',
        targetId: 'task-1',
        createdBy: 'user-1',
      })

      expect(result).toEqual(link)
      expect(mockInsert).toHaveBeenCalled()
      expect(values).toHaveBeenCalledWith({
        sourceType: 'message',
        sourceId: 'msg-1',
        targetType: 'task',
        targetId: 'task-1',
        createdBy: 'user-1',
      })
    })
  })

  describe('findBySource', () => {
    it('returns links for a given source', async () => {
      const links = [
        {
          id: 'link-1',
          sourceType: 'message',
          sourceId: 'msg-1',
          targetType: 'task',
          targetId: 'task-1',
        },
      ]
      mockFindMany.mockResolvedValue(links)

      const result = await service.findBySource('message', 'msg-1')

      expect(result).toEqual(links)
      expect(mockFindMany).toHaveBeenCalled()
    })
  })

  describe('findByTarget', () => {
    it('returns links for a given target', async () => {
      const links = [
        {
          id: 'link-2',
          sourceType: 'forum_thread',
          sourceId: 'thread-1',
          targetType: 'project',
          targetId: 'proj-1',
        },
      ]
      mockFindMany.mockResolvedValue(links)

      const result = await service.findByTarget('project', 'proj-1')

      expect(result).toEqual(links)
      expect(mockFindMany).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('deletes the link when it exists and user is the creator', async () => {
      const link = { id: 'link-1', createdBy: 'user-1' }
      mockFindFirst.mockResolvedValue(link)
      const where = vi.fn().mockResolvedValue(undefined)
      mockDelete.mockReturnValue({ where })

      const result = await service.remove('link-1', 'user-1')

      expect(result).toBe(true)
      expect(mockDelete).toHaveBeenCalled()
    })

    it('returns false when the link does not exist', async () => {
      mockFindFirst.mockResolvedValue(undefined)

      const result = await service.remove('nonexistent', 'user-1')

      expect(result).toBe(false)
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('returns false when user is not the creator', async () => {
      const link = { id: 'link-1', createdBy: 'other-user' }
      mockFindFirst.mockResolvedValue(link)

      const result = await service.remove('link-1', 'user-1')

      expect(result).toBe(false)
      expect(mockDelete).not.toHaveBeenCalled()
    })
  })
})
