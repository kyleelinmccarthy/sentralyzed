import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware, requireRole } from '../../middleware/auth.js'
import { expensesService } from '../../services/expenses.service.js'
import {
  createExpenseSchema,
  updateExpenseSchema,
  reviewExpenseSchema,
  expenseQuerySchema,
  createBudgetSchema,
  updateBudgetSchema,
  reportQuerySchema,
} from '@sentralyzed/shared/validators/expense'
import type { AppEnv } from '../../types.js'

const expensesRouter = new Hono<AppEnv>()
expensesRouter.use('*', authMiddleware)

// --- Reports (must be before /:id to avoid collision) ---

expensesRouter.get(
  '/reports/summary',
  requireRole('admin', 'manager'),
  zValidator('query', reportQuerySchema),
  async (c) => {
    const query = c.req.valid('query')
    const summary = await expensesService.getSummary(query)
    return c.json({ summary })
  },
)

// --- Budgets (must be before /:id to avoid collision) ---

expensesRouter.post(
  '/budgets',
  requireRole('admin', 'manager'),
  zValidator('json', createBudgetSchema),
  async (c) => {
    const user = c.get('user')
    const budget = await expensesService.createBudget(c.req.valid('json'), user.id)
    return c.json({ budget }, 201)
  },
)

expensesRouter.get('/budgets', async (c) => {
  const budgets = await expensesService.listBudgets()
  return c.json({ budgets })
})

expensesRouter.patch(
  '/budgets/:id',
  requireRole('admin', 'manager'),
  zValidator('json', updateBudgetSchema),
  async (c) => {
    const budget = await expensesService.updateBudget(c.req.param('id'), c.req.valid('json'))
    if (!budget) return c.json({ error: 'Budget not found' }, 404)
    return c.json({ budget })
  },
)

expensesRouter.get('/budgets/:id/spending', async (c) => {
  const budget = await expensesService.getBudgetWithSpent(c.req.param('id'))
  if (!budget) return c.json({ error: 'Budget not found' }, 404)
  return c.json({ budget })
})

expensesRouter.delete('/budgets/:id', requireRole('admin', 'manager'), async (c) => {
  const ok = await expensesService.deleteBudget(c.req.param('id') as string)
  if (!ok) return c.json({ error: 'Budget not found' }, 404)
  return c.json({ ok: true })
})

// --- Expense CRUD ---

expensesRouter.post('/', zValidator('json', createExpenseSchema), async (c) => {
  const user = c.get('user')
  const expense = await expensesService.create(c.req.valid('json'), user.id)
  return c.json({ expense }, 201)
})

expensesRouter.get('/', zValidator('query', expenseQuerySchema), async (c) => {
  const user = c.get('user')
  const query = c.req.valid('query')
  const expenses = await expensesService.list(query, user.id, user.role)
  return c.json({ expenses })
})

expensesRouter.get('/:id', async (c) => {
  const user = c.get('user')
  const expense = await expensesService.getById(c.req.param('id'), user.id, user.role)
  if (!expense) return c.json({ error: 'Expense not found' }, 404)
  return c.json({ expense })
})

expensesRouter.patch('/:id', zValidator('json', updateExpenseSchema), async (c) => {
  const user = c.get('user')
  const result = await expensesService.update(c.req.param('id'), c.req.valid('json'), user.id)
  if ('error' in result) return c.json({ error: result.error }, 400)
  return c.json({ expense: result })
})

expensesRouter.delete('/:id', async (c) => {
  const user = c.get('user')
  const ok = await expensesService.delete(c.req.param('id'), user.id)
  if (!ok) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ ok: true })
})

expensesRouter.post(
  '/:id/review',
  requireRole('admin', 'manager'),
  zValidator('json', reviewExpenseSchema),
  async (c) => {
    const user = c.get('user')
    const result = await expensesService.review(c.req.param('id'), c.req.valid('json'), user.id)
    if ('error' in result) return c.json({ error: result.error }, 400)
    return c.json({ expense: result })
  },
)

export { expensesRouter }
