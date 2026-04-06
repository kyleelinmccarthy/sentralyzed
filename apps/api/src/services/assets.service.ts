import { eq, and, isNull, ilike } from 'drizzle-orm'
import { db } from '../db/index.js'
import { assets } from '../db/schema/assets.js'
import { expenses } from '../db/schema/expenses.js'
import type {
  CreateAssetInput,
  UpdateAssetInput,
  AssetQueryInput,
} from '@sentral/shared/validators/asset'
import { whereActiveById, softDelete, canAccessAsOwner } from './utils/db-helpers.js'

type Role = 'admin' | 'manager' | 'member'

export class AssetsService {
  async create(input: CreateAssetInput, userId: string) {
    const { warrantyExpiresAt, ...rest } = input
    const [asset] = await db
      .insert(assets)
      .values({
        ...rest,
        warrantyExpiresAt: warrantyExpiresAt ? new Date(warrantyExpiresAt) : undefined,
        createdBy: userId,
      })
      .returning()
    return asset!
  }

  async getById(id: string) {
    const asset = await db.query.assets.findFirst({
      where: whereActiveById(assets.id, id, assets.deletedAt),
    })
    return asset ?? null
  }

  async list(query: AssetQueryInput) {
    const conditions = [isNull(assets.deletedAt)]

    if (query.status) conditions.push(eq(assets.status, query.status))
    if (query.category) conditions.push(eq(assets.category, query.category))
    if (query.assignedToId) conditions.push(eq(assets.assignedToId, query.assignedToId))
    if (query.projectId) conditions.push(eq(assets.projectId, query.projectId))
    if (query.clientId) conditions.push(eq(assets.clientId, query.clientId))
    if (query.search) conditions.push(ilike(assets.name, `%${query.search}%`))

    return db.query.assets.findMany({
      where: and(...conditions),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    })
  }

  async update(id: string, input: UpdateAssetInput, userId: string, role: Role) {
    const asset = await db.query.assets.findFirst({
      where: whereActiveById(assets.id, id, assets.deletedAt),
    })
    if (!asset) return { error: 'Asset not found' }
    if (!canAccessAsOwner(role, asset.createdBy, userId)) return { error: 'Asset not found' }

    const { warrantyExpiresAt, ...rest } = input
    const [updated] = await db
      .update(assets)
      .set({
        ...rest,
        ...(warrantyExpiresAt !== undefined && {
          warrantyExpiresAt: warrantyExpiresAt ? new Date(warrantyExpiresAt) : null,
        }),
      })
      .where(eq(assets.id, id))
      .returning()
    return updated!
  }

  async getExpensesForAsset(assetId: string) {
    const asset = await db.query.assets.findFirst({
      where: whereActiveById(assets.id, assetId, assets.deletedAt),
    })
    if (!asset) return null

    return db.query.expenses.findMany({
      where: and(eq(expenses.assetId, assetId), isNull(expenses.deletedAt)),
      orderBy: (e, { desc }) => [desc(e.createdAt)],
    })
  }

  async delete(id: string, userId: string, role: Role): Promise<boolean> {
    const asset = await db.query.assets.findFirst({
      where: whereActiveById(assets.id, id, assets.deletedAt),
    })
    if (!asset) return false
    if (!canAccessAsOwner(role, asset.createdBy, userId)) return false

    await softDelete(assets, assets.id, id)
    return true
  }
}

export const assetsService = new AssetsService()
