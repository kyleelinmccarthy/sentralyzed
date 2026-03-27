import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, userSchema } from '../validators/user.js'

describe('loginSchema', () => {
  it('validates correct login input', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('validates correct registration input', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'Test User',
      password: 'password123',
      inviteToken: 'abc-token-123',
    })
    expect(result.success).toBe(true)
  })

  it('requires invite token', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'Test User',
      password: 'password123',
      inviteToken: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('userSchema', () => {
  it('validates a complete user object', () => {
    const result = userSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      name: 'Test User',
      avatarUrl: null,
      authProvider: 'email',
      role: 'member',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid role', () => {
    const result = userSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      name: 'Test User',
      avatarUrl: null,
      authProvider: 'email',
      role: 'superadmin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(result.success).toBe(false)
  })
})
