import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTasksFindMany = vi.fn()
const mockGoalsFindMany = vi.fn()
const mockFeedbackFindMany = vi.fn()
const mockAssignmentsFindByUser = vi.fn()
const mockSelect = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    query: {
      tasks: {
        findMany: (...args: unknown[]) => mockTasksFindMany(...args),
      },
      goals: {
        findMany: (...args: unknown[]) => mockGoalsFindMany(...args),
      },
      feedback: {
        findMany: (...args: unknown[]) => mockFeedbackFindMany(...args),
      },
    },
  },
}))

vi.mock('../services/assignments.service.js', () => ({
  assignmentsService: {
    findByUser: (...args: unknown[]) => mockAssignmentsFindByUser(...args),
  },
}))

const { DashboardService } = await import('../services/dashboard.service.js')

// Helper to set up mockSelect to handle the different select chains
function setupMockSelect(overrides?: {
  taskAssignments?: { entityId: string }[]
  goalAssignments?: { entityId: string }[]
  eventRows?: unknown[]
  chatMemberRows?: unknown[]
  chatUnreadCounts?: { count: number }[]
}) {
  const defaults = {
    taskAssignments: [] as { entityId: string }[],
    goalAssignments: [] as { entityId: string }[],
    eventRows: [] as unknown[],
    chatMemberRows: [] as unknown[],
    chatUnreadCounts: [] as { count: number }[],
  }
  const opts = { ...defaults, ...overrides }
  let selectCallIndex = 0

  mockSelect.mockImplementation(() => {
    const callIdx = selectCallIndex++

    // Calls 0 & 1: entity assignment queries (tasks, goals)
    if (callIdx === 0) {
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(opts.taskAssignments),
        }),
      }
    }
    if (callIdx === 1) {
      // Events select chain
      return {
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(opts.eventRows),
            }),
          }),
        }),
      }
    }
    if (callIdx === 2) {
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(opts.goalAssignments),
        }),
      }
    }
    if (callIdx === 3) {
      // Chat channel members query
      return {
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(opts.chatMemberRows),
          }),
        }),
      }
    }
    // Chat unread count queries (one per channel)
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([opts.chatUnreadCounts[callIdx - 4] ?? { count: 0 }]),
      }),
    }
  })
}

describe('DashboardService', () => {
  let service: InstanceType<typeof DashboardService>
  const userId = 'user-1'
  const from = new Date('2026-04-01')
  const to = new Date('2026-04-15')

  beforeEach(() => {
    vi.clearAllMocks()
    service = new DashboardService()
  })

  describe('getMyItems', () => {
    it('returns tasks assigned to user via assigneeId', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Fix bug',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2026-04-10',
          projectId: 'proj-1',
        },
      ]
      mockTasksFindMany.mockResolvedValue(mockTasks)
      mockGoalsFindMany.mockResolvedValue([])
      mockFeedbackFindMany.mockResolvedValue([])
      mockAssignmentsFindByUser.mockResolvedValue([])
      setupMockSelect()

      const result = await service.getMyItems(userId, from, to)

      expect(result.tasks).toEqual(mockTasks)
      expect(mockTasksFindMany).toHaveBeenCalled()
    })

    it('includes tasks assigned via entity assignments (owner role)', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Owned task',
          status: 'todo',
          priority: 'medium',
          dueDate: null,
          projectId: 'proj-1',
        },
      ]
      mockTasksFindMany.mockResolvedValue(mockTasks)
      mockGoalsFindMany.mockResolvedValue([])
      mockFeedbackFindMany.mockResolvedValue([])
      mockAssignmentsFindByUser.mockResolvedValue([
        {
          id: 'assign-1',
          entityType: 'task',
          entityId: 'task-1',
          role: 'owner',
          createdAt: new Date(),
        },
      ])
      setupMockSelect({ taskAssignments: [{ entityId: 'task-1' }] })

      const result = await service.getMyItems(userId, from, to)

      expect(result.tasks).toEqual(mockTasks)
    })

    it('returns events where user is attendee excluding declined', async () => {
      const mockEvents = [
        {
          events: {
            id: 'event-1',
            title: 'Sprint planning',
            startTime: new Date('2026-04-07T10:00:00Z'),
            endTime: new Date('2026-04-07T11:00:00Z'),
            allDay: false,
          },
          event_attendees: { status: 'accepted' },
        },
      ]
      mockTasksFindMany.mockResolvedValue([])
      mockGoalsFindMany.mockResolvedValue([])
      mockFeedbackFindMany.mockResolvedValue([])
      mockAssignmentsFindByUser.mockResolvedValue([])
      setupMockSelect({ eventRows: mockEvents })

      const result = await service.getMyItems(userId, from, to)

      expect(result.events).toEqual([
        {
          id: 'event-1',
          title: 'Sprint planning',
          startTime: new Date('2026-04-07T10:00:00Z').toISOString(),
          endTime: new Date('2026-04-07T11:00:00Z').toISOString(),
          allDay: false,
          rsvpStatus: 'accepted',
        },
      ])
    })

    it('returns goals owned by or assigned to user', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          title: 'Q2 targets',
          status: 'in_progress',
          progressPercentage: 40,
          targetDate: '2026-06-30',
          level: 'team',
        },
      ]
      mockTasksFindMany.mockResolvedValue([])
      mockGoalsFindMany.mockResolvedValue(mockGoals)
      mockFeedbackFindMany.mockResolvedValue([])
      mockAssignmentsFindByUser.mockResolvedValue([])
      setupMockSelect()

      const result = await service.getMyItems(userId, from, to)

      expect(result.goals).toEqual(mockGoals)
    })

    it('returns feedback submitted or assigned for review', async () => {
      const mockFeedback = [
        { id: 'fb-1', title: 'Login issue', category: 'bug', priority: 'high', status: 'open' },
      ]
      mockTasksFindMany.mockResolvedValue([])
      mockGoalsFindMany.mockResolvedValue([])
      mockFeedbackFindMany.mockResolvedValue(mockFeedback)
      mockAssignmentsFindByUser.mockResolvedValue([])
      setupMockSelect()

      const result = await service.getMyItems(userId, from, to)

      expect(result.feedbackItems).toEqual(mockFeedback)
    })

    it('returns chat notifications with unread counts', async () => {
      mockTasksFindMany.mockResolvedValue([])
      mockGoalsFindMany.mockResolvedValue([])
      mockFeedbackFindMany.mockResolvedValue([])
      mockAssignmentsFindByUser.mockResolvedValue([])
      setupMockSelect({
        chatMemberRows: [
          { channelId: 'ch-1', channelName: 'general', lastReadAt: new Date('2026-04-01') },
        ],
        chatUnreadCounts: [{ count: 5 }],
      })

      const result = await service.getMyItems(userId, from, to)

      expect(result.chatNotifications).toEqual([
        { channelId: 'ch-1', channelName: 'general', unreadCount: 5 },
      ])
    })

    it('filters out channels with zero unread messages', async () => {
      mockTasksFindMany.mockResolvedValue([])
      mockGoalsFindMany.mockResolvedValue([])
      mockFeedbackFindMany.mockResolvedValue([])
      mockAssignmentsFindByUser.mockResolvedValue([])
      setupMockSelect({
        chatMemberRows: [{ channelId: 'ch-1', channelName: 'general', lastReadAt: new Date() }],
        chatUnreadCounts: [{ count: 0 }],
      })

      const result = await service.getMyItems(userId, from, to)

      expect(result.chatNotifications).toEqual([])
    })

    it('returns empty arrays when user has no items', async () => {
      mockTasksFindMany.mockResolvedValue([])
      mockGoalsFindMany.mockResolvedValue([])
      mockFeedbackFindMany.mockResolvedValue([])
      setupMockSelect()

      const result = await service.getMyItems(userId, from, to)

      expect(result.tasks).toEqual([])
      expect(result.events).toEqual([])
      expect(result.goals).toEqual([])
      expect(result.feedbackItems).toEqual([])
      expect(result.chatNotifications).toEqual([])
    })
  })
})
