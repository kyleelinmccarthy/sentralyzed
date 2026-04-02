import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { roleEnum } from './users'

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
