import { app } from '@sentral/api/app'

const handler = (req: Request) => {
  // Strip /api prefix so Hono routes match (they're registered as /auth, /goals, etc.)
  const url = new URL(req.url)
  url.pathname = url.pathname.replace(/^\/api/, '') || '/'
  return app.fetch(new Request(url.toString(), req))
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
