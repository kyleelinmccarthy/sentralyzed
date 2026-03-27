import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  date,
  pgEnum,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { timestamps, softDelete } from './_helpers.js'
import { users } from './users.js'

export const goalLevelEnum = pgEnum('goal_level', ['company', 'team', 'personal'])
export const goalStatusEnum = pgEnum('goal_status', [
  'not_started',
  'in_progress',
  'completed',
  'archived',
])

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  level: goalLevelEnum('level').notNull(),
  parentGoalId: uuid('parent_goal_id').references((): AnyPgColumn => goals.id),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
  teamId: uuid('team_id'),
  status: goalStatusEnum('status').notNull().default('not_started'),
  progressPercentage: integer('progress_percentage').notNull().default(0),
  targetDate: date('target_date'),
  ...timestamps(),
  ...softDelete(),
})
