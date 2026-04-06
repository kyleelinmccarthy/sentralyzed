import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORY_LABELS } from '@/lib/expense-helpers'
import { EXPENSE_CATEGORIES } from '@sentral/shared/types/expense'
import type { ExpenseCategory, ExpenseStatus } from '@sentral/shared/types/expense'
import type { ExpenseFilters as Filters } from '@/hooks/use-expenses'

interface Project {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

interface ExpenseFiltersProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  projects: Project[]
  clients: Client[]
}

const statusOptions: { value: ExpenseStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export function ExpenseFilters({
  filters,
  onFilterChange,
  projects,
  clients,
}: ExpenseFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div className="flex gap-1">
        {statusOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={(filters.status ?? '') === opt.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange({ ...filters, status: opt.value || undefined })}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="w-40">
        <select
          value={filters.category ?? ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              category: (e.target.value || undefined) as ExpenseCategory | undefined,
            })
          }
          className="w-full px-3 py-1.5 rounded-lg border text-[13px] bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
        >
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {projects.length > 0 && (
        <div className="w-40">
          <select
            value={filters.projectId ?? ''}
            onChange={(e) => onFilterChange({ ...filters, projectId: e.target.value || undefined })}
            className="w-full px-3 py-1.5 rounded-lg border text-[13px] bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {clients.length > 0 && (
        <div className="w-40">
          <select
            value={filters.clientId ?? ''}
            onChange={(e) => onFilterChange({ ...filters, clientId: e.target.value || undefined })}
            className="w-full px-3 py-1.5 rounded-lg border text-[13px] bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="w-36">
        <Input
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value || undefined })}
          placeholder="Start date"
          className="!py-1.5 !text-[13px]"
        />
      </div>

      <div className="w-36">
        <Input
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value || undefined })}
          placeholder="End date"
          className="!py-1.5 !text-[13px]"
        />
      </div>
    </div>
  )
}
