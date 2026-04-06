export type WsMessageType =
  | 'chat:message'
  | 'chat:typing'
  | 'chat:reaction'
  | 'notification:new'
  | 'notification:read'
  | 'whiteboard:update'
  | 'presence:online'
  | 'presence:offline'

export interface WsMessage {
  type: WsMessageType
  payload: unknown
  timestamp: string
}

export interface ChatMessagePayload {
  channelId: string
  messageId: string
  authorId: string
  authorName: string
  content: string
  replyToId?: string
}

export interface TypingPayload {
  channelId: string
  userId: string
  userName: string
}

export interface ReactionPayload {
  messageId: string
  userId: string
  emoji: string
  action: 'add' | 'remove'
}

export interface PresencePayload {
  userId: string
  userName: string
}

export interface NotificationPayload {
  notificationId: string
  activityId: string
  action: string
  entityType: string
  entityId: string
  metadata: Record<string, unknown>
  createdAt: string
}
