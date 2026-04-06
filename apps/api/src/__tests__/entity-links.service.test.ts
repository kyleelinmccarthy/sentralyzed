import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database module before importing the service
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockFindMany = vi.fn()
const mockFindFirst = vi.fn()

// Source entity query mocks
const mockMessageFindFirst = vi.fn()
const mockForumThreadFindFirst = vi.fn()
const mockForumReplyFindFirst = vi.fn()

// Target entity query mocks
const mockProjectFindFirst = vi.fn()
const mockGoalFindFirst = vi.fn()
const mockTaskFindFirst = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    query: {
      entityLinks: {
        findMany: mockFindMany,
        findFirst: mockFindFirst,
      },
      messages: { findFirst: mockMessageFindFirst },
      forumThreads: { findFirst: mockForumThreadFindFirst },
      forumReplies: { findFirst: mockForumReplyFindFirst },
      projects: { findFirst: mockProjectFindFirst },
      goals: { findFirst: mockGoalFindFirst },
      tasks: { findFirst: mockTaskFindFirst },
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
    const validData = {
      sourceType: 'message' as const,
      sourceId: 'msg-1',
      targetType: 'task' as const,
      targetId: 'task-1',
      createdBy: 'user-1',
    }

    it('inserts a link and returns it when source and target exist', async () => {
      const link = { id: 'link-1', ...validData, createdAt: new Date() }
      mockMessageFindFirst.mockResolvedValue({ id: 'msg-1' })
      mockTaskFindFirst.mockResolvedValue({ id: 'task-1' })

      const returning = vi.fn().mockResolvedValue([link])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })

      const result = await service.create(validData)

      expect(result).toEqual(link)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('throws when source message does not exist', async () => {
      mockMessageFindFirst.mockResolvedValue(undefined)

      await expect(service.create(validData)).rejects.toThrow('Source message not found')
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('throws when source forum_thread does not exist', async () => {
      mockForumThreadFindFirst.mockResolvedValue(undefined)

      await expect(service.create({ ...validData, sourceType: 'forum_thread' })).rejects.toThrow(
        'Source forum_thread not found',
      )
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('throws when source forum_reply does not exist', async () => {
      mockForumReplyFindFirst.mockResolvedValue(undefined)

      await expect(service.create({ ...validData, sourceType: 'forum_reply' })).rejects.toThrow(
        'Source forum_reply not found',
      )
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('throws when target project does not exist', async () => {
      mockMessageFindFirst.mockResolvedValue({ id: 'msg-1' })
      mockProjectFindFirst.mockResolvedValue(undefined)

      await expect(
        service.create({ ...validData, targetType: 'project', targetId: 'proj-1' }),
      ).rejects.toThrow('Target project not found')
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('throws when target goal does not exist', async () => {
      mockMessageFindFirst.mockResolvedValue({ id: 'msg-1' })
      mockGoalFindFirst.mockResolvedValue(undefined)

      await expect(
        service.create({ ...validData, targetType: 'goal', targetId: 'goal-1' }),
      ).rejects.toThrow('Target goal not found')
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('throws when target task does not exist', async () => {
      mockMessageFindFirst.mockResolvedValue({ id: 'msg-1' })
      mockTaskFindFirst.mockResolvedValue(undefined)

      await expect(service.create(validData)).rejects.toThrow('Target task not found')
      expect(mockInsert).not.toHaveBeenCalled()
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

  describe('removeBySource', () => {
    it('deletes all links for a given source', async () => {
      const where = vi.fn().mockResolvedValue(undefined)
      mockDelete.mockReturnValue({ where })

      await service.removeBySource('message', 'msg-1')

      expect(mockDelete).toHaveBeenCalled()
    })
  })

  describe('removeByTarget', () => {
    it('deletes all links for a given target', async () => {
      const where = vi.fn().mockResolvedValue(undefined)
      mockDelete.mockReturnValue({ where })

      await service.removeByTarget('task', 'task-1')

      expect(mockDelete).toHaveBeenCalled()
    })
  })
})
