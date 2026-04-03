import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database module before importing the service
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockSelect = vi.fn()
const mockExpensesFindMany = vi.fn()
const mockExpensesFindFirst = vi.fn()
const mockBudgetsFindMany = vi.fn()
const mockBudgetsFindFirst = vi.fn()

vi.mock('../db/index.js', () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    select: mockSelect,
    query: {
      expenses: {
        findMany: mockExpensesFindMany,
        findFirst: mockExpensesFindFirst,
      },
      budgets: {
        findMany: mockBudgetsFindMany,
        findFirst: mockBudgetsFindFirst,
      },
    },
  },
}))

// Must import after mocks
const { ExpensesService } = await import('../services/expenses.service.js')

describe('ExpensesService', () => {
  let service: InstanceType<typeof ExpensesService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ExpensesService()
  })

  // --- Expense CRUD ---

  describe('create', () => {
    it('inserts an expense with status pending and submittedBy set', async () => {
      const expense = {
        id: 'exp-1',
        description: 'Office chairs',
        amountCents: 45000,
        currency: 'USD',
        category: 'office_supplies',
        status: 'pending',
        submittedBy: 'user-1',
        date: '2026-03-15',
        taxDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const returning = vi.fn().mockResolvedValue([expense])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })

      const result = await service.create(
        {
          description: 'Office chairs',
          amountCents: 45000,
          category: 'office_supplies',
          date: '2026-03-15',
          taxDeductible: true,
        },
        'user-1',
      )

      expect(result).toEqual(expense)
      expect(mockInsert).toHaveBeenCalled()
      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Office chairs',
          amountCents: 45000,
          category: 'office_supplies',
          submittedBy: 'user-1',
          status: 'pending',
        }),
      )
    })
  })

  describe('getById', () => {
    const expense = {
      id: 'exp-1',
      submittedBy: 'user-1',
      status: 'pending',
      deletedAt: null,
    }

    it('returns the expense for the owner', async () => {
      mockExpensesFindFirst.mockResolvedValue(expense)

      const result = await service.getById('exp-1', 'user-1', 'member')

      expect(result).toEqual(expense)
    })

    it('returns the expense for admin regardless of ownership', async () => {
      mockExpensesFindFirst.mockResolvedValue(expense)

      const result = await service.getById('exp-1', 'other-user', 'admin')

      expect(result).toEqual(expense)
    })

    it('returns null for non-owner member', async () => {
      mockExpensesFindFirst.mockResolvedValue(expense)

      const result = await service.getById('exp-1', 'other-user', 'member')

      expect(result).toBeNull()
    })

    it('returns null when expense not found', async () => {
      mockExpensesFindFirst.mockResolvedValue(undefined)

      const result = await service.getById('nonexistent', 'user-1', 'admin')

      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('returns paginated expenses', async () => {
      const expenses = [{ id: 'exp-1' }, { id: 'exp-2' }]
      mockExpensesFindMany.mockResolvedValue(expenses)

      const result = await service.list({ page: 1, limit: 25 }, 'user-1', 'admin')

      expect(result).toEqual(expenses)
      expect(mockExpensesFindMany).toHaveBeenCalled()
    })

    it('filters by member — only returns own expenses', async () => {
      const ownExpenses = [{ id: 'exp-1', submittedBy: 'user-1' }]
      mockExpensesFindMany.mockResolvedValue(ownExpenses)

      const result = await service.list({ page: 1, limit: 25 }, 'user-1', 'member')

      expect(result).toEqual(ownExpenses)
      expect(mockExpensesFindMany).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('updates own pending expense', async () => {
      const expense = { id: 'exp-1', submittedBy: 'user-1', status: 'pending', deletedAt: null }
      mockExpensesFindFirst.mockResolvedValue(expense)
      const updated = { ...expense, description: 'Updated' }
      const returning = vi.fn().mockResolvedValue([updated])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.update('exp-1', { description: 'Updated' }, 'user-1')

      expect(result).toEqual(updated)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('returns error when expense is already approved', async () => {
      const expense = { id: 'exp-1', submittedBy: 'user-1', status: 'approved', deletedAt: null }
      mockExpensesFindFirst.mockResolvedValue(expense)

      const result = await service.update('exp-1', { description: 'Updated' }, 'user-1')

      expect(result).toEqual({ error: 'Can only update pending expenses' })
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('returns error when user is not the owner', async () => {
      const expense = { id: 'exp-1', submittedBy: 'other-user', status: 'pending', deletedAt: null }
      mockExpensesFindFirst.mockResolvedValue(expense)

      const result = await service.update('exp-1', { description: 'Updated' }, 'user-1')

      expect(result).toEqual({ error: 'Expense not found' })
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('soft-deletes own pending expense', async () => {
      const expense = { id: 'exp-1', submittedBy: 'user-1', status: 'pending', deletedAt: null }
      mockExpensesFindFirst.mockResolvedValue(expense)
      const returning = vi.fn().mockResolvedValue([{ ...expense, deletedAt: new Date() }])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.delete('exp-1', 'user-1')

      expect(result).toBe(true)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('returns false for non-pending expense', async () => {
      const expense = { id: 'exp-1', submittedBy: 'user-1', status: 'approved', deletedAt: null }
      mockExpensesFindFirst.mockResolvedValue(expense)

      const result = await service.delete('exp-1', 'user-1')

      expect(result).toBe(false)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('returns false when not owner', async () => {
      const expense = { id: 'exp-1', submittedBy: 'other-user', status: 'pending', deletedAt: null }
      mockExpensesFindFirst.mockResolvedValue(expense)

      const result = await service.delete('exp-1', 'user-1')

      expect(result).toBe(false)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('review', () => {
    it('approves a pending expense', async () => {
      const expense = { id: 'exp-1', status: 'pending', deletedAt: null }
      mockExpensesFindFirst.mockResolvedValue(expense)
      const reviewed = {
        ...expense,
        status: 'approved',
        reviewedBy: 'admin-1',
        reviewedAt: new Date(),
      }
      const returning = vi.fn().mockResolvedValue([reviewed])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.review('exp-1', { status: 'approved' }, 'admin-1')

      expect(result).toEqual(reviewed)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('rejects with reason', async () => {
      const expense = { id: 'exp-1', status: 'pending', deletedAt: null }
      mockExpensesFindFirst.mockResolvedValue(expense)
      const reviewed = {
        ...expense,
        status: 'rejected',
        reviewedBy: 'admin-1',
        reviewedAt: new Date(),
        rejectionReason: 'Not a business expense',
      }
      const returning = vi.fn().mockResolvedValue([reviewed])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.review(
        'exp-1',
        { status: 'rejected', rejectionReason: 'Not a business expense' },
        'admin-1',
      )

      expect(result).toEqual(reviewed)
    })

    it('returns error when expense is not pending', async () => {
      const expense = { id: 'exp-1', status: 'approved', deletedAt: null }
      mockExpensesFindFirst.mockResolvedValue(expense)

      const result = await service.review('exp-1', { status: 'approved' }, 'admin-1')

      expect(result).toEqual({ error: 'Expense has already been reviewed' })
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('returns error when expense not found', async () => {
      mockExpensesFindFirst.mockResolvedValue(undefined)

      const result = await service.review('nonexistent', { status: 'approved' }, 'admin-1')

      expect(result).toEqual({ error: 'Expense not found' })
    })
  })

  // --- Budget CRUD ---

  describe('createBudget', () => {
    it('inserts a budget and returns it', async () => {
      const budget = {
        id: 'budget-1',
        name: 'Software Budget',
        amountCents: 50000,
        periodType: 'monthly',
        category: 'software_subscriptions',
        projectId: null,
        createdBy: 'admin-1',
      }
      const returning = vi.fn().mockResolvedValue([budget])
      const values = vi.fn().mockReturnValue({ returning })
      mockInsert.mockReturnValue({ values })

      const result = await service.createBudget(
        {
          name: 'Software Budget',
          amountCents: 50000,
          periodType: 'monthly',
          category: 'software_subscriptions',
        },
        'admin-1',
      )

      expect(result).toEqual(budget)
      expect(mockInsert).toHaveBeenCalled()
    })
  })

  describe('listBudgets', () => {
    it('returns all active budgets', async () => {
      const budgets = [
        { id: 'budget-1', name: 'Software', deletedAt: null },
        { id: 'budget-2', name: 'Travel', deletedAt: null },
      ]
      mockBudgetsFindMany.mockResolvedValue(budgets)

      const result = await service.listBudgets()

      expect(result).toEqual(budgets)
      expect(mockBudgetsFindMany).toHaveBeenCalled()
    })
  })

  describe('updateBudget', () => {
    it('updates a budget', async () => {
      const budget = { id: 'budget-1', deletedAt: null }
      mockBudgetsFindFirst.mockResolvedValue(budget)
      const updated = { ...budget, name: 'Updated Budget' }
      const returning = vi.fn().mockResolvedValue([updated])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.updateBudget('budget-1', { name: 'Updated Budget' })

      expect(result).toEqual(updated)
    })

    it('returns null when budget not found', async () => {
      mockBudgetsFindFirst.mockResolvedValue(undefined)

      const result = await service.updateBudget('nonexistent', { name: 'Updated' })

      expect(result).toBeNull()
    })
  })

  describe('deleteBudget', () => {
    it('soft-deletes a budget', async () => {
      const budget = { id: 'budget-1', deletedAt: null }
      mockBudgetsFindFirst.mockResolvedValue(budget)
      const returning = vi.fn().mockResolvedValue([{ ...budget, deletedAt: new Date() }])
      const where = vi.fn().mockReturnValue({ returning })
      const set = vi.fn().mockReturnValue({ where })
      mockUpdate.mockReturnValue({ set })

      const result = await service.deleteBudget('budget-1')

      expect(result).toBe(true)
    })

    it('returns false when budget not found', async () => {
      mockBudgetsFindFirst.mockResolvedValue(undefined)

      const result = await service.deleteBudget('nonexistent')

      expect(result).toBe(false)
    })
  })

  // --- Reports ---

  describe('getSummary', () => {
    it('returns aggregated summary of approved expenses', async () => {
      const approvedExpenses = [
        { amountCents: 10000, category: 'software_subscriptions', taxDeductible: true },
        { amountCents: 5000, category: 'meals', taxDeductible: true },
        { amountCents: 3000, category: 'meals', taxDeductible: false },
      ]
      mockExpensesFindMany.mockResolvedValue(approvedExpenses)

      const result = await service.getSummary({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      })

      expect(result.totalCents).toBe(18000)
      expect(result.taxDeductibleCents).toBe(15000)
      expect(result.nonDeductibleCents).toBe(3000)
      expect(result.byCategory.software_subscriptions).toBe(10000)
      expect(result.byCategory.meals).toBe(8000)
      expect(result.count).toBe(3)
    })

    it('returns empty summary when no expenses found', async () => {
      mockExpensesFindMany.mockResolvedValue([])

      const result = await service.getSummary({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      })

      expect(result.totalCents).toBe(0)
      expect(result.taxDeductibleCents).toBe(0)
      expect(result.nonDeductibleCents).toBe(0)
      expect(result.count).toBe(0)
    })
  })
})
