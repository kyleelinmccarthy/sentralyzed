import { pgTable, uuid, varchar, text, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core'
import { timestamps } from './_helpers'
import { users } from './users'
import { projects } from './projects'

export const channelTypeEnum = pgEnum('channel_type', ['public', 'private', 'direct'])

export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: channelTypeEnum('type').notNull().default('public'),
  projectId: uuid('project_id').references(() => projects.id),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  ...timestamps(),
})

export const channelMembers = pgTable('channel_members', {
  channelId: uuid('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  lastReadAt: timestamp('last_read_at', { withTimezone: true }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
})

import type { AnyPgColumn } from 'drizzle-orm/pg-core'

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  replyToId: uuid('reply_to_id').references((): AnyPgColumn => messages.id),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  ...timestamps(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const reactions = pgTable(
  'reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    emoji: varchar('emoji', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('reaction_unique').on(table.messageId, table.userId, table.emoji)],
)
