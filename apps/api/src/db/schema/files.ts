import { pgTable, uuid, varchar, integer, customType } from 'drizzle-orm/pg-core'
import { timestamps, softDelete } from './_helpers.js'
import { users } from './users.js'

const bytea = customType<{ data: Buffer; driverParam: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 127 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  encryptedData: bytea('encrypted_data').notNull(),
  encryptionIv: bytea('encryption_iv').notNull(),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  ...timestamps(),
  ...softDelete(),
})
