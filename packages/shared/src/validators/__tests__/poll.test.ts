import { describe, it, expect } from 'vitest'
import { createPollSchema, votePollSchema } from '../poll'

const ALL_CONTEXT_TYPES = [
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
] as const

const validBase = {
  question: 'Which option?',
  contextId: '00000000-0000-0000-0000-000000000001',
  options: ['Option A', 'Option B'],
}

describe('createPollSchema', () => {
  it.each(ALL_CONTEXT_TYPES)('accepts contextType "%s"', (contextType) => {
    const result = createPollSchema.safeParse({ ...validBase, contextType })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid contextType', () => {
    const result = createPollSchema.safeParse({ ...validBase, contextType: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('requires at least 2 options', () => {
    const result = createPollSchema.safeParse({
      ...validBase,
      contextType: 'project',
      options: ['Only one'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 10 options', () => {
    const result = createPollSchema.safeParse({
      ...validBase,
      contextType: 'project',
      options: Array.from({ length: 11 }, (_, i) => `Option ${i}`),
    })
    expect(result.success).toBe(false)
  })

  it('defaults allowMultiple to false', () => {
    const result = createPollSchema.parse({ ...validBase, contextType: 'project' })
    expect(result.allowMultiple).toBe(false)
  })

  it('defaults isAnonymous to false', () => {
    const result = createPollSchema.parse({ ...validBase, contextType: 'project' })
    expect(result.isAnonymous).toBe(false)
  })
})

describe('votePollSchema', () => {
  it('accepts valid optionIds', () => {
    const result = votePollSchema.safeParse({
      optionIds: ['00000000-0000-0000-0000-000000000001'],
    })
    expect(result.success).toBe(true)
  })

  it('requires at least one optionId', () => {
    const result = votePollSchema.safeParse({ optionIds: [] })
    expect(result.success).toBe(false)
  })
})
