import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABELS, PERIOD_LABELS, parseDollarsToCents } from '@/lib/expense-helpers'
import { EXPENSE_CATEGORIES, BUDGET_PERIODS } from '@sentralyzed/shared/types/expense'
import type { Budget, ExpenseCategory, BudgetPeriod } from '@sentralyzed/shared/types/expense'
import type { CreateBudgetInput } from '@sentralyzed/shared/validators/expense'

interface Project {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

interface BudgetFormProps {
  onSubmit: (data: CreateBudgetInput) => Promise<void>
  onCancel: () => void
  projects: Project[]
  clients: Client[]
  initialValues?: Budget
  isSubmitting: boolean
}

interface FormErrors {
  name?: string
  amount?: string
  periodType?: string
}

export function BudgetForm({
  onSubmit,
  onCancel,
  projects,
  clients,
  initialValues,
  isSubmitting,
}: BudgetFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [amount, setAmount] = useState(
    initialValues ? (initialValues.amountCents / 100).toFixed(2) : '',
  )
  const [periodType, setPeriodType] = useState<BudgetPeriod | ''>(initialValues?.periodType ?? '')
  const [category, setCategory] = useState<ExpenseCategory | ''>(initialValues?.category ?? '')
  const [projectId, setProjectId] = useState(initialValues?.projectId ?? '')
  const [clientId, setClientId] = useState(initialValues?.clientId ?? '')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (!amount || parseDollarsToCents(amount) <= 0) newErrors.amount = 'Amount must be positive'
    if (!periodType) newErrors.periodType = 'Period is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const data: CreateBudgetInput = {
      name: name.trim(),
      amountCents: parseDollarsToCents(amount),
      periodType: periodType as BudgetPeriod,
      ...(category && { category: category as ExpenseCategory }),
      ...(projectId && { projectId }),
      ...(clientId && { clientId }),
    }

    await onSubmit(data)
  }

  return (
    <Card className="p-5 mb-4">
      <h3 className="text-sm font-semibold text-jet dark:text-dark-text mb-4">
        {initialValues ? 'Edit Budget' : 'New Budget'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Budget Name"
            id="budget-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="e.g. Marketing Q2"
          />
          <Input
            label="Amount ($)"
            id="budget-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            placeholder="0.00"
          />
          <div>
            <label
              htmlFor="budget-period"
              className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
            >
              Period
            </label>
            <select
              id="budget-period"
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as BudgetPeriod)}
              className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
            >
              <option value="">Select period</option>
              {BUDGET_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
            {errors.periodType && <p className="mt-1 text-sm text-coral">{errors.periodType}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="budget-category"
              className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
            >
              Category (optional)
            </label>
            <select
              id="budget-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
            >
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          {projects.length > 0 && (
            <div>
              <label
                htmlFor="budget-project"
                className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
              >
                Project (optional)
              </label>
              <select
                id="budget-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {clients.length > 0 && (
            <div>
              <label
                htmlFor="budget-client"
                className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
              >
                Client (optional)
              </label>
              <select
                id="budget-client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
              >
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" isLoading={isSubmitting}>
            {initialValues ? 'Update Budget' : 'Create Budget'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
