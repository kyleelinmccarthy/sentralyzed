export const ASSET_STATUSES = ['available', 'in_use', 'maintenance', 'retired'] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]

export const ASSET_CATEGORIES = [
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
] as const
export type AssetCategory = (typeof ASSET_CATEGORIES)[number]

export interface Asset {
  id: string
  name: string
  description: string | null
  category: AssetCategory
  status: AssetStatus
  serialNumber: string | null
  purchaseCostCents: number | null
  purchaseDate: string | null
  warrantyExpiresAt: string | null
  assignedToId: string | null
  projectId: string | null
  clientId: string | null
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}
