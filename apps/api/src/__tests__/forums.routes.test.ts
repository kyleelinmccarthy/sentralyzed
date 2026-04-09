import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { Context, Next } from 'hono'

const mockUser = { id: 'user-1', role: 'admin' }
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: Context, next: Next) => {
    c.set('user', { ...mockUser })
    await next()
  }),
  requireRole:
    (...roles: string[]) =>
    async (c: Context, next: Next) => {
      const user = c.get('user')
      if (!roles.includes(user.role)) return c.json({ error: 'Forbidden' }, 403)
      await next()
    },
}))

const mockListCategories = vi.fn()
const mockCreateCategory = vi.fn()
const mockUpdateCategory = vi.fn()
const mockDeleteCategory = vi.fn()
const mockListThreads = vi.fn()
const mockGetThread = vi.fn()
const mockCreateThread = vi.fn()
const mockUpdateThread = vi.fn()
const mockDeleteThread = vi.fn()
const mockListReplies = vi.fn()
const mockCreateReply = vi.fn()
const mockUpdateReply = vi.fn()
const mockDeleteReply = vi.fn()
const mockToggleReaction = vi.fn()
const mockSearch = vi.fn()

vi.mock('../services/forums.service.js', () => ({
  forumsService: {
    listCategories: mockListCategories,
    createCategory: mockCreateCategory,
    updateCategory: mockUpdateCategory,
    deleteCategory: mockDeleteCategory,
    listThreads: mockListThreads,
    getThread: mockGetThread,
    createThread: mockCreateThread,
    updateThread: mockUpdateThread,
    deleteThread: mockDeleteThread,
    listReplies: mockListReplies,
    createReply: mockCreateReply,
    updateReply: mockUpdateReply,
    deleteReply: mockDeleteReply,
    toggleReaction: mockToggleReaction,
    search: mockSearch,
  },
}))

const { forumsRouter } = await import('../routes/forums/index.js')

const app = new Hono()
app.route('/forums', forumsRouter)

describe('Forums Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.id = 'user-1'
    mockUser.role = 'admin'
  })

  describe('PATCH /forums/replies/:id', () => {
    it('updates a reply', async () => {
      const updated = { id: 'reply-1', content: 'Updated content', threadId: 't-1' }
      mockUpdateReply.mockResolvedValue(updated)

      const res = await app.request('/forums/replies/reply-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.reply).toEqual(updated)
      expect(mockUpdateReply).toHaveBeenCalledWith('reply-1', 'user-1', {
        content: 'Updated content',
      })
    })

    it('returns 404 when reply not found or not author', async () => {
      mockUpdateReply.mockResolvedValue(null)

      const res = await app.request('/forums/replies/reply-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' }),
      })

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /forums/categories/:id', () => {
    it('updates a category as admin', async () => {
      const updated = { id: 'cat-1', name: 'New Name', color: '#FF0000' }
      mockUpdateCategory.mockResolvedValue(updated)

      const res = await app.request('/forums/categories/cat-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name', color: '#FF0000' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.category).toEqual(updated)
    })

    it('returns 403 for non-admin', async () => {
      mockUser.role = 'member'

      const res = await app.request('/forums/categories/cat-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      })

      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /forums/threads/:id', () => {
    it('updates a thread', async () => {
      const updated = { id: 't-1', title: 'New Title', content: 'New body' }
      mockUpdateThread.mockResolvedValue(updated)

      const res = await app.request('/forums/threads/t-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title', content: 'New body' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.thread).toEqual(updated)
    })
  })
})
