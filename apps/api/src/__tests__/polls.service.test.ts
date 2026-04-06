import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database module before importing the service
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockUpdate = vi.fn()
const mockPollsFindMany = vi.fn()
const mockPollsFindFirst = vi.fn()
const mockPollOptionsFindMany = vi.fn()
const mockPollVotesFindMany = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    query: {
      polls: {
        findMany: mockPollsFindMany,
        findFirst: mockPollsFindFirst,
      },
      pollOptions: {
        findMany: mockPollOptionsFindMany,
      },
      pollVotes: {
        findMany: mockPollVotesFindMany,
      },
    },
  },
}))

// Must import after mocks
const { PollsService } = await import('../services/polls.service.js')

const ALL_CONTEXT_TYPES = [
  'channel',
  'forum',
  'project',
  'goal',
  'task',
  'client',
  'expense',
  'calendar',
  'user',
  'whiteboard',
  'feedback',
] as const

describe('PollsService', () => {
  let service: InstanceType<typeof PollsService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new PollsService()
  })

  describe('create', () => {
    it('creates a poll with options and returns enriched result', async () => {
      const poll = {
        id: 'poll-1',
        question: 'Best framework?',
        contextType: 'project',
        contextId: 'proj-1',
        createdBy: 'user-1',
        allowMultiple: false,
        isAnonymous: false,
        closedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const options = [
        { id: 'opt-1', pollId: 'poll-1', text: 'React', position: 0, createdAt: new Date() },
        { id: 'opt-2', pollId: 'poll-1', text: 'Vue', position: 1, createdAt: new Date() },
      ]

      // Mock poll insert
      const pollReturning = vi.fn().mockResolvedValue([poll])
      const pollValues = vi.fn().mockReturnValue({ returning: pollReturning })
      // Mock options insert
      const optReturning = vi.fn().mockResolvedValue(options)
      const optValues = vi.fn().mockReturnValue({ returning: optReturning })
      mockInsert
        .mockReturnValueOnce({ values: pollValues })
        .mockReturnValueOnce({ values: optValues })

      const result = await service.create(
        {
          question: 'Best framework?',
          contextType: 'project',
          contextId: 'proj-1',
          options: ['React', 'Vue'],
          allowMultiple: false,
          isAnonymous: false,
        },
        'user-1',
      )

      expect(result).toEqual({ ...poll, options, totalVotes: 0, userVotes: [] })
      expect(mockInsert).toHaveBeenCalledTimes(2)
    })

    // Test that polls can be created for ALL context types
    it.each(ALL_CONTEXT_TYPES)('creates a poll with contextType "%s"', async (contextType) => {
      const poll = {
        id: 'poll-1',
        question: 'Test question?',
        contextType,
        contextId: 'ctx-1',
        createdBy: 'user-1',
        allowMultiple: false,
        isAnonymous: false,
        closedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const options = [
        { id: 'opt-1', pollId: 'poll-1', text: 'Yes', position: 0, createdAt: new Date() },
        { id: 'opt-2', pollId: 'poll-1', text: 'No', position: 1, createdAt: new Date() },
      ]

      const pollReturning = vi.fn().mockResolvedValue([poll])
      const pollValues = vi.fn().mockReturnValue({ returning: pollReturning })
      const optReturning = vi.fn().mockResolvedValue(options)
      const optValues = vi.fn().mockReturnValue({ returning: optReturning })
      mockInsert
        .mockReturnValueOnce({ values: pollValues })
        .mockReturnValueOnce({ values: optValues })

      const result = await service.create(
        {
          question: 'Test question?',
          contextType,
          contextId: 'ctx-1',
          options: ['Yes', 'No'],
          allowMultiple: false,
          isAnonymous: false,
        },
        'user-1',
      )

      expect(result.contextType).toBe(contextType)
      expect(result.contextId).toBe('ctx-1')
    })
  })

  describe('getByContext', () => {
    it.each(ALL_CONTEXT_TYPES)(
      'fetches polls filtered by contextType "%s"',
      async (contextType) => {
        const poll = {
          id: 'poll-1',
          question: 'Test?',
          contextType,
          contextId: 'ctx-1',
          createdBy: 'user-1',
          allowMultiple: false,
          isAnonymous: false,
          closedAt: null,
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        mockPollsFindMany.mockResolvedValue([poll])
        mockPollOptionsFindMany.mockResolvedValue([
          { id: 'opt-1', pollId: 'poll-1', text: 'Yes', position: 0, createdAt: new Date() },
        ])
        mockPollVotesFindMany.mockResolvedValue([])

        const result = await service.getByContext(contextType, 'ctx-1', 'user-1')

        expect(result).toHaveLength(1)
        expect(result[0].contextType).toBe(contextType)
        expect(mockPollsFindMany).toHaveBeenCalled()
      },
    )
  })

  describe('getById', () => {
    it('returns enriched poll when found', async () => {
      const poll = {
        id: 'poll-1',
        question: 'Test?',
        contextType: 'task',
        contextId: 'task-1',
        createdBy: 'user-1',
        allowMultiple: false,
        isAnonymous: false,
        closedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPollsFindFirst.mockResolvedValue(poll)
      mockPollOptionsFindMany.mockResolvedValue([
        { id: 'opt-1', pollId: 'poll-1', text: 'Yes', position: 0, createdAt: new Date() },
      ])
      mockPollVotesFindMany.mockResolvedValue([])

      const result = await service.getById('poll-1', 'user-1')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('poll-1')
      expect(result!.options).toHaveLength(1)
      expect(result!.totalVotes).toBe(0)
    })

    it('returns null when poll not found', async () => {
      mockPollsFindFirst.mockResolvedValue(undefined)

      const result = await service.getById('nonexistent', 'user-1')

      expect(result).toBeNull()
    })
  })

  describe('vote', () => {
    const poll = {
      id: 'poll-1',
      question: 'Test?',
      contextType: 'client',
      contextId: 'client-1',
      createdBy: 'user-1',
      allowMultiple: false,
      isAnonymous: false,
      closedAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('returns error when poll not found', async () => {
      mockPollsFindFirst.mockResolvedValue(undefined)

      const result = await service.vote('nonexistent', ['opt-1'], 'user-1')

      expect(result).toEqual({ error: 'Poll not found' })
    })

    it('returns error when poll is closed', async () => {
      mockPollsFindFirst.mockResolvedValue({ ...poll, closedAt: new Date() })

      const result = await service.vote('poll-1', ['opt-1'], 'user-1')

      expect(result).toEqual({ error: 'Poll is closed' })
    })

    it('returns error when poll has expired', async () => {
      mockPollsFindFirst.mockResolvedValue({
        ...poll,
        expiresAt: new Date('2020-01-01'),
      })

      const result = await service.vote('poll-1', ['opt-1'], 'user-1')

      expect(result).toEqual({ error: 'Poll has expired' })
    })

    it('returns error when multiple options selected on single-choice poll', async () => {
      mockPollsFindFirst.mockResolvedValue(poll)
      mockPollOptionsFindMany.mockResolvedValue([
        { id: 'opt-1', pollId: 'poll-1' },
        { id: 'opt-2', pollId: 'poll-1' },
      ])

      const result = await service.vote('poll-1', ['opt-1', 'opt-2'], 'user-1')

      expect(result).toEqual({ error: 'Only one option allowed' })
    })
  })

  describe('close', () => {
    it('closes a poll when called by creator', async () => {
      const poll = {
        id: 'poll-1',
        createdBy: 'user-1',
        closedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPollsFindFirst.mockResolvedValue(poll)
      const closedPoll = { ...poll, closedAt: new Date() }
      const returning = vi.fn().mockResolvedValue([closedPoll])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })
      mockPollOptionsFindMany.mockResolvedValue([])
      mockPollVotesFindMany.mockResolvedValue([])

      const result = await service.close('poll-1', 'user-1')

      expect(result).not.toBeNull()
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('returns null for non-creator', async () => {
      mockPollsFindFirst.mockResolvedValue({
        id: 'poll-1',
        createdBy: 'user-1',
      })

      const result = await service.close('poll-1', 'other-user')

      expect(result).toBeNull()
    })

    it('returns null when poll not found', async () => {
      mockPollsFindFirst.mockResolvedValue(undefined)

      const result = await service.close('nonexistent', 'user-1')

      expect(result).toBeNull()
    })
  })

  describe('deletePoll', () => {
    it('deletes poll when called by creator', async () => {
      mockPollsFindFirst.mockResolvedValue({ id: 'poll-1', createdBy: 'user-1' })
      const where = vi.fn().mockResolvedValue([])
      mockDelete.mockReturnValue({ where })

      const result = await service.deletePoll('poll-1', 'user-1')

      expect(result).toBe(true)
      expect(mockDelete).toHaveBeenCalled()
    })

    it('returns false for non-creator', async () => {
      mockPollsFindFirst.mockResolvedValue({ id: 'poll-1', createdBy: 'user-1' })

      const result = await service.deletePoll('poll-1', 'other-user')

      expect(result).toBe(false)
    })

    it('returns false when poll not found', async () => {
      mockPollsFindFirst.mockResolvedValue(undefined)

      const result = await service.deletePoll('nonexistent', 'user-1')

      expect(result).toBe(false)
    })
  })
})
