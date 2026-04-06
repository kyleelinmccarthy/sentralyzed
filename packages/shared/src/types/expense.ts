export const EXPENSE_CATEGORIES = [
  'advertising',
  'bank_fees',
  'contract_labor',
  'education_training',
  'equipment',
  'insurance',
  'meals',
  'office_supplies',
  'professional_services',
  'rent_lease',
  'software_subscriptions',
  'taxes_licenses',
  'travel',
  'utilities',
  'wages',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const EXPENSE_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number]

export const BUDGET_PERIODS = ['monthly', 'quarterly', 'yearly'] as const
export type BudgetPeriod = (typeof BUDGET_PERIODS)[number]

export interface Expense {
  id: string
  description: string
  amountCents: number
  currency: string
  category: ExpenseCategory
  customLabel: string | null
  receiptUrl: string | null
  projectId: string | null
  clientId: string | null
  budgetId: string | null
  assetId: string | null
  taxDeductible: boolean
  date: string
  vendor: string | null
  notes: string | null
  status: ExpenseStatus
  submittedBy: string
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  name: string
  amountCents: number
  periodType: BudgetPeriod
  category: ExpenseCategory | null
  projectId: string | null
  clientId: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface BudgetWithSpent extends Budget {
  spentCents: number
  remainingCents: number
}

export interface ExpenseSummary {
  totalCents: number
  byCategory: Partial<Record<ExpenseCategory, number>>
  taxDeductibleCents: number
  nonDeductibleCents: number
  count: number
}
