import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABELS, FREQUENCY_LABELS } from '@/lib/expense-helpers'
import { parseDollarsToCents } from '@/lib/expense-helpers'
import { EXPENSE_CATEGORIES, EXPENSE_FREQUENCIES } from '@sentral/shared/types/expense'
import type { Expense, ExpenseCategory, ExpenseFrequency } from '@sentral/shared/types/expense'
import type { CreateExpenseInput } from '@sentral/shared/validators/expense'

interface Project {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

interface BudgetOption {
  id: string
  name: string
}

interface AssetOption {
  id: string
  name: string
}

interface UserOption {
  id: string
  name: string
}

interface ExpenseFormProps {
  onSubmit: (data: CreateExpenseInput) => Promise<void>
  onCancel: () => void
  projects: Project[]
  clients: Client[]
  budgets: BudgetOption[]
  assets: AssetOption[]
  users: UserOption[]
  initialValues?: Expense
  isSubmitting: boolean
}

interface FormErrors {
  description?: string
  amount?: string
  category?: string
  date?: string
}

export function ExpenseForm({
  onSubmit,
  onCancel,
  projects,
  clients,
  budgets,
  assets,
  users,
  initialValues,
  isSubmitting,
}: ExpenseFormProps) {
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [amount, setAmount] = useState(
    initialValues ? (initialValues.amountCents / 100).toFixed(2) : '',
  )
  const [category, setCategory] = useState<ExpenseCategory | ''>(initialValues?.category ?? '')
  const [date, setDate] = useState(initialValues?.date ?? new Date().toISOString().slice(0, 10))
  const [vendor, setVendor] = useState(initialValues?.vendor ?? '')
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const [projectId, setProjectId] = useState(initialValues?.projectId ?? '')
  const [clientId, setClientId] = useState(initialValues?.clientId ?? '')
  const [budgetId, setBudgetId] = useState(initialValues?.budgetId ?? '')
  const [assetId, setAssetId] = useState(initialValues?.assetId ?? '')
  const [userId, setUserId] = useState(initialValues?.userId ?? '')
  const [frequency, setFrequency] = useState<ExpenseFrequency>(
    initialValues?.frequency ?? 'one_time',
  )
  const [taxDeductible, setTaxDeductible] = useState(initialValues?.taxDeductible ?? true)
  const [customLabel, setCustomLabel] = useState(initialValues?.customLabel ?? '')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!description.trim()) newErrors.description = 'Description is required'
    if (!amount || parseDollarsToCents(amount) <= 0) newErrors.amount = 'Amount must be positive'
    if (!category) newErrors.category = 'Category is required'
    if (!date) newErrors.date = 'Date is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const data = {
      description: description.trim(),
      amountCents: parseDollarsToCents(amount),
      currency: 'USD',
      category: category as ExpenseCategory,
      frequency,
      date,
      taxDeductible,
      ...(vendor.trim() && { vendor: vendor.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(customLabel.trim() && { customLabel: customLabel.trim() }),
      ...(projectId && { projectId }),
      ...(clientId && { clientId }),
      ...(budgetId && { budgetId }),
      ...(assetId && { assetId }),
      ...(userId && { userId }),
    }

    await onSubmit(data)
  }

  return (
    <Card className="p-5 mb-4">
      <h3 className="text-sm font-semibold text-jet dark:text-dark-text mb-4">
        {initialValues ? 'Edit Expense' : 'New Expense'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Description"
            id="expense-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            placeholder="What was this expense for?"
          />
          <Input
            label="Amount ($)"
            id="expense-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="expense-category"
              className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
            >
              Category
            </label>
            <select
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
            >
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-coral">{errors.category}</p>}
          </div>

          <div>
            <label
              htmlFor="expense-frequency"
              className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
            >
              Frequency
            </label>
            <select
              id="expense-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ExpenseFrequency)}
              className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
            >
              {EXPENSE_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Custom Label"
            id="expense-custom-label"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Optional custom label"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Date"
            id="expense-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />

          <Input
            label="Vendor"
            id="expense-vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Optional"
          />

          <Input label="Currency" id="expense-currency" value="USD" disabled placeholder="USD" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {projects.length > 0 && (
            <div>
              <label
                htmlFor="expense-project"
                className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
              >
                Project (optional)
              </label>
              <select
                id="expense-project"
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
                htmlFor="expense-client"
                className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
              >
                Client (optional)
              </label>
              <select
                id="expense-client"
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
          {budgets.length > 0 && (
            <div>
              <label
                htmlFor="expense-budget"
                className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
              >
                Budget (optional)
              </label>
              <select
                id="expense-budget"
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
              >
                <option value="">No budget</option>
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {users.length > 0 && (
            <div>
              <label
                htmlFor="expense-user"
                className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
              >
                User (optional)
              </label>
              <select
                id="expense-user"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
              >
                <option value="">No user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {assets.length > 0 && (
            <div>
              <label
                htmlFor="expense-asset"
                className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
              >
                Asset (optional)
              </label>
              <select
                id="expense-asset"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
              >
                <option value="">No asset</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="expense-notes"
            className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
          >
            Notes (optional)
          </label>
          <textarea
            id="expense-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional details..."
            className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo placeholder:text-french-gray dark:placeholder:text-dark-text-secondary transition-colors resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="expense-tax-deductible"
            checked={taxDeductible}
            onChange={(e) => setTaxDeductible(e.target.checked)}
            className="rounded border-light-border dark:border-dark-border"
          />
          <label htmlFor="expense-tax-deductible" className="text-sm text-jet dark:text-dark-text">
            Tax deductible
          </label>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" isLoading={isSubmitting}>
            {initialValues ? 'Update Expense' : 'Add Expense'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
