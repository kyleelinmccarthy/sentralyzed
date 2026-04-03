import { describe, it, expect } from 'vitest'
import {
  createClientSchema,
  updateClientSchema,
  clientProjectSchema,
} from '../validators/client.js'

describe('createClientSchema', () => {
  const validClient = {
    name: 'Acme Corp',
  }

  it('validates a minimal valid client', () => {
    const result = createClientSchema.safeParse(validClient)
    expect(result.success).toBe(true)
  })

  it('validates a client with all optional fields', () => {
    const result = createClientSchema.safeParse({
      ...validClient,
      email: 'contact@acme.com',
      phone: '+1-555-0100',
      company: 'Acme Corporation',
      notes: 'Important client',
      status: 'active',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createClientSchema.safeParse({ ...validClient, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name over 255 chars', () => {
    const result = createClientSchema.safeParse({ ...validClient, name: 'x'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = createClientSchema.safeParse({ ...validClient, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects phone over 50 chars', () => {
    const result = createClientSchema.safeParse({ ...validClient, phone: '1'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('rejects company over 255 chars', () => {
    const result = createClientSchema.safeParse({ ...validClient, company: 'x'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = createClientSchema.safeParse({ ...validClient, status: 'vip' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid statuses', () => {
    for (const status of ['lead', 'active', 'inactive', 'churned']) {
      const result = createClientSchema.safeParse({ ...validClient, status })
      expect(result.success).toBe(true)
    }
  })
})

describe('updateClientSchema', () => {
  it('validates an empty update (all optional)', () => {
    const result = updateClientSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('validates partial update with name', () => {
    const result = updateClientSchema.safeParse({ name: 'New Name' })
    expect(result.success).toBe(true)
  })

  it('allows nullable email', () => {
    const result = updateClientSchema.safeParse({ email: null })
    expect(result.success).toBe(true)
  })

  it('allows nullable phone', () => {
    const result = updateClientSchema.safeParse({ phone: null })
    expect(result.success).toBe(true)
  })

  it('allows nullable company', () => {
    const result = updateClientSchema.safeParse({ company: null })
    expect(result.success).toBe(true)
  })

  it('allows nullable notes', () => {
    const result = updateClientSchema.safeParse({ notes: null })
    expect(result.success).toBe(true)
  })

  it('rejects empty name when provided', () => {
    const result = updateClientSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})

describe('clientProjectSchema', () => {
  it('validates a valid project association', () => {
    const result = clientProjectSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('validates with optional role', () => {
    const result = clientProjectSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      role: 'sponsor',
    })
    expect(result.success).toBe(true)
  })

  it('validates with optional dates', () => {
    const result = clientProjectSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid projectId', () => {
    const result = clientProjectSchema.safeParse({ projectId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid role', () => {
    const result = clientProjectSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      role: 'owner',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid roles', () => {
    for (const role of ['sponsor', 'stakeholder', 'end_user']) {
      const result = clientProjectSchema.safeParse({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        role,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid date format', () => {
    const result = clientProjectSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      startDate: 'next-week',
    })
    expect(result.success).toBe(false)
  })
})
