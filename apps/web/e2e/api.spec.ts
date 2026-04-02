import { test, expect } from '@playwright/test'

const API_URL = 'http://localhost:3001'

test.describe('API Endpoints', () => {
  test('health check returns ok', async ({ request }) => {
    const res = await request.get(`${API_URL}/health`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.status).toBe('healthy')
  })

  test('root returns API info', async ({ request }) => {
    const res = await request.get(`${API_URL}/`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.name).toBe('Sentralyzed API')
    expect(body.status).toBe('ok')
  })

  test('unauthenticated request to protected route returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/goals`)
    expect(res.status()).toBe(401)
  })

  test('login with invalid credentials returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'nobody@example.com', password: 'wrongpassword' },
    })
    expect(res.status()).toBe(401)
  })

  test('register without invite token returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: 'new@example.com',
        name: 'Test',
        password: 'password123',
        inviteToken: 'fake',
      },
    })
    expect(res.status()).toBe(400)
  })

  test('forgot password always returns success', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/forgot-password`, {
      data: { email: 'anyone@example.com' },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.message).toContain('reset link')
  })
})
