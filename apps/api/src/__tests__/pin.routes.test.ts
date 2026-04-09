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

const mockPinMessage = vi.fn()
const mockUnpinMessage = vi.fn()
const mockGetPinnedMessages = vi.fn()
const mockPinForumReply = vi.fn()
const mockUnpinForumReply = vi.fn()
const mockGetPinnedForumReplies = vi.fn()

vi.mock('../services/pin.service.js', () => ({
  pinService: {
    pinMessage: mockPinMessage,
    unpinMessage: mockUnpinMessage,
    getPinnedMessages: mockGetPinnedMessages,
    pinForumReply: mockPinForumReply,
    unpinForumReply: mockUnpinForumReply,
    getPinnedForumReplies: mockGetPinnedForumReplies,
  },
}))

const { pinRouter } = await import('../routes/pins/index.js')

const app = new Hono()
app.route('/pins', pinRouter)

describe('Pin Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.id = 'user-1'
    mockUser.role = 'member'
  })

  // --- Chat message pins ---

  describe('POST /pins/messages/:id', () => {
    it('pins a chat message', async () => {
      const pin = {
        id: 'pin-1',
        entityType: 'message',
        entityId: 'msg-1',
        pinnedBy: 'user-1',
        createdAt: new Date().toISOString(),
      }
      mockPinMessage.mockResolvedValue(pin)

      const res = await app.request('/pins/messages/msg-1', { method: 'POST' })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.pin).toEqual(pin)
      expect(mockPinMessage).toHaveBeenCalledWith('msg-1', 'user-1')
    })

    it('returns 404 when message does not exist or already pinned', async () => {
      mockPinMessage.mockResolvedValue(null)

      const res = await app.request('/pins/messages/msg-1', { method: 'POST' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /pins/messages/:id', () => {
    it('unpins a chat message', async () => {
      mockUnpinMessage.mockResolvedValue(true)

      const res = await app.request('/pins/messages/msg-1', { method: 'DELETE' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
      expect(mockUnpinMessage).toHaveBeenCalledWith('msg-1')
    })

    it('returns 404 when message is not pinned', async () => {
      mockUnpinMessage.mockResolvedValue(false)

      const res = await app.request('/pins/messages/msg-1', { method: 'DELETE' })

      expect(res.status).toBe(404)
    })
  })

  describe('GET /pins/channels/:id', () => {
    it('returns pinned messages for a channel', async () => {
      const pins = [
        {
          id: 'pin-1',
          entityType: 'message',
          entityId: 'msg-1',
          pinnedBy: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ]
      mockGetPinnedMessages.mockResolvedValue(pins)

      const res = await app.request('/pins/channels/ch-1', { method: 'GET' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.pins).toEqual(pins)
      expect(mockGetPinnedMessages).toHaveBeenCalledWith('ch-1')
    })

    it('returns empty array when no pinned messages', async () => {
      mockGetPinnedMessages.mockResolvedValue([])

      const res = await app.request('/pins/channels/ch-1', { method: 'GET' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.pins).toEqual([])
    })
  })

  // --- Forum reply pins ---

  describe('POST /pins/forum-replies/:id', () => {
    it('pins a forum reply', async () => {
      const pin = {
        id: 'pin-2',
        entityType: 'forum_reply',
        entityId: 'reply-1',
        pinnedBy: 'user-1',
        createdAt: new Date().toISOString(),
      }
      mockPinForumReply.mockResolvedValue(pin)

      const res = await app.request('/pins/forum-replies/reply-1', { method: 'POST' })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.pin).toEqual(pin)
      expect(mockPinForumReply).toHaveBeenCalledWith('reply-1', 'user-1')
    })

    it('returns 404 when forum reply does not exist or already pinned', async () => {
      mockPinForumReply.mockResolvedValue(null)

      const res = await app.request('/pins/forum-replies/reply-1', { method: 'POST' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /pins/forum-replies/:id', () => {
    it('unpins a forum reply', async () => {
      mockUnpinForumReply.mockResolvedValue(true)

      const res = await app.request('/pins/forum-replies/reply-1', { method: 'DELETE' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
      expect(mockUnpinForumReply).toHaveBeenCalledWith('reply-1')
    })

    it('returns 404 when reply is not pinned', async () => {
      mockUnpinForumReply.mockResolvedValue(false)

      const res = await app.request('/pins/forum-replies/reply-1', { method: 'DELETE' })

      expect(res.status).toBe(404)
    })
  })

  describe('GET /pins/threads/:id', () => {
    it('returns pinned replies for a thread', async () => {
      const pins = [
        {
          id: 'pin-2',
          entityType: 'forum_reply',
          entityId: 'reply-1',
          pinnedBy: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ]
      mockGetPinnedForumReplies.mockResolvedValue(pins)

      const res = await app.request('/pins/threads/thread-1', { method: 'GET' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.pins).toEqual(pins)
      expect(mockGetPinnedForumReplies).toHaveBeenCalledWith('thread-1')
    })

    it('returns empty array when no pinned replies', async () => {
      mockGetPinnedForumReplies.mockResolvedValue([])

      const res = await app.request('/pins/threads/thread-1', { method: 'GET' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.pins).toEqual([])
    })
  })
})
