import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { timestamps, softDelete } from './_helpers'
import { users } from './users'

export const feedbackCategoryEnum = pgEnum('feedback_category', [
  'bug',
  'feature_request',
  'improvement',
  'question',
  'other',
])

export const feedbackPriorityEnum = pgEnum('feedback_priority', [
  'low',
  'medium',
  'high',
  'critical',
])

export const feedbackStatusEnum = pgEnum('feedback_status', [
  'open',
  'in_review',
  'resolved',
  'closed',
])

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  category: feedbackCategoryEnum('category').notNull(),
  priority: feedbackPriorityEnum('priority').notNull().default('medium'),
  status: feedbackStatusEnum('status').notNull().default('open'),
  submittedBy: uuid('submitted_by')
    .notNull()
    .references(() => users.id),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  adminNotes: text('admin_notes'),
  ...timestamps(),
  ...softDelete(),
})

export const feedbackResponses = pgTable('feedback_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedbackId: uuid('feedback_id')
    .notNull()
    .references(() => feedback.id, { onDelete: 'cascade' }),
  respondedBy: uuid('responded_by')
    .notNull()
    .references(() => users.id),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
