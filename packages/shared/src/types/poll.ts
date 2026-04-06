export const POLL_CONTEXT_TYPES = [
  'channel',
  'forum',
  'project',
  'goal',
  'task',
  'client',
  'expense',
  'calendar',
  'user',
  'whiteboard',
  'feedback',
  'asset',
] as const

export type PollContextType = (typeof POLL_CONTEXT_TYPES)[number]

export interface Poll {
  id: string
  question: string
  contextType: PollContextType
  contextId: string
  createdBy: string
  allowMultiple: boolean
  isAnonymous: boolean
  closedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PollOption {
  id: string
  pollId: string
  text: string
  position: number
  createdAt: string
}

export interface PollVote {
  id: string
  pollId: string
  optionId: string
  userId: string
  createdAt: string
}

export interface PollWithResults extends Poll {
  options: PollOptionWithCount[]
  totalVotes: number
  userVotes: string[] // optionIds the current user voted for
}

export interface PollOptionWithCount extends PollOption {
  voteCount: number
}
