import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { users } from './users'

// Better Auth twoFactor plugin — TOTP secret + backup codes per user
export const twoFactors = pgTable('two_factor', {
  id: uuid('id').primaryKey().defaultRandom(),
  secret: text('secret').notNull(),
  backupCodes: text('backup_codes').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})
