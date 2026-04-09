import type {
  ExpenseCategory,
  ExpenseStatus,
  ExpenseFrequency,
  BudgetPeriod,
} from '@sentral/shared/types/expense'
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES, BUDGET_PERIODS } from '@sentral/shared/types/expense'

export function formatCents(amountCents: number): string {
  const dollars = amountCents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars)
}

export function parseDollarsToCents(dollars: string): number {
  const cleaned = dollars.replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(cleaned)
  if (isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

function toLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c, toLabel(c)]),
) as Record<ExpenseCategory, string>

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  advertising: 'bg-blue/10 text-blue',
  bank_fees: 'bg-slate-gray/10 text-slate-gray',
  contract_labor: 'bg-indigo/10 text-indigo',
  education_training: 'bg-teal/10 text-teal',
  equipment: 'bg-amber/10 text-amber',
  insurance: 'bg-french-gray/10 text-french-gray',
  legal: 'bg-amber/10 text-amber',
  meals: 'bg-coral/10 text-coral',
  office_supplies: 'bg-indigo/10 text-indigo',
  operating: 'bg-teal/10 text-teal',
  professional_services: 'bg-blue/10 text-blue',
  rent_lease: 'bg-slate-gray/10 text-slate-gray',
  software_subscriptions: 'bg-teal/10 text-teal',
  taxes_licenses: 'bg-amber/10 text-amber',
  travel: 'bg-coral/10 text-coral',
  utilities: 'bg-french-gray/10 text-french-gray',
  wages: 'bg-indigo/10 text-indigo',
  other: 'bg-slate-gray/10 text-slate-gray',
}

export const STATUS_LABELS: Record<ExpenseStatus, string> = Object.fromEntries(
  EXPENSE_STATUSES.map((s) => [s, toLabel(s)]),
) as Record<ExpenseStatus, string>

export const STATUS_COLORS: Record<ExpenseStatus, string> = {
  pending: 'bg-amber/10 text-amber',
  approved: 'bg-teal/10 text-teal',
  rejected: 'bg-coral/10 text-coral',
}

export const FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  one_time: 'One-Time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
}

export const PERIOD_LABELS: Record<BudgetPeriod, string> = Object.fromEntries(
  BUDGET_PERIODS.map((p) => [p, toLabel(p)]),
) as Record<BudgetPeriod, string>
