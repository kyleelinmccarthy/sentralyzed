import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.js'
import { roleEnum } from './users.js'

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('member'),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
