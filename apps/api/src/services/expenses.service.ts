import { eq, and, gte, lte, isNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { expenses, budgets } from '../db/schema/expenses.js'
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ReviewExpenseInput,
  ExpenseQueryInput,
  CreateBudgetInput,
  UpdateBudgetInput,
  ReportQueryInput,
} from '@sentral/shared/validators/expense'
import type {
  ExpenseSummary,
  ExpenseCategory,
  BudgetWithSpent,
} from '@sentral/shared/types/expense'
import { whereActiveById, softDelete, canAccessAsOwner } from './utils/db-helpers.js'

type Role = 'admin' | 'manager' | 'member'

export class ExpensesService {
  async create(input: CreateExpenseInput, userId: string) {
    const [expense] = await db
      .insert(expenses)
      .values({
        ...input,
        submittedBy: userId,
        status: 'pending',
      })
      .returning()
    return expense!
  }

  async getById(id: string, userId: string, role: Role) {
    const expense = await db.query.expenses.findFirst({
      where: whereActiveById(expenses.id, id, expenses.deletedAt),
    })
    if (!expense) return null
    if (!canAccessAsOwner(role, expense.submittedBy, userId)) return null
    return expense
  }

  async list(query: ExpenseQueryInput, userId: string, role: Role) {
    const conditions = [isNull(expenses.deletedAt)]

    if (role === 'member') {
      conditions.push(eq(expenses.submittedBy, userId))
    } else if (query.submittedBy) {
      conditions.push(eq(expenses.submittedBy, query.submittedBy))
    }

    if (query.status) conditions.push(eq(expenses.status, query.status))
    if (query.category) conditions.push(eq(expenses.category, query.category))
    if (query.projectId) conditions.push(eq(expenses.projectId, query.projectId))
    if (query.clientId) conditions.push(eq(expenses.clientId, query.clientId))
    if (query.budgetId) conditions.push(eq(expenses.budgetId, query.budgetId))
    if (query.assetId) conditions.push(eq(expenses.assetId, query.assetId))
    if (query.startDate) conditions.push(gte(expenses.date, query.startDate))
    if (query.endDate) conditions.push(lte(expenses.date, query.endDate))

    return db.query.expenses.findMany({
      where: and(...conditions),
      orderBy: (e, { desc }) => [desc(e.createdAt)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    })
  }

  async update(id: string, input: UpdateExpenseInput, userId: string) {
    const expense = await db.query.expenses.findFirst({
      where: whereActiveById(expenses.id, id, expenses.deletedAt),
    })
    if (!expense || expense.submittedBy !== userId) return { error: 'Expense not found' }
    if (expense.status !== 'pending') return { error: 'Can only update pending expenses' }

    const [updated] = await db.update(expenses).set(input).where(eq(expenses.id, id)).returning()
    return updated!
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const expense = await db.query.expenses.findFirst({
      where: whereActiveById(expenses.id, id, expenses.deletedAt),
    })
    if (!expense || expense.submittedBy !== userId || expense.status !== 'pending') return false

    await softDelete(expenses, expenses.id, id)
    return true
  }

  async review(id: string, input: ReviewExpenseInput, reviewerId: string) {
    const expense = await db.query.expenses.findFirst({
      where: whereActiveById(expenses.id, id, expenses.deletedAt),
    })
    if (!expense) return { error: 'Expense not found' }
    if (expense.status !== 'pending') return { error: 'Expense has already been reviewed' }

    const [updated] = await db
      .update(expenses)
      .set({
        status: input.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: input.rejectionReason ?? null,
      })
      .where(eq(expenses.id, id))
      .returning()
    return updated!
  }

  async getSummary(query: ReportQueryInput): Promise<ExpenseSummary> {
    const conditions = [
      eq(expenses.status, 'approved'),
      isNull(expenses.deletedAt),
      gte(expenses.date, query.startDate),
      lte(expenses.date, query.endDate),
    ]
    if (query.projectId) conditions.push(eq(expenses.projectId, query.projectId))
    if (query.clientId) conditions.push(eq(expenses.clientId, query.clientId))
    if (query.budgetId) conditions.push(eq(expenses.budgetId, query.budgetId))

    const rows = await db.query.expenses.findMany({
      where: and(...conditions),
    })

    const byCategory: Partial<Record<ExpenseCategory, number>> = {}
    let taxDeductibleCents = 0
    let nonDeductibleCents = 0

    for (const row of rows) {
      const cat = row.category as ExpenseCategory
      byCategory[cat] = (byCategory[cat] ?? 0) + row.amountCents
      if (row.taxDeductible) {
        taxDeductibleCents += row.amountCents
      } else {
        nonDeductibleCents += row.amountCents
      }
    }

    return {
      totalCents: taxDeductibleCents + nonDeductibleCents,
      byCategory,
      taxDeductibleCents,
      nonDeductibleCents,
      count: rows.length,
    }
  }

  async createBudget(input: CreateBudgetInput, userId: string) {
    const [budget] = await db
      .insert(budgets)
      .values({
        ...input,
        createdBy: userId,
      })
      .returning()
    return budget!
  }

  async listBudgets() {
    return db.query.budgets.findMany({
      where: isNull(budgets.deletedAt),
    })
  }

  async updateBudget(id: string, input: UpdateBudgetInput) {
    const budget = await db.query.budgets.findFirst({
      where: whereActiveById(budgets.id, id, budgets.deletedAt),
    })
    if (!budget) return null

    const [updated] = await db.update(budgets).set(input).where(eq(budgets.id, id)).returning()
    return updated!
  }

  async deleteBudget(id: string): Promise<boolean> {
    const budget = await db.query.budgets.findFirst({
      where: whereActiveById(budgets.id, id, budgets.deletedAt),
    })
    if (!budget) return false

    await softDelete(budgets, budgets.id, id)
    return true
  }

  async getBudgetWithSpent(id: string): Promise<BudgetWithSpent | null> {
    const budget = await db.query.budgets.findFirst({
      where: whereActiveById(budgets.id, id, budgets.deletedAt),
    })
    if (!budget) return null

    const linkedExpenses = await db.query.expenses.findMany({
      where: and(
        eq(expenses.budgetId, id),
        eq(expenses.status, 'approved'),
        isNull(expenses.deletedAt),
      ),
    })

    const spentCents = linkedExpenses.reduce((sum, e) => sum + e.amountCents, 0)

    return {
      ...budget,
      spentCents,
      remainingCents: budget.amountCents - spentCents,
    } as BudgetWithSpent
  }
}

export const expensesService = new ExpensesService()
