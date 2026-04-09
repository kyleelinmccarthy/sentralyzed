import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { Context, Next } from 'hono'

// Mock auth middleware — default user is a member
const mockUser = { id: 'user-1', role: 'member' }
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: Context, next: Next) => {
    c.set('user', { ...mockUser })
    await next()
  }),
  requireRole:
    (...roles: string[]) =>
    async (c: Context, next: Next) => {
      const user = c.get('user')
      if (!user) return c.json({ error: 'Unauthorized' }, 401)
      if (!roles.includes(user.role)) return c.json({ error: 'Forbidden' }, 403)
      await next()
    },
}))

// Mock expenses service
const mockCreate = vi.fn()
const mockGetById = vi.fn()
const mockList = vi.fn()
const mockUpdate = vi.fn()
const mockDeleteExpense = vi.fn()
const mockReview = vi.fn()
const mockGetSummary = vi.fn()
const mockCreateBudget = vi.fn()
const mockListBudgets = vi.fn()
const mockUpdateBudget = vi.fn()
const mockDeleteBudget = vi.fn()
const mockGetBudgetWithSpent = vi.fn()

vi.mock('../services/expenses.service.js', () => ({
  expensesService: {
    create: mockCreate,
    getById: mockGetById,
    list: mockList,
    update: mockUpdate,
    delete: mockDeleteExpense,
    review: mockReview,
    getSummary: mockGetSummary,
    createBudget: mockCreateBudget,
    listBudgets: mockListBudgets,
    updateBudget: mockUpdateBudget,
    deleteBudget: mockDeleteBudget,
    getBudgetWithSpent: mockGetBudgetWithSpent,
  },
}))

const { expensesRouter } = await import('../routes/expenses/index.js')

const app = new Hono()
app.route('/expenses', expensesRouter)

const validExpenseBody = {
  description: 'Office supplies',
  amountCents: 5000,
  category: 'office_supplies',
  date: '2026-03-15',
}

describe('Expenses Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.id = 'user-1'
    mockUser.role = 'member'
  })

  // --- Expense CRUD ---

  describe('POST /expenses', () => {
    it('creates an expense and returns 201', async () => {
      const expense = { id: 'exp-1', ...validExpenseBody, status: 'pending' }
      mockCreate.mockResolvedValue(expense)

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validExpenseBody),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.expense).toEqual(expense)
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining(validExpenseBody), 'user-1')
    })

    it('creates an expense with assetId', async () => {
      const expense = {
        id: 'exp-2',
        ...validExpenseBody,
        assetId: '00000000-0000-0000-0000-000000000001',
        status: 'pending',
      }
      mockCreate.mockResolvedValue(expense)

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validExpenseBody,
          assetId: '00000000-0000-0000-0000-000000000001',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.expense.assetId).toBe('00000000-0000-0000-0000-000000000001')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ assetId: '00000000-0000-0000-0000-000000000001' }),
        'user-1',
      )
    })

    it('rejects missing description with 400', async () => {
      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: 5000, category: 'meals', date: '2026-03-15' }),
      })

      expect(res.status).toBe(400)
    })

    it('rejects negative amount with 400', async () => {
      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validExpenseBody, amountCents: -100 }),
      })

      expect(res.status).toBe(400)
    })

    it('rejects invalid category with 400', async () => {
      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validExpenseBody, category: 'invalid_cat' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /expenses', () => {
    it('returns expenses list', async () => {
      const expenses = [{ id: 'exp-1' }, { id: 'exp-2' }]
      mockList.mockResolvedValue(expenses)

      const res = await app.request('/expenses')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.expenses).toEqual(expenses)
    })
  })

  describe('GET /expenses/:id', () => {
    it('returns an expense', async () => {
      const expense = { id: 'exp-1', description: 'Test' }
      mockGetById.mockResolvedValue(expense)

      const res = await app.request('/expenses/exp-1')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.expense).toEqual(expense)
    })

    it('returns 404 when not found', async () => {
      mockGetById.mockResolvedValue(null)

      const res = await app.request('/expenses/nonexistent')

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /expenses/:id', () => {
    it('updates an expense', async () => {
      const updated = { id: 'exp-1', description: 'Updated' }
      mockUpdate.mockResolvedValue(updated)

      const res = await app.request('/expenses/exp-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Updated' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.expense).toEqual(updated)
    })

    it('returns 400 when service returns error', async () => {
      mockUpdate.mockResolvedValue({ error: 'Can only update pending expenses' })

      const res = await app.request('/expenses/exp-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Updated' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /expenses/:id', () => {
    it('deletes an expense', async () => {
      mockDeleteExpense.mockResolvedValue(true)

      const res = await app.request('/expenses/exp-1', { method: 'DELETE' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
    })

    it('returns 404 when not deletable', async () => {
      mockDeleteExpense.mockResolvedValue(false)

      const res = await app.request('/expenses/exp-1', { method: 'DELETE' })

      expect(res.status).toBe(404)
    })
  })

  // --- Review (manager/admin only) ---

  describe('POST /expenses/:id/review', () => {
    it('approves an expense as manager', async () => {
      mockUser.role = 'manager'
      const reviewed = { id: 'exp-1', status: 'approved' }
      mockReview.mockResolvedValue(reviewed)

      const res = await app.request('/expenses/exp-1/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.expense).toEqual(reviewed)
    })

    it('returns 403 for member', async () => {
      mockUser.role = 'member'

      const res = await app.request('/expenses/exp-1/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })

      expect(res.status).toBe(403)
    })

    it('returns 400 when service returns error', async () => {
      mockUser.role = 'admin'
      mockReview.mockResolvedValue({ error: 'Expense has already been reviewed' })

      const res = await app.request('/expenses/exp-1/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })

      expect(res.status).toBe(400)
    })
  })

  // --- Reports (manager/admin only) ---

  describe('GET /expenses/reports/summary', () => {
    it('returns summary for admin', async () => {
      mockUser.role = 'admin'
      const summary = { totalCents: 50000, count: 5 }
      mockGetSummary.mockResolvedValue(summary)

      const res = await app.request(
        '/expenses/reports/summary?startDate=2026-01-01&endDate=2026-12-31',
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.summary).toEqual(summary)
    })

    it('returns 403 for member', async () => {
      mockUser.role = 'member'

      const res = await app.request(
        '/expenses/reports/summary?startDate=2026-01-01&endDate=2026-12-31',
      )

      expect(res.status).toBe(403)
    })
  })

  // --- Budget CRUD ---

  describe('POST /expenses/budgets', () => {
    it('creates a budget as admin', async () => {
      mockUser.role = 'admin'
      const budget = { id: 'budget-1', name: 'Software' }
      mockCreateBudget.mockResolvedValue(budget)

      const res = await app.request('/expenses/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Software',
          amountCents: 50000,
          periodType: 'monthly',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.budget).toEqual(budget)
    })

    it('returns 403 for member', async () => {
      mockUser.role = 'member'

      const res = await app.request('/expenses/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Software',
          amountCents: 50000,
          periodType: 'monthly',
        }),
      })

      expect(res.status).toBe(403)
    })
  })

  describe('GET /expenses/budgets', () => {
    it('returns budgets for any user', async () => {
      const budgets = [{ id: 'budget-1' }]
      mockListBudgets.mockResolvedValue(budgets)

      const res = await app.request('/expenses/budgets')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.budgets).toEqual(budgets)
    })
  })

  describe('PATCH /expenses/budgets/:id', () => {
    it('updates a budget as manager', async () => {
      mockUser.role = 'manager'
      const updated = { id: 'budget-1', name: 'Updated' }
      mockUpdateBudget.mockResolvedValue(updated)

      const res = await app.request('/expenses/budgets/budget-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.budget).toEqual(updated)
    })

    it('returns 404 when budget not found', async () => {
      mockUser.role = 'admin'
      mockUpdateBudget.mockResolvedValue(null)

      const res = await app.request('/expenses/budgets/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /expenses/budgets/:id', () => {
    it('deletes a budget as admin', async () => {
      mockUser.role = 'admin'
      mockDeleteBudget.mockResolvedValue(true)

      const res = await app.request('/expenses/budgets/budget-1', { method: 'DELETE' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
    })

    it('returns 404 when budget not found', async () => {
      mockUser.role = 'admin'
      mockDeleteBudget.mockResolvedValue(false)

      const res = await app.request('/expenses/budgets/nonexistent', { method: 'DELETE' })

      expect(res.status).toBe(404)
    })

    it('returns 403 for member', async () => {
      mockUser.role = 'member'

      const res = await app.request('/expenses/budgets/budget-1', { method: 'DELETE' })

      expect(res.status).toBe(403)
    })
  })

  describe('GET /expenses/budgets/:id/spending', () => {
    it('returns budget with spent amounts', async () => {
      const budgetWithSpent = {
        id: 'budget-1',
        name: 'Software',
        amountCents: 50000,
        spentCents: 20000,
        remainingCents: 30000,
      }
      mockGetBudgetWithSpent.mockResolvedValue(budgetWithSpent)

      const res = await app.request('/expenses/budgets/budget-1/spending')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.budget).toEqual(budgetWithSpent)
      expect(body.budget.spentCents).toBe(20000)
      expect(body.budget.remainingCents).toBe(30000)
    })

    it('returns 404 when budget not found', async () => {
      mockGetBudgetWithSpent.mockResolvedValue(null)

      const res = await app.request('/expenses/budgets/nonexistent/spending')

      expect(res.status).toBe(404)
    })
  })
})
