import { pgTable, uuid, varchar, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const activityActionEnum = pgEnum('activity_action', [
  'created',
  'updated',
  'deleted',
  'commented',
  'assigned',
  'completed',
])

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id),
  action: activityActionEnum('action').notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => activities.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
