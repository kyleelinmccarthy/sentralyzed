import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const pinnedMessages = pgTable(
  'pinned_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: varchar('entity_type', { length: 20 }).notNull(), // 'message' | 'forum_reply'
    entityId: uuid('entity_id').notNull(),
    pinnedBy: uuid('pinned_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('pinned_entity_unique').on(table.entityType, table.entityId)],
)
