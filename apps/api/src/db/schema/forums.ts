import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { timestamps, softDelete } from './_helpers.js'
import { users } from './users.js'

export const forumCategories = pgTable('forum_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#607D8B'),
  position: integer('position').notNull().default(0),
  ...timestamps(),
})

export const forumThreads = pgTable('forum_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: jsonb('content'),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => forumCategories.id),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  isPinned: boolean('is_pinned').notNull().default(false),
  isLocked: boolean('is_locked').notNull().default(false),
  viewCount: integer('view_count').notNull().default(0),
  ...timestamps(),
})

export const forumReplies = pgTable('forum_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id')
    .notNull()
    .references(() => forumThreads.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  content: jsonb('content'),
  replyToId: uuid('reply_to_id').references((): AnyPgColumn => forumReplies.id),
  ...timestamps(),
  ...softDelete(),
})

export const forumReactions = pgTable('forum_reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 20 }).notNull(), // 'thread' | 'reply'
  entityId: uuid('entity_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  emoji: varchar('emoji', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
