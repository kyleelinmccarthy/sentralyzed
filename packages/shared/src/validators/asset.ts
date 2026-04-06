import { z } from 'zod'
import { ASSET_STATUSES, ASSET_CATEGORIES } from '../types/asset.js'

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional(),
  category: z.enum(ASSET_CATEGORIES),
  status: z.enum(ASSET_STATUSES).optional().default('available'),
  serialNumber: z.string().max(255).optional(),
  purchaseCostCents: z.number().int().nonnegative().optional(),
  purchaseDate: z.string().date().optional(),
  warrantyExpiresAt: z.string().datetime().optional(),
  assignedToId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
})

export const updateAssetSchema = createAssetSchema.partial()

export const assetQuerySchema = z.object({
  status: z.enum(ASSET_STATUSES).optional(),
  category: z.enum(ASSET_CATEGORIES).optional(),
  assignedToId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
})

export type CreateAssetInput = z.input<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
export type AssetQueryInput = z.infer<typeof assetQuerySchema>
