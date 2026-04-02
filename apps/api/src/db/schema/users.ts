import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  pgEnum,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { timestamps } from './_helpers'

export const authProviderEnum = pgEnum('auth_provider', ['email', 'google'])
export const roleEnum = pgEnum('role', ['admin', 'manager', 'member'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  authProvider: authProviderEnum('auth_provider').notNull().default('email'),
  role: roleEnum('role').notNull().default('member'),
  invitedBy: uuid('invited_by').references((): AnyPgColumn => users.id),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps(),
})
