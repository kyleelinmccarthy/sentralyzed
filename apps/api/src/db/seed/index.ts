import { eq } from 'drizzle-orm'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../index.js'
import { users, sessions, accounts, verifications, twoFactors } from '../schema/index.js'

// Seed-only Better Auth instance with signup enabled (the production instance has
// `disableSignUp: true` so unsolicited registrations go through our invitation flow).
const seedAuth = betterAuth({
  baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
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
  emailAndPassword: { enabled: true, autoSignIn: false, minPasswordLength: 8 },
  user: {
    modelName: 'users',
    additionalFields: {
      role: { type: 'string', required: true, defaultValue: 'member', input: false },
      invitedBy: { type: 'string', required: false, input: false },
      isActive: { type: 'boolean', required: true, defaultValue: true, input: false },
    },
  },
  advanced: { database: { generateId: () => crypto.randomUUID() } },
})

const SEED_PASSWORD = 'password123'

const SEED_USERS: Array<{ email: string; name: string; role: 'admin' | 'manager' | 'member' }> = [
  { email: 'admin@solvre.tech', name: 'Admin One', role: 'admin' },
  { email: 'admin2@solvre.tech', name: 'Admin Two', role: 'admin' },
  { email: 'manager@solvre.tech', name: 'Admin Three', role: 'manager' },
  { email: 'member1@solvre.tech', name: 'Team Member One', role: 'member' },
  { email: 'member2@solvre.tech', name: 'Team Member Two', role: 'member' },
]

async function seed() {
  console.log('Seeding test users via Better Auth...')

  for (const u of SEED_USERS) {
    const existing = await db.query.users.findFirst({ where: eq(users.email, u.email) })
    if (existing) {
      // Re-apply role/name in case they drifted
      await db.update(users).set({ name: u.name, role: u.role }).where(eq(users.email, u.email))
      console.log(`  - ${u.email} already exists, role refreshed`)
      continue
    }

    // Better Auth's signUpEmail handles password hashing + creates the linked
    // `account` row with the credential. We then upgrade the user with the
    // role since Better Auth's additionalFields default everyone to 'member'.
    try {
      await seedAuth.api.signUpEmail({
        body: { email: u.email, name: u.name, password: SEED_PASSWORD },
      })
      await db
        .update(users)
        .set({ role: u.role, emailVerified: true })
        .where(eq(users.email, u.email))
      console.log(`  + ${u.email} (${u.role})`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`  ! Failed to seed ${u.email}: ${msg}`)
    }
  }

  console.log('Seed complete!')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
