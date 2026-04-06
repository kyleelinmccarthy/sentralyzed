import { describe, it, expect } from 'vitest'
import { app } from '../app.js'

describe('API App', () => {
  it('returns API info on GET /', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      name: 'Sentral API',
      status: 'ok',
    })
  })

  it('returns healthy on GET /health', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string; timestamp: string }
    expect(body.status).toBe('healthy')
    expect(body.timestamp).toBeDefined()
  })
})
