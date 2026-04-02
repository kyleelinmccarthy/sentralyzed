import type { Context, Next } from 'hono'

// Rate limiting state (in production, use Redis for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(maxRequests: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const key = c.req.header('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    } else {
      entry.count++
      if (entry.count > maxRequests) {
        c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
        return c.json({ error: 'Too many requests' }, 429)
      }
    }

    await next()
  }
}

export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next()
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('X-XSS-Protection', '1; mode=block')
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws: wss:",
    )
  }
}
