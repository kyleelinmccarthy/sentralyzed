import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockUpdate = vi.fn()
const mockFindMany = vi.fn()
const mockFindFirst = vi.fn()

const mockActivityLog = vi.fn().mockResolvedValue({ id: 'activity-1' })

vi.mock('../services/activities.service.js', () => ({
  activitiesService: {
    log: mockActivityLog,
  },
}))

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
    query: {
      entityAssignments: {
        findMany: mockFindMany,
        findFirst: mockFindFirst,
      },
    },
  },
}))

const { AssignmentsService } = await import('../services/assignments.service.js')

describe('AssignmentsService', () => {
  let service: InstanceType<typeof AssignmentsService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AssignmentsService()
  })

  describe('assign', () => {
    it('inserts an assignment and returns it', async () => {
      const assignment = {
        id: 'assign-1',
        entityType: 'task',
        entityId: 'task-1',
        userId: 'user-2',
        role: 'assignee',
        assignedBy: 'user-1',
        createdAt: new Date(),
      }
      const returning = vi.fn().mockResolvedValue([assignment])
      const values = vi
        .fn()
        .mockReturnValue({ onConflictDoNothing: vi.fn().mockReturnValue({ returning }) })
      mockInsert.mockReturnValue({ values })

      const result = await service.assign({
        entityType: 'task',
        entityId: 'task-1',
        userId: 'user-2',
        role: 'assignee',
        assignedBy: 'user-1',
      })

      expect(result).toEqual(assignment)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('returns null when duplicate assignment exists', async () => {
      const returning = vi.fn().mockResolvedValue([])
      const values = vi
        .fn()
        .mockReturnValue({ onConflictDoNothing: vi.fn().mockReturnValue({ returning }) })
      mockInsert.mockReturnValue({ values })

      const result = await service.assign({
        entityType: 'task',
        entityId: 'task-1',
        userId: 'user-2',
        assignedBy: 'user-1',
      })

      expect(result).toBeNull()
    })
  })

  describe('findByEntity', () => {
    it('returns assignments for an entity', async () => {
      const assignments = [
        {
          id: 'assign-1',
          entityType: 'task',
          entityId: 'task-1',
          userId: 'user-2',
          role: 'assignee',
        },
      ]
      mockFindMany.mockResolvedValue(assignments)

      const result = await service.findByEntity('task', 'task-1')

      expect(result).toEqual(assignments)
      expect(mockFindMany).toHaveBeenCalled()
    })
  })

  describe('findByUser', () => {
    it('returns all assignments for a user', async () => {
      const assignments = [
        { id: 'assign-1', entityType: 'task', entityId: 'task-1', userId: 'user-2' },
        { id: 'assign-2', entityType: 'project', entityId: 'proj-1', userId: 'user-2' },
      ]
      mockFindMany.mockResolvedValue(assignments)

      const result = await service.findByUser('user-2')

      expect(result).toEqual(assignments)
      expect(mockFindMany).toHaveBeenCalled()
    })
  })

  describe('updateRole', () => {
    const existingAssignment = {
      id: 'assign-1',
      entityType: 'task',
      entityId: 'task-1',
      userId: 'user-2',
      role: 'assignee',
      assignedBy: 'user-1',
    }

    it('updates the role and logs notification', async () => {
      mockFindFirst.mockResolvedValue(existingAssignment)
      const updated = { ...existingAssignment, role: 'reviewer' }
      const returning = vi.fn().mockResolvedValue([updated])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.updateRole('assign-1', 'reviewer', 'actor-1')

      expect(result).toEqual(updated)
      expect(mockActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'actor-1',
          action: 'updated',
          entityType: 'task',
          entityId: 'task-1',
          metadata: expect.objectContaining({ change: 'role_updated', role: 'reviewer' }),
          notifyUserIds: ['user-2'],
        }),
      )
    })

    it('returns undefined when assignment not found', async () => {
      mockFindFirst.mockResolvedValue(undefined)
      const returning = vi.fn().mockResolvedValue([])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.updateRole('nonexistent', 'reviewer', 'actor-1')

      expect(result).toBeUndefined()
      expect(mockActivityLog).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    const existingAssignment = {
      id: 'assign-1',
      entityType: 'task',
      entityId: 'task-1',
      userId: 'user-2',
      assignedBy: 'user-1',
    }

    it('deletes the assignment and logs notification', async () => {
      mockFindFirst.mockResolvedValue(existingAssignment)
      const where = vi.fn().mockResolvedValue(undefined)
      mockDelete.mockReturnValue({ where })

      const result = await service.remove('assign-1', 'actor-1')

      expect(result).toBe(true)
      expect(mockDelete).toHaveBeenCalled()
      expect(mockActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'actor-1',
          action: 'deleted',
          entityType: 'task',
          entityId: 'task-1',
          metadata: expect.objectContaining({ change: 'unassigned' }),
          notifyUserIds: ['user-2'],
        }),
      )
    })

    it('returns false when assignment does not exist', async () => {
      mockFindFirst.mockResolvedValue(undefined)

      const result = await service.remove('nonexistent', 'actor-1')

      expect(result).toBe(false)
      expect(mockDelete).not.toHaveBeenCalled()
      expect(mockActivityLog).not.toHaveBeenCalled()
    })
  })
})
