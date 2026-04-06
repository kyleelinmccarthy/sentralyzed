import { pgTable, uuid, varchar, text, integer, date, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { timestamps, softDelete } from './_helpers'
import { users } from './users'
import { projects } from './projects'
import { clients } from './clients'

export const assetStatusEnum = pgEnum('asset_status', [
  'available',
  'in_use',
  'maintenance',
  'retired',
])

export const assetCategoryEnum = pgEnum('asset_category', [
  'laptop',
  'monitor',
  'phone',
  'tablet',
  'peripheral',
  'furniture',
  'vehicle',
  'software_license',
  'equipment',
  'other',
])

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: assetCategoryEnum('category').notNull(),
  status: assetStatusEnum('status').notNull().default('available'),
  serialNumber: varchar('serial_number', { length: 255 }),
  purchaseCostCents: integer('purchase_cost_cents'),
  purchaseDate: date('purchase_date'),
  warrantyExpiresAt: timestamp('warranty_expires_at', { withTimezone: true }),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  projectId: uuid('project_id').references(() => projects.id),
  clientId: uuid('client_id').references(() => clients.id),
  notes: text('notes'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  ...timestamps(),
  ...softDelete(),
})
