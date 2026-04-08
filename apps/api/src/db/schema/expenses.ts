import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  date,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { timestamps, softDelete } from './_helpers'
import { users } from './users'
import { projects } from './projects'
import { clients } from './clients'
import { assets } from './assets'

export const expenseCategoryEnum = pgEnum('expense_category', [
  'advertising',
  'bank_fees',
  'contract_labor',
  'education_training',
  'equipment',
  'insurance',
  'legal',
  'meals',
  'office_supplies',
  'operating',
  'professional_services',
  'rent_lease',
  'software_subscriptions',
  'taxes_licenses',
  'travel',
  'utilities',
  'wages',
  'other',
])

export const expenseStatusEnum = pgEnum('expense_status', ['pending', 'approved', 'rejected'])

export const expenseFrequencyEnum = pgEnum('expense_frequency', [
  'one_time',
  'monthly',
  'quarterly',
  'annually',
])

export const budgetPeriodEnum = pgEnum('budget_period', ['monthly', 'quarterly', 'yearly'])

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  amountCents: integer('amount_cents').notNull(),
  periodType: budgetPeriodEnum('period_type').notNull(),
  category: expenseCategoryEnum('category'),
  projectId: uuid('project_id').references(() => projects.id),
  clientId: uuid('client_id').references(() => clients.id),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  ...timestamps(),
  ...softDelete(),
})

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  description: varchar('description', { length: 500 }).notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  category: expenseCategoryEnum('category').notNull(),
  customLabel: varchar('custom_label', { length: 100 }),
  receiptUrl: text('receipt_url'),
  projectId: uuid('project_id').references(() => projects.id),
  clientId: uuid('client_id').references(() => clients.id),
  budgetId: uuid('budget_id').references(() => budgets.id),
  assetId: uuid('asset_id').references(() => assets.id),
  userId: uuid('user_id').references(() => users.id),
  frequency: expenseFrequencyEnum('frequency').notNull().default('one_time'),
  taxDeductible: boolean('tax_deductible').notNull().default(true),
  date: date('date').notNull(),
  vendor: varchar('vendor', { length: 255 }),
  notes: text('notes'),
  status: expenseStatusEnum('status').notNull().default('pending'),
  submittedBy: uuid('submitted_by')
    .notNull()
    .references(() => users.id),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  ...timestamps(),
  ...softDelete(),
})
