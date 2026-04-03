import { describe, it, expect } from 'vitest'
import { createPollSchema, votePollSchema, pollVotePayloadSchema } from '../validators/poll.js'

describe('createPollSchema', () => {
  const validPoll = {
    question: 'What should we build next?',
    contextType: 'channel' as const,
    contextId: '550e8400-e29b-41d4-a716-446655440000',
    options: ['Option A', 'Option B'],
  }

  it('validates a minimal valid poll', () => {
    const result = createPollSchema.safeParse(validPoll)
    expect(result.success).toBe(true)
  })

  it('validates a poll with all optional fields', () => {
    const result = createPollSchema.safeParse({
      ...validPoll,
      allowMultiple: true,
      isAnonymous: true,
      expiresAt: '2026-12-31T23:59:59Z',
    })
    expect(result.success).toBe(true)
  })

  it('defaults allowMultiple and isAnonymous to false', () => {
    const result = createPollSchema.safeParse(validPoll)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.allowMultiple).toBe(false)
      expect(result.data.isAnonymous).toBe(false)
    }
  })

  it('rejects empty question', () => {
    const result = createPollSchema.safeParse({ ...validPoll, question: '' })
    expect(result.success).toBe(false)
  })

  it('rejects question over 500 chars', () => {
    const result = createPollSchema.safeParse({ ...validPoll, question: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('rejects fewer than 2 options', () => {
    const result = createPollSchema.safeParse({ ...validPoll, options: ['Only one'] })
    expect(result.success).toBe(false)
  })

  it('rejects more than 10 options', () => {
    const options = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`)
    const result = createPollSchema.safeParse({ ...validPoll, options })
    expect(result.success).toBe(false)
  })

  it('rejects empty option text', () => {
    const result = createPollSchema.safeParse({ ...validPoll, options: ['Valid', ''] })
    expect(result.success).toBe(false)
  })

  it('rejects option text over 200 chars', () => {
    const result = createPollSchema.safeParse({ ...validPoll, options: ['Valid', 'x'.repeat(201)] })
    expect(result.success).toBe(false)
  })

  it('rejects invalid contextType', () => {
    const result = createPollSchema.safeParse({ ...validPoll, contextType: 'dm' })
    expect(result.success).toBe(false)
  })

  it('accepts forum contextType', () => {
    const result = createPollSchema.safeParse({ ...validPoll, contextType: 'forum' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid contextId', () => {
    const result = createPollSchema.safeParse({ ...validPoll, contextId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid expiresAt format', () => {
    const result = createPollSchema.safeParse({ ...validPoll, expiresAt: 'tomorrow' })
    expect(result.success).toBe(false)
  })
})

describe('votePollSchema', () => {
  it('validates a single vote', () => {
    const result = votePollSchema.safeParse({
      optionIds: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    expect(result.success).toBe(true)
  })

  it('validates multiple votes', () => {
    const result = votePollSchema.safeParse({
      optionIds: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty optionIds', () => {
    const result = votePollSchema.safeParse({ optionIds: [] })
    expect(result.success).toBe(false)
  })

  it('rejects invalid uuid in optionIds', () => {
    const result = votePollSchema.safeParse({ optionIds: ['not-a-uuid'] })
    expect(result.success).toBe(false)
  })
})

describe('pollVotePayloadSchema', () => {
  it('validates a valid WebSocket vote payload', () => {
    const result = pollVotePayloadSchema.safeParse({
      pollId: '550e8400-e29b-41d4-a716-446655440000',
      optionIds: ['550e8400-e29b-41d4-a716-446655440001'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing pollId', () => {
    const result = pollVotePayloadSchema.safeParse({
      optionIds: ['550e8400-e29b-41d4-a716-446655440001'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid pollId', () => {
    const result = pollVotePayloadSchema.safeParse({
      pollId: 'not-a-uuid',
      optionIds: ['550e8400-e29b-41d4-a716-446655440001'],
    })
    expect(result.success).toBe(false)
  })
})
