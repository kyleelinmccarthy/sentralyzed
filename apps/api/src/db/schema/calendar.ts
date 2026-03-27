import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  time,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { timestamps } from './_helpers.js'
import { users } from './users.js'

export const rsvpStatusEnum = pgEnum('rsvp_status', ['pending', 'accepted', 'declined'])

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  allDay: boolean('all_day').notNull().default(false),
  recurrenceRule: text('recurrence_rule'), // iCal RRULE
  location: text('location'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  color: varchar('color', { length: 7 }).default('#5C6BC0'),
  ...timestamps(),
})

export const eventAttendees = pgTable('event_attendees', {
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: rsvpStatusEnum('status').notNull().default('pending'),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
})

export const availability = pgTable('availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sun-Sat)
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
})
