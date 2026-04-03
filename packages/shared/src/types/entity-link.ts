export const SOURCE_TYPES = ['message', 'forum_thread', 'forum_reply'] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

export const TARGET_TYPES = ['project', 'goal', 'task'] as const
export type TargetType = (typeof TARGET_TYPES)[number]

export interface EntityLink {
  id: string
  sourceType: SourceType
  sourceId: string
  targetType: TargetType
  targetId: string
  createdBy: string
  createdAt: string
}
