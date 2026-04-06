import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database module before importing the service
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockAssetsFindMany = vi.fn()
const mockAssetsFindFirst = vi.fn()
const mockExpensesFindMany = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    query: {
      assets: {
        findMany: mockAssetsFindMany,
        findFirst: mockAssetsFindFirst,
      },
      expenses: {
        findMany: mockExpensesFindMany,
      },
    },
  },
}))

// Must import after mocks
const { AssetsService } = await import('../services/assets.service.js')

describe('AssetsService', () => {
  let service: InstanceType<typeof AssetsService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AssetsService()
  })

  describe('create', () => {
    it('inserts an asset with createdBy set', async () => {
      const asset = {
        id: 'asset-1',
        name: 'MacBook Pro 16"',
        category: 'laptop',
        status: 'available',
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const returning = vi.fn().mockResolvedValue([asset])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })

      const result = await service.create(
        {
          name: 'MacBook Pro 16"',
          category: 'laptop',
        },
        'user-1',
      )

      expect(result).toEqual(asset)
      expect(mockInsert).toHaveBeenCalled()
      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'MacBook Pro 16"',
          category: 'laptop',
          createdBy: 'user-1',
        }),
      )
    })
  })

  describe('getById', () => {
    it('returns the asset when found', async () => {
      const asset = { id: 'asset-1', name: 'Monitor', deletedAt: null }
      mockAssetsFindFirst.mockResolvedValue(asset)

      const result = await service.getById('asset-1')

      expect(result).toEqual(asset)
    })

    it('returns null when asset not found', async () => {
      mockAssetsFindFirst.mockResolvedValue(undefined)

      const result = await service.getById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('returns paginated assets', async () => {
      const assets = [{ id: 'asset-1' }, { id: 'asset-2' }]
      mockAssetsFindMany.mockResolvedValue(assets)

      const result = await service.list({ page: 1, limit: 25 })

      expect(result).toEqual(assets)
      expect(mockAssetsFindMany).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('admin can update any asset', async () => {
      const asset = { id: 'asset-1', createdBy: 'other-user', deletedAt: null }
      mockAssetsFindFirst.mockResolvedValue(asset)
      const updated = { ...asset, name: 'Updated Monitor' }
      const returning = vi.fn().mockResolvedValue([updated])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.update(
        'asset-1',
        { name: 'Updated Monitor' },
        'admin-1',
        'admin',
      )

      expect(result).toEqual(updated)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('manager can update any asset', async () => {
      const asset = { id: 'asset-1', createdBy: 'other-user', deletedAt: null }
      mockAssetsFindFirst.mockResolvedValue(asset)
      const updated = { ...asset, status: 'in_use' }
      const returning = vi.fn().mockResolvedValue([updated])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.update('asset-1', { status: 'in_use' }, 'mgr-1', 'manager')

      expect(result).toEqual(updated)
    })

    it('member can update own asset', async () => {
      const asset = { id: 'asset-1', createdBy: 'user-1', deletedAt: null }
      mockAssetsFindFirst.mockResolvedValue(asset)
      const updated = { ...asset, notes: 'Needs repair' }
      const returning = vi.fn().mockResolvedValue([updated])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.update('asset-1', { notes: 'Needs repair' }, 'user-1', 'member')

      expect(result).toEqual(updated)
    })

    it("member cannot update another user's asset", async () => {
      const asset = { id: 'asset-1', createdBy: 'other-user', deletedAt: null }
      mockAssetsFindFirst.mockResolvedValue(asset)

      const result = await service.update('asset-1', { name: 'Stolen' }, 'user-1', 'member')

      expect(result).toEqual({ error: 'Asset not found' })
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('returns error when asset not found', async () => {
      mockAssetsFindFirst.mockResolvedValue(undefined)

      const result = await service.update('nonexistent', { name: 'X' }, 'user-1', 'admin')

      expect(result).toEqual({ error: 'Asset not found' })
    })
  })

  describe('list with filters', () => {
    it('filters by projectId', async () => {
      mockAssetsFindMany.mockResolvedValue([{ id: 'asset-1', projectId: 'proj-1' }])

      const result = await service.list({ page: 1, limit: 25, projectId: 'proj-1' })

      expect(result).toHaveLength(1)
      expect(mockAssetsFindMany).toHaveBeenCalled()
    })

    it('filters by clientId', async () => {
      mockAssetsFindMany.mockResolvedValue([{ id: 'asset-1', clientId: 'client-1' }])

      const result = await service.list({ page: 1, limit: 25, clientId: 'client-1' })

      expect(result).toHaveLength(1)
      expect(mockAssetsFindMany).toHaveBeenCalled()
    })
  })

  describe('getExpensesForAsset', () => {
    it('returns expenses linked to the asset', async () => {
      const asset = { id: 'asset-1', name: 'MacBook', deletedAt: null }
      mockAssetsFindFirst.mockResolvedValue(asset)

      const linkedExpenses = [
        { id: 'exp-1', assetId: 'asset-1', amountCents: 150000 },
        { id: 'exp-2', assetId: 'asset-1', amountCents: 5000 },
      ]
      mockExpensesFindMany.mockResolvedValue(linkedExpenses)

      const result = await service.getExpensesForAsset('asset-1')

      expect(result).toEqual(linkedExpenses)
      expect(mockExpensesFindMany).toHaveBeenCalled()
    })

    it('returns null when asset not found', async () => {
      mockAssetsFindFirst.mockResolvedValue(undefined)

      const result = await service.getExpensesForAsset('nonexistent')

      expect(result).toBeNull()
    })

    it('returns empty array when asset has no expenses', async () => {
      const asset = { id: 'asset-1', name: 'MacBook', deletedAt: null }
      mockAssetsFindFirst.mockResolvedValue(asset)
      mockExpensesFindMany.mockResolvedValue([])

      const result = await service.getExpensesForAsset('asset-1')

      expect(result).toEqual([])
    })
  })

  describe('delete', () => {
    it('admin can soft-delete any asset', async () => {
      const asset = { id: 'asset-1', createdBy: 'other-user', deletedAt: null }
      mockAssetsFindFirst.mockResolvedValue(asset)
      const returning = vi.fn().mockResolvedValue([{ ...asset, deletedAt: new Date() }])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.delete('asset-1', 'admin-1', 'admin')

      expect(result).toBe(true)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('member can soft-delete own asset', async () => {
      const asset = { id: 'asset-1', createdBy: 'user-1', deletedAt: null }
      mockAssetsFindFirst.mockResolvedValue(asset)
      const returning = vi.fn().mockResolvedValue([{ ...asset, deletedAt: new Date() }])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.delete('asset-1', 'user-1', 'member')

      expect(result).toBe(true)
    })

    it("member cannot delete another user's asset", async () => {
      const asset = { id: 'asset-1', createdBy: 'other-user', deletedAt: null }
      mockAssetsFindFirst.mockResolvedValue(asset)

      const result = await service.delete('asset-1', 'user-1', 'member')

      expect(result).toBe(false)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('returns false when asset not found', async () => {
      mockAssetsFindFirst.mockResolvedValue(undefined)

      const result = await service.delete('nonexistent', 'user-1', 'admin')

      expect(result).toBe(false)
    })
  })
})
