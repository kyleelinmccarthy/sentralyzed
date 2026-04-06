import { z } from 'zod'
import { FILE_ENTITY_TYPES } from '../types/file.js'

export const fileEntityTypeSchema = z.enum(FILE_ENTITY_TYPES)

export const fileQuerySchema = z.object({
  entityType: fileEntityTypeSchema,
  entityId: z.string().uuid(),
})

export type FileQueryInput = z.infer<typeof fileQuerySchema>
