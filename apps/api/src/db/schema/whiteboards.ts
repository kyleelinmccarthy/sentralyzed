import { pgTable, uuid, varchar, text, timestamp, pgEnum, customType } from 'drizzle-orm/pg-core'
import { timestamps, softDelete } from './_helpers.js'
import { users } from './users.js'
import { projects } from './projects.js'

const bytea = customType<{ data: Buffer; driverParam: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

export const whiteboardPermissionEnum = pgEnum('whiteboard_permission', ['edit', 'view'])

export const whiteboards = pgTable('whiteboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  yjsState: bytea('yjs_state'),
  thumbnailUrl: text('thumbnail_url'),
  ...timestamps(),
  ...softDelete(),
})

export const whiteboardCollaborators = pgTable('whiteboard_collaborators', {
  whiteboardId: uuid('whiteboard_id')
    .notNull()
    .references(() => whiteboards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  permission: whiteboardPermissionEnum('permission').notNull().default('edit'),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
})
