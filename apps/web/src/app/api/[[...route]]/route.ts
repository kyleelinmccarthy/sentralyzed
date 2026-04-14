import { app } from '@sentral/api/app'
import { getSessionFromHeaders } from '@sentral/api/auth'

const handler = async (req: Request) => {
  // /api/auth/* is handled by the Better Auth catch-all in app/api/auth/[...all]/route.ts.
  // This route only sees /api/* paths that are NOT under /api/auth.
  const session = await getSessionFromHeaders(req.headers)

  // Strip /api prefix so Hono routes match (they're registered as /goals, /tasks, etc.)
  const url = new URL(req.url)
  url.pathname = url.pathname.replace(/^\/api/, '') || '/'

  // Forward the resolved user id as a header so Hono's authMiddleware can skip
  // the round-trip through Better Auth.
  const headers = new Headers(req.headers)
  if (session?.user) {
    headers.set('x-auth-user-id', session.user.id)
  } else {
    headers.delete('x-auth-user-id')
  }

  return app.fetch(
    new Request(url.toString(), {
      method: req.method,
      headers,
      body: req.body,
      // @ts-expect-error — duplex required when streaming a body
      duplex: 'half',
    }),
  )
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
