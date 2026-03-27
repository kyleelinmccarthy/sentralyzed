import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://sentralyzed:devpassword123@localhost:5432/sentralyzed_dev'

const client = postgres(connectionString)
export const db = drizzle(client, { schema })

export type Database = typeof db
