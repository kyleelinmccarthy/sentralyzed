import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database module before importing the service
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockFeedbackFindMany = vi.fn()
const mockFeedbackFindFirst = vi.fn()
const mockFeedbackResponsesFindMany = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    query: {
      feedback: {
        findMany: mockFeedbackFindMany,
        findFirst: mockFeedbackFindFirst,
      },
      feedbackResponses: {
        findMany: mockFeedbackResponsesFindMany,
      },
    },
  },
}))

// Must import after mocks
const { FeedbackService } = await import('../services/feedback.service.js')

describe('FeedbackService', () => {
  let service: InstanceType<typeof FeedbackService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new FeedbackService()
  })

  describe('create', () => {
    it('inserts feedback with status open and submittedBy set', async () => {
      const fb = {
        id: 'fb-1',
        title: 'Login is slow',
        description: 'Takes 5 seconds to load',
        category: 'bug',
        priority: 'high',
        status: 'open',
        submittedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const returning = vi.fn().mockResolvedValue([fb])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })

      const result = await service.create(
        {
          title: 'Login is slow',
          description: 'Takes 5 seconds to load',
          category: 'bug',
          priority: 'high',
        },
        'user-1',
      )

      expect(result).toEqual(fb)
      expect(mockInsert).toHaveBeenCalled()
      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Login is slow',
          description: 'Takes 5 seconds to load',
          category: 'bug',
          priority: 'high',
          submittedBy: 'user-1',
          status: 'open',
        }),
      )
    })
  })

  describe('getById', () => {
    const fb = {
      id: 'fb-1',
      submittedBy: 'user-1',
      status: 'open',
      deletedAt: null,
    }

    it('returns feedback for the owner', async () => {
      mockFeedbackFindFirst.mockResolvedValue(fb)

      const result = await service.getById('fb-1', 'user-1', 'member')

      expect(result).toEqual(fb)
    })

    it('returns feedback for admin regardless of ownership', async () => {
      mockFeedbackFindFirst.mockResolvedValue(fb)

      const result = await service.getById('fb-1', 'other-user', 'admin')

      expect(result).toEqual(fb)
    })

    it('returns feedback for manager regardless of ownership', async () => {
      mockFeedbackFindFirst.mockResolvedValue(fb)

      const result = await service.getById('fb-1', 'other-user', 'manager')

      expect(result).toEqual(fb)
    })

    it('returns null for non-owner member', async () => {
      mockFeedbackFindFirst.mockResolvedValue(fb)

      const result = await service.getById('fb-1', 'other-user', 'member')

      expect(result).toBeNull()
    })

    it('returns null when feedback not found', async () => {
      mockFeedbackFindFirst.mockResolvedValue(undefined)

      const result = await service.getById('nonexistent', 'user-1', 'admin')

      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('returns paginated feedback', async () => {
      const items = [{ id: 'fb-1' }, { id: 'fb-2' }]
      mockFeedbackFindMany.mockResolvedValue(items)

      const result = await service.list({ page: 1, limit: 25 }, 'user-1', 'admin')

      expect(result).toEqual(items)
      expect(mockFeedbackFindMany).toHaveBeenCalled()
    })

    it('filters by member — only returns own feedback', async () => {
      const ownItems = [{ id: 'fb-1', submittedBy: 'user-1' }]
      mockFeedbackFindMany.mockResolvedValue(ownItems)

      const result = await service.list({ page: 1, limit: 25 }, 'user-1', 'member')

      expect(result).toEqual(ownItems)
      expect(mockFeedbackFindMany).toHaveBeenCalled()
    })
  })

  describe('updateStatus', () => {
    it('updates status and sets reviewer info', async () => {
      const fb = { id: 'fb-1', status: 'open', deletedAt: null }
      mockFeedbackFindFirst.mockResolvedValue(fb)
      const updated = { ...fb, status: 'in_review', reviewedBy: 'admin-1', reviewedAt: new Date() }
      const returning = vi.fn().mockResolvedValue([updated])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.updateStatus('fb-1', { status: 'in_review' }, 'admin-1')

      expect(result).toEqual(updated)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('updates status with admin notes', async () => {
      const fb = { id: 'fb-1', status: 'in_review', deletedAt: null }
      mockFeedbackFindFirst.mockResolvedValue(fb)
      const updated = {
        ...fb,
        status: 'resolved',
        reviewedBy: 'admin-1',
        reviewedAt: new Date(),
        adminNotes: 'Fixed in v2.1',
      }
      const returning = vi.fn().mockResolvedValue([updated])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.updateStatus(
        'fb-1',
        { status: 'resolved', adminNotes: 'Fixed in v2.1' },
        'admin-1',
      )

      expect(result).toEqual(updated)
    })

    it('returns error when feedback not found', async () => {
      mockFeedbackFindFirst.mockResolvedValue(undefined)

      const result = await service.updateStatus('nonexistent', { status: 'in_review' }, 'admin-1')

      expect(result).toEqual({ error: 'Feedback not found' })
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('addResponse', () => {
    it('creates a response linked to feedback', async () => {
      const fb = { id: 'fb-1', status: 'open', deletedAt: null }
      mockFeedbackFindFirst.mockResolvedValue(fb)

      const response = {
        id: 'resp-1',
        feedbackId: 'fb-1',
        respondedBy: 'admin-1',
        message: 'We are looking into this.',
        createdAt: new Date(),
      }
      const returning = vi.fn().mockResolvedValue([response])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })

      const result = await service.addResponse('fb-1', 'We are looking into this.', 'admin-1')

      expect(result).toEqual(response)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('returns error when feedback not found', async () => {
      mockFeedbackFindFirst.mockResolvedValue(undefined)

      const result = await service.addResponse('nonexistent', 'Hello', 'admin-1')

      expect(result).toEqual({ error: 'Feedback not found' })
    })
  })

  describe('getWithResponses', () => {
    it('returns feedback with nested responses', async () => {
      const fb = { id: 'fb-1', submittedBy: 'user-1', status: 'open', deletedAt: null }
      mockFeedbackFindFirst.mockResolvedValue(fb)
      const responses = [
        { id: 'resp-1', feedbackId: 'fb-1', message: 'Noted', respondedBy: 'admin-1' },
      ]
      mockFeedbackResponsesFindMany.mockResolvedValue(responses)

      const result = await service.getWithResponses('fb-1', 'user-1', 'member')

      expect(result).toEqual({ ...fb, responses })
    })

    it('returns null when feedback not found', async () => {
      mockFeedbackFindFirst.mockResolvedValue(undefined)

      const result = await service.getWithResponses('nonexistent', 'user-1', 'admin')

      expect(result).toBeNull()
    })

    it('returns null for non-owner member', async () => {
      const fb = { id: 'fb-1', submittedBy: 'user-1', status: 'open', deletedAt: null }
      mockFeedbackFindFirst.mockResolvedValue(fb)

      const result = await service.getWithResponses('fb-1', 'other-user', 'member')

      expect(result).toBeNull()
    })
  })

  describe('softDelete', () => {
    it('soft-deletes own feedback', async () => {
      const fb = { id: 'fb-1', submittedBy: 'user-1', deletedAt: null }
      mockFeedbackFindFirst.mockResolvedValue(fb)
      const returning = vi.fn().mockResolvedValue([{ ...fb, deletedAt: new Date() }])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.softDelete('fb-1', 'user-1', 'member')

      expect(result).toBe(true)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('admin can delete any feedback', async () => {
      const fb = { id: 'fb-1', submittedBy: 'other-user', deletedAt: null }
      mockFeedbackFindFirst.mockResolvedValue(fb)
      const returning = vi.fn().mockResolvedValue([{ ...fb, deletedAt: new Date() }])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.softDelete('fb-1', 'admin-1', 'admin')

      expect(result).toBe(true)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('returns false for non-owner member', async () => {
      const fb = { id: 'fb-1', submittedBy: 'other-user', deletedAt: null }
      mockFeedbackFindFirst.mockResolvedValue(fb)

      const result = await service.softDelete('fb-1', 'user-1', 'member')

      expect(result).toBe(false)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('returns false when feedback not found', async () => {
      mockFeedbackFindFirst.mockResolvedValue(undefined)

      const result = await service.softDelete('nonexistent', 'user-1', 'admin')

      expect(result).toBe(false)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })
})
