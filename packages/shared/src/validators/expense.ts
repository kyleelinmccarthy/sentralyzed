import { z } from 'zod'
import { EXPENSE_CATEGORIES, BUDGET_PERIODS } from '../types/expense.js'

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  amountCents: z.number().int().positive('Amount must be positive'),
  currency: z.string().length(3).default('USD'),
  category: z.enum(EXPENSE_CATEGORIES),
  customLabel: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
  projectId: z.string().uuid().optional(),
  taxDeductible: z.boolean().default(true),
  date: z.string().date(),
  vendor: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
})

export const updateExpenseSchema = createExpenseSchema.partial()

export const reviewExpenseSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500).optional(),
})

export const expenseQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  projectId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  submittedBy: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
})

export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  amountCents: z.number().int().positive('Amount must be positive'),
  periodType: z.enum(BUDGET_PERIODS),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  projectId: z.string().uuid().optional(),
})

export const updateBudgetSchema = createBudgetSchema.partial()

export const reportQuerySchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
  projectId: z.string().uuid().optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type ReviewExpenseInput = z.infer<typeof reviewExpenseSchema>
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type ReportQueryInput = z.infer<typeof reportQuerySchema>
