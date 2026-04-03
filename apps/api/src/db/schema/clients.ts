import { pgTable, uuid, varchar, text, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { timestamps, softDelete } from './_helpers'
import { users } from './users'
import { projects } from './projects'

export const clientStatusEnum = pgEnum('client_status', ['lead', 'active', 'inactive', 'churned'])

export const clientProjectRoleEnum = pgEnum('client_project_role', [
  'sponsor',
  'stakeholder',
  'end_user',
])

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  notes: text('notes'),
  status: clientStatusEnum('status').notNull().default('lead'),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
  ...timestamps(),
  ...softDelete(),
})

export const clientProjects = pgTable('client_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  role: clientProjectRoleEnum('role').notNull().default('stakeholder'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
