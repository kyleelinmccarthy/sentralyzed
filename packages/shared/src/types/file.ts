export const FILE_ENTITY_TYPES = [
  'task',
  'project',
  'channel',
  'message',
  'forum_post',
  'feedback',
  'poll',
  'expense',
  'client',
  'whiteboard',
] as const

export type FileEntityType = (typeof FILE_ENTITY_TYPES)[number]

export interface FileRecord {
  id: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  uploadedBy: string
  entityType: FileEntityType
  entityId: string
  createdAt: string
  updatedAt: string
}
