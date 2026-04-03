import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the db module before imports
vi.mock('../db/index.js', () => {
  const mockDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    delete: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    query: {
      pinnedMessages: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      messages: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      forumReplies: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  }
  return { db: mockDb }
})

import { PinService } from '../services/pin.service.js'
import { db } from '../db/index.js'

describe('PinService', () => {
  let pinService: PinService

  beforeEach(() => {
    pinService = new PinService()
    vi.clearAllMocks()
  })

  describe('pinMessage', () => {
    it('pins a chat message and returns the pin record', async () => {
      const messageId = '550e8400-e29b-41d4-a716-446655440001'
      const userId = '550e8400-e29b-41d4-a716-446655440002'
      const channelId = '550e8400-e29b-41d4-a716-446655440003'

      vi.mocked(db.query.messages.findFirst).mockResolvedValue({
        id: messageId,
        channelId,
        authorId: userId,
        content: 'Test message',
        replyToId: null,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(db.query.pinnedMessages.findFirst).mockResolvedValue(undefined)

      const pinRecord = {
        id: '550e8400-e29b-41d4-a716-446655440010',
        entityType: 'message',
        entityId: messageId,
        pinnedBy: userId,
        createdAt: new Date(),
      }
      const mockReturning = vi.fn().mockResolvedValue([pinRecord])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never)

      const result = await pinService.pinMessage(messageId, userId)

      expect(db.query.messages.findFirst).toHaveBeenCalled()
      expect(db.query.pinnedMessages.findFirst).toHaveBeenCalled()
      expect(db.insert).toHaveBeenCalled()
      expect(result).toEqual(pinRecord)
    })

    it('returns null if message does not exist', async () => {
      vi.mocked(db.query.messages.findFirst).mockResolvedValue(undefined)

      const result = await pinService.pinMessage('nonexistent-id', 'user-id')
      expect(result).toBeNull()
    })

    it('returns null if message is already pinned', async () => {
      const messageId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(db.query.messages.findFirst).mockResolvedValue({
        id: messageId,
        channelId: 'chan-id',
        authorId: 'user-id',
        content: 'Test',
        replyToId: null,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(db.query.pinnedMessages.findFirst).mockResolvedValue({
        id: 'existing-pin',
        entityType: 'message',
        entityId: messageId,
        pinnedBy: 'user-id',
        createdAt: new Date(),
      })

      const result = await pinService.pinMessage(messageId, 'user-id')
      expect(result).toBeNull()
    })
  })

  describe('unpinMessage', () => {
    it('unpins a chat message and returns true', async () => {
      vi.mocked(db.query.pinnedMessages.findFirst).mockResolvedValue({
        id: 'pin-id',
        entityType: 'message',
        entityId: 'msg-id',
        pinnedBy: 'user-id',
        createdAt: new Date(),
      })

      const mockWhere = vi.fn().mockResolvedValue(undefined)
      vi.mocked(db.delete).mockReturnValue({ where: mockWhere } as never)

      const result = await pinService.unpinMessage('msg-id')
      expect(result).toBe(true)
      expect(db.delete).toHaveBeenCalled()
    })

    it('returns false if message is not pinned', async () => {
      vi.mocked(db.query.pinnedMessages.findFirst).mockResolvedValue(undefined)

      const result = await pinService.unpinMessage('msg-id')
      expect(result).toBe(false)
    })
  })

  describe('pinForumReply', () => {
    it('pins a forum reply and returns the pin record', async () => {
      const replyId = '550e8400-e29b-41d4-a716-446655440005'
      const userId = '550e8400-e29b-41d4-a716-446655440002'

      vi.mocked(db.query.forumReplies.findFirst).mockResolvedValue({
        id: replyId,
        threadId: 'thread-id',
        authorId: 'author-id',
        content: 'Reply content',
        replyToId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(db.query.pinnedMessages.findFirst).mockResolvedValue(undefined)

      const pinRecord = {
        id: 'pin-id',
        entityType: 'forum_reply',
        entityId: replyId,
        pinnedBy: userId,
        createdAt: new Date(),
      }
      const mockReturning = vi.fn().mockResolvedValue([pinRecord])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never)

      const result = await pinService.pinForumReply(replyId, userId)

      expect(db.query.forumReplies.findFirst).toHaveBeenCalled()
      expect(db.insert).toHaveBeenCalled()
      expect(result).toEqual(pinRecord)
    })

    it('returns null if forum reply does not exist', async () => {
      vi.mocked(db.query.forumReplies.findFirst).mockResolvedValue(undefined)

      const result = await pinService.pinForumReply('nonexistent', 'user-id')
      expect(result).toBeNull()
    })
  })

  describe('unpinForumReply', () => {
    it('unpins a forum reply and returns true', async () => {
      vi.mocked(db.query.pinnedMessages.findFirst).mockResolvedValue({
        id: 'pin-id',
        entityType: 'forum_reply',
        entityId: 'reply-id',
        pinnedBy: 'user-id',
        createdAt: new Date(),
      })

      const mockWhere = vi.fn().mockResolvedValue(undefined)
      vi.mocked(db.delete).mockReturnValue({ where: mockWhere } as never)

      const result = await pinService.unpinForumReply('reply-id')
      expect(result).toBe(true)
    })

    it('returns false if reply is not pinned', async () => {
      vi.mocked(db.query.pinnedMessages.findFirst).mockResolvedValue(undefined)

      const result = await pinService.unpinForumReply('reply-id')
      expect(result).toBe(false)
    })
  })

  describe('getPinnedMessages', () => {
    it('returns pinned messages for a channel', async () => {
      vi.mocked(db.query.messages.findMany).mockResolvedValue([{ id: 'msg-1' }] as never)

      const pins = [
        {
          id: 'pin-1',
          entityType: 'message',
          entityId: 'msg-1',
          pinnedBy: 'user-1',
          createdAt: new Date(),
        },
      ]
      vi.mocked(db.query.pinnedMessages.findMany).mockResolvedValue(pins)

      const result = await pinService.getPinnedMessages('channel-id')
      expect(db.query.messages.findMany).toHaveBeenCalled()
      expect(result).toEqual(pins)
    })

    it('returns empty array when no messages in channel', async () => {
      vi.mocked(db.query.messages.findMany).mockResolvedValue([])

      const result = await pinService.getPinnedMessages('empty-channel')
      expect(result).toEqual([])
    })
  })

  describe('getPinnedForumReplies', () => {
    it('returns pinned replies for a thread', async () => {
      vi.mocked(db.query.forumReplies.findMany).mockResolvedValue([{ id: 'reply-1' }] as never)

      const pins = [
        {
          id: 'pin-1',
          entityType: 'forum_reply',
          entityId: 'reply-1',
          pinnedBy: 'user-1',
          createdAt: new Date(),
        },
      ]
      vi.mocked(db.query.pinnedMessages.findMany).mockResolvedValue(pins)

      const result = await pinService.getPinnedForumReplies('thread-id')
      expect(db.query.forumReplies.findMany).toHaveBeenCalled()
      expect(result).toEqual(pins)
    })

    it('returns empty array when no replies in thread', async () => {
      vi.mocked(db.query.forumReplies.findMany).mockResolvedValue([])

      const result = await pinService.getPinnedForumReplies('empty-thread')
      expect(result).toEqual([])
    })
  })

  describe('isPinned', () => {
    it('returns true when entity is pinned', async () => {
      vi.mocked(db.query.pinnedMessages.findFirst).mockResolvedValue({
        id: 'pin-id',
        entityType: 'message',
        entityId: 'msg-id',
        pinnedBy: 'user-id',
        createdAt: new Date(),
      })

      const result = await pinService.isPinned('message', 'msg-id')
      expect(result).toBe(true)
    })

    it('returns false when entity is not pinned', async () => {
      vi.mocked(db.query.pinnedMessages.findFirst).mockResolvedValue(undefined)

      const result = await pinService.isPinned('message', 'msg-id')
      expect(result).toBe(false)
    })
  })
})
