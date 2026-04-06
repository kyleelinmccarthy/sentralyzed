import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from '../schema/users.js'
import { hash } from '../../lib/auth.js'

async function seed() {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://sentral:devpassword123@localhost:5433/sentral_dev'
  const client = postgres(connectionString)
  const db = drizzle(client)

  console.log('Seeding database...')

  const passwordHash = await hash('password123')

  await db.insert(users).values([
    {
      email: 'admin@solvre.tech',
      name: 'Admin User',
      passwordHash,
      authProvider: 'email',
      role: 'admin',
    },
    {
      email: 'admin2@solvre.tech',
      name: 'Admin Two',
      passwordHash,
      authProvider: 'email',
      role: 'admin',
    },
    {
      email: 'manager@solvre.tech',
      name: 'Team Manager',
      passwordHash,
      authProvider: 'email',
      role: 'manager',
    },
    {
      email: 'member1@solvre.tech',
      name: 'Team Member One',
      passwordHash,
      authProvider: 'email',
      role: 'member',
    },
    {
      email: 'member2@solvre.tech',
      name: 'Team Member Two',
      passwordHash,
      authProvider: 'email',
      role: 'member',
    },
  ])

  console.log('Seed complete!')
  await client.end()
}

seed().catch(console.error)
