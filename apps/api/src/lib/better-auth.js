// Runtime Better Auth instance. Plain JS so tsc doesn't pull Better Auth's
// enormous inferred generic tree into the type-check graph (it OOMs `tsc`).
// The companion `better-auth.d.ts` provides the typed surface — TS resolves
// `'./better-auth.js'` imports to the .d.ts because no .ts sibling exists.
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { twoFactor } from 'better-auth/plugins'
import { db } from '../db/index.js'
import { users, sessions, accounts, verifications, twoFactors } from '../db/schema/index.js'

const baseURL = process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || 'http://localhost:3000'

const options = {
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET || 'dev-better-auth-secret-change-in-production',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      users,
      session: sessions,
      account: accounts,
      verification: verifications,
      twoFactor: twoFactors,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Open email signup is disabled — invited users sign up via our
    // /auth/invitation-signup endpoint, which validates the invite then calls
    // auth.api.signUpEmail server-side.
    disableSignUp: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  user: {
    modelName: 'users',
    fields: {
      image: 'avatarUrl',
    },
    additionalFields: {
      role: { type: 'string', required: true, defaultValue: 'member', input: false },
      invitedBy: { type: 'string', required: false, input: false },
      isActive: { type: 'boolean', required: true, defaultValue: true, input: false },
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    cookiePrefix: 'sentral',
    ...(process.env.COOKIE_DOMAIN
      ? { crossSubDomainCookies: { enabled: true, domain: process.env.COOKIE_DOMAIN } }
      : {}),
  },
  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
  plugins: [twoFactor()],
}

export const auth = betterAuth(options)

export async function getSessionFromHeaders(headers) {
  return auth.api.getSession({ headers })
}
