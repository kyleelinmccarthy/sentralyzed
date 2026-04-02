import { pgTable, uuid, varchar, text, jsonb, timestamp, bigint } from 'drizzle-orm/pg-core'
import { timestamps } from './_helpers'
import { users } from './users'
import { projects } from './projects'
import { tasks } from './tasks'

export const githubConnections = pgTable('github_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  githubUserId: bigint('github_user_id', { mode: 'number' }).notNull(),
  githubUsername: varchar('github_username', { length: 255 }).notNull(),
  accessToken: text('access_token').notNull(), // encrypted
  installationId: bigint('installation_id', { mode: 'number' }),
  ...timestamps(),
})

export const githubRepos = pgTable('github_repos', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  githubRepoId: bigint('github_repo_id', { mode: 'number' }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  defaultBranch: varchar('default_branch', { length: 255 }).default('main'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  ...timestamps(),
})

export const githubEvents = pgTable('github_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  repoId: uuid('repo_id')
    .notNull()
    .references(() => githubRepos.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // commit, pr, issue, deployment
  githubId: varchar('github_id', { length: 255 }),
  title: text('title'),
  description: text('description'),
  author: varchar('author', { length: 255 }),
  url: text('url'),
  status: varchar('status', { length: 50 }),
  metadata: jsonb('metadata'),
  linkedTaskId: uuid('linked_task_id').references(() => tasks.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
