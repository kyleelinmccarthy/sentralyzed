import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock DB
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockTasksFindFirst = vi.fn()
const mockTasksFindMany = vi.fn()
const mockCommentsFindMany = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    query: {
      tasks: { findFirst: mockTasksFindFirst, findMany: mockTasksFindMany },
      taskComments: { findMany: mockCommentsFindMany },
    },
  },
}))

// Mock activities service
const mockLog = vi.fn()
vi.mock('../services/activities.service.js', () => ({
  activitiesService: { log: mockLog },
}))

const { TasksService } = await import('../services/tasks.service.js')

describe('TasksService', () => {
  let service: InstanceType<typeof TasksService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new TasksService()
  })

  function setupInsertMock(returnValue: unknown) {
    const returning = vi.fn().mockResolvedValue([returnValue])
    const values = vi.fn().mockReturnValue({ returning })
    mockInsert.mockReturnValue({ values })
  }

  function setupUpdateMock(returnValue: unknown) {
    const returning = vi.fn().mockResolvedValue([returnValue])
    const where = vi.fn().mockReturnValue({ returning })
    const set = vi.fn().mockReturnValue({ where })
    mockUpdate.mockReturnValue({ set })
  }

  describe('create', () => {
    const baseData = {
      title: 'Test Task',
      projectId: 'project-1',
      reporterId: 'reporter-1',
      actorName: 'Alice',
    }

    it('notifies assignee when assigneeId is set and differs from reporter', async () => {
      const task = { id: 'task-1', ...baseData, assigneeId: 'assignee-1' }
      setupInsertMock(task)

      await service.create({ ...baseData, assigneeId: 'assignee-1' })

      expect(mockLog).toHaveBeenCalledWith({
        actorId: 'reporter-1',
        action: 'created',
        entityType: 'task',
        entityId: 'task-1',
        metadata: { taskTitle: 'Test Task', actorName: 'Alice' },
        notifyUserIds: ['assignee-1'],
      })
    })

    it('does not notify when no assigneeId', async () => {
      const task = { id: 'task-1', ...baseData }
      setupInsertMock(task)

      await service.create(baseData)

      expect(mockLog).not.toHaveBeenCalled()
    })

    it('does not notify when assigneeId equals reporterId', async () => {
      const task = { id: 'task-1', ...baseData, assigneeId: 'reporter-1' }
      setupInsertMock(task)

      await service.create({ ...baseData, assigneeId: 'reporter-1' })

      expect(mockLog).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    const existingTask = {
      id: 'task-1',
      title: 'Test Task',
      assigneeId: 'old-assignee',
      reporterId: 'reporter-1',
      status: 'todo',
      projectId: 'project-1',
    }

    it('notifies new and old assignee on reassignment', async () => {
      mockTasksFindFirst.mockResolvedValue(existingTask)
      const updatedTask = { ...existingTask, assigneeId: 'new-assignee' }
      setupUpdateMock(updatedTask)

      await service.update('task-1', { assigneeId: 'new-assignee' }, 'actor-1', 'Bob')

      // Should log 'assigned' for new assignee
      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'assigned',
          notifyUserIds: ['new-assignee'],
          metadata: expect.objectContaining({ newAssigneeId: 'new-assignee' }),
        }),
      )
      // Should log 'updated' with unassigned for old assignee
      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'updated',
          notifyUserIds: ['old-assignee'],
          metadata: expect.objectContaining({ change: 'unassigned' }),
        }),
      )
    })

    it('notifies reporter and assignee on completion', async () => {
      mockTasksFindFirst.mockResolvedValue(existingTask)
      const updatedTask = { ...existingTask, status: 'done' }
      setupUpdateMock(updatedTask)

      await service.update('task-1', { status: 'done' }, 'actor-1', 'Bob')

      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'completed',
          notifyUserIds: expect.arrayContaining(['old-assignee', 'reporter-1']),
        }),
      )
    })

    it('does not duplicate notify when actor is assignee or reporter', async () => {
      mockTasksFindFirst.mockResolvedValue({
        ...existingTask,
        assigneeId: 'actor-1',
        reporterId: 'actor-1',
      })
      const updatedTask = {
        ...existingTask,
        status: 'done',
        assigneeId: 'actor-1',
        reporterId: 'actor-1',
      }
      setupUpdateMock(updatedTask)

      await service.update('task-1', { status: 'done' }, 'actor-1', 'Bob')

      // notifyUserIds should be empty after actor exclusion (handled by activitiesService.log)
      // but we still log the activity
      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'completed',
          notifyUserIds: ['actor-1'],
        }),
      )
    })

    it('notifies assignee on general update (non-reassignment, non-completion)', async () => {
      mockTasksFindFirst.mockResolvedValue(existingTask)
      const updatedTask = { ...existingTask, priority: 'high' }
      setupUpdateMock(updatedTask)

      await service.update('task-1', { priority: 'high' }, 'actor-1', 'Bob')

      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'updated',
          notifyUserIds: ['old-assignee'],
        }),
      )
    })

    it('does not notify on general update when actor is the assignee', async () => {
      mockTasksFindFirst.mockResolvedValue({ ...existingTask, assigneeId: 'actor-1' })
      const updatedTask = { ...existingTask, assigneeId: 'actor-1', priority: 'high' }
      setupUpdateMock(updatedTask)

      await service.update('task-1', { priority: 'high' }, 'actor-1', 'Bob')

      expect(mockLog).not.toHaveBeenCalled()
    })
  })

  describe('addComment', () => {
    it('notifies assignee and reporter, excluding the author', async () => {
      const task = {
        id: 'task-1',
        title: 'Test Task',
        assigneeId: 'assignee-1',
        reporterId: 'reporter-1',
      }
      mockTasksFindFirst.mockResolvedValue(task)
      const comment = {
        id: 'comment-1',
        taskId: 'task-1',
        authorId: 'commenter-1',
        content: 'Hello',
      }
      setupInsertMock(comment)

      await service.addComment('task-1', 'commenter-1', 'Hello', 'Carol')

      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'commenter-1',
          action: 'commented',
          entityType: 'task',
          entityId: 'task-1',
          notifyUserIds: expect.arrayContaining(['assignee-1', 'reporter-1']),
        }),
      )
    })

    it('does not duplicate when assignee is also reporter', async () => {
      const task = {
        id: 'task-1',
        title: 'Test Task',
        assigneeId: 'same-user',
        reporterId: 'same-user',
      }
      mockTasksFindFirst.mockResolvedValue(task)
      const comment = {
        id: 'comment-1',
        taskId: 'task-1',
        authorId: 'commenter-1',
        content: 'Hello',
      }
      setupInsertMock(comment)

      await service.addComment('task-1', 'commenter-1', 'Hello', 'Carol')

      const logCall = mockLog.mock.calls[0]![0]
      // Should only have unique user IDs
      const uniqueIds = [...new Set(logCall.notifyUserIds)]
      expect(logCall.notifyUserIds).toEqual(uniqueIds)
    })
  })

  describe('softDelete', () => {
    it('notifies assignee when task is deleted', async () => {
      const task = {
        id: 'task-1',
        title: 'Test Task',
        assigneeId: 'assignee-1',
        reporterId: 'reporter-1',
      }
      mockTasksFindFirst.mockResolvedValue(task)
      const deletedTask = { ...task, deletedAt: new Date() }
      setupUpdateMock(deletedTask)

      await service.softDelete('task-1', 'actor-1', 'Bob')

      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'actor-1',
          action: 'deleted',
          entityType: 'task',
          entityId: 'task-1',
          notifyUserIds: ['assignee-1'],
        }),
      )
    })

    it('does not notify when no assignee', async () => {
      const task = {
        id: 'task-1',
        title: 'Test Task',
        assigneeId: null,
        reporterId: 'reporter-1',
      }
      mockTasksFindFirst.mockResolvedValue(task)
      const deletedTask = { ...task, deletedAt: new Date() }
      setupUpdateMock(deletedTask)

      await service.softDelete('task-1', 'actor-1', 'Bob')

      expect(mockLog).not.toHaveBeenCalled()
    })
  })
})
