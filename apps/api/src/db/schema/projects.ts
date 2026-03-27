import { pgTable, uuid, varchar, text, integer, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { timestamps, softDelete } from './_helpers.js'
import { users } from './users.js'
import { goals } from './goals.js'

export const projectStatusEnum = pgEnum('project_status', [
  'active',
  'paused',
  'completed',
  'archived',
])

export const projectMemberRoleEnum = pgEnum('project_member_role', [
  'lead',
  'contributor',
  'viewer',
])

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('active'),
  priority: integer('priority').notNull().default(0),
  goalId: uuid('goal_id').references(() => goals.id),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
  color: varchar('color', { length: 7 }).default('#5C6BC0'),
  icon: varchar('icon', { length: 50 }).default('◈'),
  ...timestamps(),
  ...softDelete(),
})

export const projectMembers = pgTable('project_members', {
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: projectMemberRoleEnum('role').notNull().default('contributor'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
})
