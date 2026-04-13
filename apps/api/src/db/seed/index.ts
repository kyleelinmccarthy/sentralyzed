import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users } from '../schema/users.js'
import { hash } from '../../lib/auth.js'
import { eq } from 'drizzle-orm'

async function seed() {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql)

  console.log('Seeding database...')

  const passwordHash = await hash('password123')

  const seedUsers = [
    {
      email: 'admin@solvre.tech',
      name: 'Admin One',
      passwordHash,
      authProvider: 'email' as const,
      role: 'admin' as const,
    },
    {
      email: 'admin2@solvre.tech',
      name: 'Admin Two',
      passwordHash,
      authProvider: 'email' as const,
      role: 'admin' as const,
    },
    {
      email: 'manager@solvre.tech',
      name: 'Admin Three',
      passwordHash,
      authProvider: 'email' as const,
      role: 'manager' as const,
    },
    {
      email: 'member1@solvre.tech',
      name: 'Team Member One',
      passwordHash,
      authProvider: 'email' as const,
      role: 'member' as const,
    },
    {
      email: 'member2@solvre.tech',
      name: 'Team Member Two',
      passwordHash,
      authProvider: 'email' as const,
      role: 'member' as const,
    },
  ]

  for (const user of seedUsers) {
    const existing = await db.select().from(users).where(eq(users.email, user.email))
    if (existing.length > 0) {
      await db
        .update(users)
        .set({ name: user.name, role: user.role })
        .where(eq(users.email, user.email))
    } else {
      await db.insert(users).values(user)
    }
  }

  console.log('Seed complete!')
}

seed().catch(console.error)
