// Opaque type surface for Better Auth. This file has NO imports from
// `better-auth` so consumers' type-checkers don't pull in its generic tree.

export interface SimpleSession {
  user: {
    id: string
    email: string
    name: string
    image?: string | null
    emailVerified?: boolean
  }
  session: {
    id: string
    token: string
    userId: string
    expiresAt: Date
  }
}

export interface AuthFacade {
  handler: (request: Request) => Promise<Response>
  api: {
    getSession: (args: { headers: Headers }) => Promise<SimpleSession | null>
    signUpEmail: (args: {
      body: { email: string; name: string; password: string }
      asResponse?: boolean
    }) => Promise<Response | { user: SimpleSession['user']; token: string }>
    signOut: (args: { headers: Headers }) => Promise<Response>
  }
}
