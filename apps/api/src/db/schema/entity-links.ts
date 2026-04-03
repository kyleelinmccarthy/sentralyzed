import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const entityLinks = pgTable(
  'entity_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceType: varchar('source_type', { length: 20 }).notNull(), // 'message' | 'forum_thread' | 'forum_reply'
    sourceId: uuid('source_id').notNull(),
    targetType: varchar('target_type', { length: 20 }).notNull(), // 'project' | 'goal' | 'task'
    targetId: uuid('target_id').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('entity_link_unique').on(
      table.sourceType,
      table.sourceId,
      table.targetType,
      table.targetId,
    ),
  ],
)
