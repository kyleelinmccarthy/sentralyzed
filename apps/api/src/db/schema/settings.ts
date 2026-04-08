import {
  pgTable,
  uuid,
  varchar,
  boolean,
  time,
  jsonb,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { timestamps } from './_helpers'
import { users } from './users'

export const emailDigestEnum = pgEnum('email_digest', ['off', 'daily', 'weekly'])
export const calendarViewEnum = pgEnum('calendar_view', ['week', 'month'])

export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Notification preferences
  notifyTaskAssignment: boolean('notify_task_assignment').notNull().default(true),
  notifyChatMention: boolean('notify_chat_mention').notNull().default(true),
  notifyForumReply: boolean('notify_forum_reply').notNull().default(true),
  notifyProjectUpdate: boolean('notify_project_update').notNull().default(true),
  notifyEventInvite: boolean('notify_event_invite').notNull().default(true),
  notifyGoalUpdate: boolean('notify_goal_update').notNull().default(true),
  emailDigest: emailDigestEnum('email_digest').notNull().default('off'),

  // Appearance
  dashboardWidgets: jsonb('dashboard_widgets')
    .notNull()
    .$type<string[]>()
    .default(['tasks', 'events', 'goals', 'feedbackItems', 'chatNotifications']),

  // Calendar & scheduling
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
  workingHoursStart: time('working_hours_start').notNull().default('09:00'),
  workingHoursEnd: time('working_hours_end').notNull().default('17:00'),
  defaultCalendarView: calendarViewEnum('default_calendar_view').notNull().default('week'),

  ...timestamps(),
})

export const mutedEntities = pgTable(
  'muted_entities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 20 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('muted_entities_user_entity_idx').on(
      table.userId,
      table.entityType,
      table.entityId,
    ),
  ],
)
