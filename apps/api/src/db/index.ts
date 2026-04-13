import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema/index.js'

let _db: NeonHttpDatabase<typeof schema> | undefined

function createDb() {
  const sql: NeonQueryFunction<false, false> = neon(process.env.DATABASE_URL!)
  return drizzle(sql, { schema })
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    if (!_db) _db = createDb()
    return Reflect.get(_db, prop)
  },
})

export type Database = NeonHttpDatabase<typeof schema>
