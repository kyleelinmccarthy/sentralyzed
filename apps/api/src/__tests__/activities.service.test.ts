import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock DB
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockSelect = vi.fn()
const mockNotificationsFindMany = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelect,
    query: {
      notifications: {
        findMany: mockNotificationsFindMany,
      },
    },
  },
}))

// Mock WebSocket sendToUser
const mockSendToUser = vi.fn()
vi.mock('../ws/connections.js', () => ({
  sendToUser: mockSendToUser,
}))

const { ActivitiesService } = await import('../services/activities.service.js')

describe('ActivitiesService', () => {
  let service: InstanceType<typeof ActivitiesService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ActivitiesService()
  })

  describe('log', () => {
    const baseData = {
      actorId: 'actor-1',
      action: 'created' as const,
      entityType: 'task',
      entityId: 'task-1',
      metadata: { taskTitle: 'Test Task', actorName: 'Alice' },
    }

    function setupInsertMock(returnValue: unknown) {
      const returning = vi.fn().mockResolvedValue([returnValue])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })
      return { values, returning }
    }

    it('creates an activity record', async () => {
      const activity = { id: 'activity-1', ...baseData, createdAt: new Date() }
      setupInsertMock(activity)

      const result = await service.log(baseData)

      expect(result).toEqual(activity)
      expect(mockInsert).toHaveBeenCalledTimes(1)
    })

    it('creates notifications and sends WS push for notifyUserIds', async () => {
      const activity = { id: 'activity-1', ...baseData, createdAt: new Date() }
      // First insert = activity, second insert = notifications
      const returning1 = vi.fn().mockResolvedValue([activity])
      const values1 = vi.fn().mockReturnValue({ returning: returning1 })
      const returning2 = vi.fn().mockResolvedValue([
        { id: 'notif-1', userId: 'user-2', activityId: 'activity-1', createdAt: new Date() },
        { id: 'notif-2', userId: 'user-3', activityId: 'activity-1', createdAt: new Date() },
      ])
      const values2 = vi.fn().mockReturnValue({ returning: returning2 })
      mockInsert.mockReturnValueOnce({ values: values1 }).mockReturnValueOnce({ values: values2 })

      await service.log({
        ...baseData,
        notifyUserIds: ['user-2', 'user-3'],
      })

      // Should have inserted notifications
      expect(mockInsert).toHaveBeenCalledTimes(2)
      // Should have sent WS push to both users
      expect(mockSendToUser).toHaveBeenCalledTimes(2)
      expect(mockSendToUser).toHaveBeenCalledWith('user-2', expect.any(String))
      expect(mockSendToUser).toHaveBeenCalledWith('user-3', expect.any(String))
    })

    it('excludes the actor from notifications and WS push', async () => {
      const activity = { id: 'activity-1', ...baseData, createdAt: new Date() }
      const returning1 = vi.fn().mockResolvedValue([activity])
      const values1 = vi.fn().mockReturnValue({ returning: returning1 })
      // After filtering out actor, only 1 notification
      const returning2 = vi
        .fn()
        .mockResolvedValue([
          { id: 'notif-1', userId: 'user-2', activityId: 'activity-1', createdAt: new Date() },
        ])
      const values2 = vi.fn().mockReturnValue({ returning: returning2 })
      mockInsert.mockReturnValueOnce({ values: values1 }).mockReturnValueOnce({ values: values2 })

      await service.log({
        ...baseData,
        notifyUserIds: ['actor-1', 'user-2'],
      })

      // WS push only to user-2, not actor-1
      expect(mockSendToUser).toHaveBeenCalledTimes(1)
      expect(mockSendToUser).toHaveBeenCalledWith('user-2', expect.any(String))
    })

    it('does not send WS push when no notifyUserIds provided', async () => {
      const activity = { id: 'activity-1', ...baseData, createdAt: new Date() }
      setupInsertMock(activity)

      await service.log(baseData)

      expect(mockSendToUser).not.toHaveBeenCalled()
      expect(mockInsert).toHaveBeenCalledTimes(1)
    })

    it('does not send WS push when all notifyUserIds are the actor', async () => {
      const activity = { id: 'activity-1', ...baseData, createdAt: new Date() }
      // After filtering, empty array — no notification insert
      setupInsertMock(activity)

      await service.log({
        ...baseData,
        notifyUserIds: ['actor-1'],
      })

      expect(mockSendToUser).not.toHaveBeenCalled()
      // Only the activity insert, no notification insert
      expect(mockInsert).toHaveBeenCalledTimes(1)
    })

    it('catches WS errors silently', async () => {
      const activity = { id: 'activity-1', ...baseData, createdAt: new Date() }
      const returning1 = vi.fn().mockResolvedValue([activity])
      const values1 = vi.fn().mockReturnValue({ returning: returning1 })
      const returning2 = vi
        .fn()
        .mockResolvedValue([
          { id: 'notif-1', userId: 'user-2', activityId: 'activity-1', createdAt: new Date() },
        ])
      const values2 = vi.fn().mockReturnValue({ returning: returning2 })
      mockInsert.mockReturnValueOnce({ values: values1 }).mockReturnValueOnce({ values: values2 })
      mockSendToUser.mockImplementation(() => {
        throw new Error('WS connection failed')
      })

      // Should not throw
      await expect(service.log({ ...baseData, notifyUserIds: ['user-2'] })).resolves.toBeDefined()
    })
  })

  describe('getUserNotifications', () => {
    it('returns notifications with joined activity and actor data', async () => {
      const mockNotifications = [
        {
          notification: {
            id: 'n1',
            userId: 'user-1',
            activityId: 'a1',
            readAt: null,
            createdAt: new Date(),
          },
          activity: {
            id: 'a1',
            action: 'assigned',
            entityType: 'task',
            entityId: 'task-1',
            metadata: { taskTitle: 'Test' },
            actorId: 'actor-1',
            createdAt: new Date(),
          },
          actor: { name: 'Alice' },
        },
      ]

      // Mock the select().from().leftJoin().leftJoin().where().orderBy().limit() chain
      const limit = vi.fn().mockResolvedValue(mockNotifications)
      const orderBy = vi.fn().mockReturnValue({ limit })
      const where = vi.fn().mockReturnValue({ orderBy })
      const leftJoin2 = vi.fn().mockReturnValue({ where })
      const leftJoin1 = vi.fn().mockReturnValue({ leftJoin: leftJoin2 })
      const from = vi.fn().mockReturnValue({ leftJoin: leftJoin1 })
      mockSelect.mockReturnValue({ from })

      const result = await service.getUserNotifications('user-1')

      expect(result).toEqual(mockNotifications)
      expect(mockSelect).toHaveBeenCalled()
    })
  })

  describe('markRead', () => {
    it('updates the notification readAt timestamp', async () => {
      const notification = { id: 'n1', readAt: new Date() }
      const returning = vi.fn().mockResolvedValue([notification])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.markRead('n1')

      expect(result).toEqual(notification)
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe('markAllRead', () => {
    it('marks all unread notifications as read for a user', async () => {
      const where = vi.fn().mockResolvedValue(undefined)
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      await service.markAllRead('user-1')

      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe('getUnreadCount', () => {
    it('returns count of unread notifications', async () => {
      mockNotificationsFindMany.mockResolvedValue([{}, {}, {}])

      const count = await service.getUnreadCount('user-1')

      expect(count).toBe(3)
    })
  })
})
