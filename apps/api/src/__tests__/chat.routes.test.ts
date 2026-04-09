import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { Context, Next } from 'hono'

const mockUser = { id: 'user-1', role: 'member' }
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

const mockListChannels = vi.fn()
const mockCreateChannel = vi.fn()
const mockUpdateChannel = vi.fn()
const mockGetMessages = vi.fn()
const mockEditMessage = vi.fn()
const mockDeleteMessage = vi.fn()
const mockToggleReaction = vi.fn()
const mockMarkRead = vi.fn()
const mockAddMember = vi.fn()
const mockGetMembers = vi.fn()
const mockGetOrCreateDM = vi.fn()

vi.mock('../services/chat.service.js', () => ({
  chatService: {
    listChannels: mockListChannels,
    createChannel: mockCreateChannel,
    updateChannel: mockUpdateChannel,
    getMessages: mockGetMessages,
    editMessage: mockEditMessage,
    deleteMessage: mockDeleteMessage,
    toggleReaction: mockToggleReaction,
    markRead: mockMarkRead,
    addMember: mockAddMember,
    getMembers: mockGetMembers,
    getOrCreateDM: mockGetOrCreateDM,
  },
}))

// Mock db for /users endpoint
vi.mock('../db/index.js', () => ({
  db: {
    query: {
      users: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  },
}))

vi.mock('../db/schema/users.js', () => ({
  users: { id: 'id', isActive: 'is_active', name: 'name' },
}))

const { chatRouter } = await import('../routes/chat/index.js')

const app = new Hono()
app.route('/chat', chatRouter)

describe('Chat Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.id = 'user-1'
    mockUser.role = 'member'
  })

  describe('PATCH /chat/channels/:id', () => {
    it('updates a channel name', async () => {
      const updated = { id: 'ch-1', name: 'Renamed Channel', type: 'public' }
      mockUpdateChannel.mockResolvedValue(updated)

      const res = await app.request('/chat/channels/ch-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Renamed Channel' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.channel).toEqual(updated)
      expect(mockUpdateChannel).toHaveBeenCalledWith('ch-1', { name: 'Renamed Channel' })
    })

    it('returns 404 when channel not found or is DM', async () => {
      mockUpdateChannel.mockResolvedValue(null)

      const res = await app.request('/chat/channels/ch-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Renamed' }),
      })

      expect(res.status).toBe(404)
    })

    it('rejects empty name', async () => {
      const res = await app.request('/chat/channels/ch-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('PATCH /chat/messages/:id', () => {
    it('edits a message', async () => {
      const updated = { id: 'msg-1', content: 'Edited text', editedAt: new Date().toISOString() }
      mockEditMessage.mockResolvedValue(updated)

      const res = await app.request('/chat/messages/msg-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Edited text' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.message).toEqual(updated)
      expect(mockEditMessage).toHaveBeenCalledWith('msg-1', 'user-1', 'Edited text')
    })

    it('returns 404 when message not found or not author', async () => {
      mockEditMessage.mockResolvedValue(null)

      const res = await app.request('/chat/messages/msg-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Edited text' }),
      })

      expect(res.status).toBe(404)
    })

    it('rejects empty content', async () => {
      const res = await app.request('/chat/messages/msg-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      })

      expect(res.status).toBe(400)
    })
  })
})
