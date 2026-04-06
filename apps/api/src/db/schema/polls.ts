import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { timestamps } from './_helpers'
import { users } from './users'
import { POLL_CONTEXT_TYPES } from '@sentral/shared/types/poll'

export const pollContextTypeEnum = pgEnum(
  'poll_context_type',
  POLL_CONTEXT_TYPES as unknown as [string, ...string[]],
)

export const polls = pgTable('polls', {
  id: uuid('id').primaryKey().defaultRandom(),
  question: text('question').notNull(),
  contextType: pollContextTypeEnum('context_type').notNull(),
  contextId: uuid('context_id').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  allowMultiple: boolean('allow_multiple').notNull().default(false),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  ...timestamps(),
})

export const pollOptions = pgTable('poll_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  pollId: uuid('poll_id')
    .notNull()
    .references(() => polls.id, { onDelete: 'cascade' }),
  text: varchar('text', { length: 200 }).notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pollVotes = pgTable(
  'poll_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    optionId: uuid('option_id')
      .notNull()
      .references(() => pollOptions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('poll_vote_unique').on(table.pollId, table.optionId, table.userId)],
)
