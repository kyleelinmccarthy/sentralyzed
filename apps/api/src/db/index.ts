import postgres from 'postgres'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema/index.js'

let _db: PostgresJsDatabase<typeof schema> | undefined

function createDb() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
  return drizzle(sql, { schema })
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_, prop) {
    if (!_db) _db = createDb()
    return Reflect.get(_db, prop)
  },
})

export type Database = PostgresJsDatabase<typeof schema>
