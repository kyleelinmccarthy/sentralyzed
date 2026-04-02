import { pgTable, uuid, varchar, text, integer, date, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { timestamps, softDelete } from './_helpers'
import { users } from './users'
import { projects } from './projects'

export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'in_review', 'done'])

export const taskPriorityEnum = pgEnum('task_priority', ['urgent', 'high', 'medium', 'low'])

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: jsonb('description'),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  assigneeId: uuid('assignee_id').references(() => users.id),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => users.id),
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  dueDate: date('due_date'),
  estimatedHours: integer('estimated_hours'),
  position: integer('position').notNull().default(0),
  labels: text('labels').array(),
  ...timestamps(),
  ...softDelete(),
})

export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  ...timestamps(),
})
