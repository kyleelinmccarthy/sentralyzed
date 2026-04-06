import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

const mockUser = { id: 'user-1', role: 'member' }
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set('user', { ...mockUser })
    await next()
  }),
}))

const mockGetMyItems = vi.fn()
vi.mock('../services/dashboard.service.js', () => ({
  dashboardService: {
    getMyItems: mockGetMyItems,
  },
}))

const { dashboardRouter } = await import('../routes/dashboard/index.js')

const app = new Hono()
app.route('/dashboard', dashboardRouter)

describe('Dashboard Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /dashboard/my-items', () => {
    it('returns 200 with items', async () => {
      const items = {
        tasks: [
          {
            id: 'task-1',
            title: 'Fix bug',
            status: 'todo',
            priority: 'high',
            dueDate: '2026-04-10',
            projectId: 'proj-1',
          },
        ],
        events: [
          {
            id: 'event-1',
            title: 'Standup',
            startTime: '2026-04-07T10:00:00Z',
            endTime: '2026-04-07T10:30:00Z',
            allDay: false,
            rsvpStatus: 'accepted',
          },
        ],
        goals: [
          {
            id: 'goal-1',
            title: 'Q2 targets',
            status: 'in_progress',
            progressPercentage: 40,
            targetDate: '2026-06-30',
            level: 'team',
          },
        ],
        feedbackItems: [
          { id: 'fb-1', title: 'Login issue', category: 'bug', priority: 'high', status: 'open' },
        ],
        chatNotifications: [{ channelId: 'ch-1', channelName: 'general', unreadCount: 3 }],
        assignments: [
          {
            id: 'assign-1',
            entityType: 'project',
            entityId: 'proj-1',
            role: 'owner',
            createdAt: '2026-04-01T00:00:00Z',
          },
        ],
      }
      mockGetMyItems.mockResolvedValue(items)

      const res = await app.request('/dashboard/my-items')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.items).toEqual(items)
      expect(mockGetMyItems).toHaveBeenCalledWith('user-1', expect.any(Date), expect.any(Date))
    })

    it('uses default date range when no params provided', async () => {
      mockGetMyItems.mockResolvedValue({
        tasks: [],
        events: [],
        goals: [],
        feedbackItems: [],
        chatNotifications: [],
        assignments: [],
      })

      await app.request('/dashboard/my-items')

      const [, from, to] = mockGetMyItems.mock.calls[0]
      expect(from).toBeInstanceOf(Date)
      expect(to).toBeInstanceOf(Date)
      // Default "to" should be ~14 days from "from"
      const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeCloseTo(14, 0)
    })

    it('passes from/to query params to service', async () => {
      mockGetMyItems.mockResolvedValue({
        tasks: [],
        events: [],
        goals: [],
        feedbackItems: [],
        chatNotifications: [],
        assignments: [],
      })

      const res = await app.request(
        '/dashboard/my-items?from=2026-04-01T00:00:00Z&to=2026-04-30T00:00:00Z',
      )
      expect(res.status).toBe(200)

      const [, from, to] = mockGetMyItems.mock.calls[0]
      expect(from.toISOString()).toBe('2026-04-01T00:00:00.000Z')
      expect(to.toISOString()).toBe('2026-04-30T00:00:00.000Z')
    })

    it('returns empty items when user has none', async () => {
      mockGetMyItems.mockResolvedValue({
        tasks: [],
        events: [],
        goals: [],
        feedbackItems: [],
        chatNotifications: [],
        assignments: [],
      })

      const res = await app.request('/dashboard/my-items')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.items.tasks).toEqual([])
      expect(body.items.events).toEqual([])
      expect(body.items.assignments).toEqual([])
    })
  })
})
