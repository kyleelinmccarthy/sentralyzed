import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useExpenseReport } from '@/hooks/use-expense-report'
import { formatCents, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/expense-helpers'
import type { ExpenseCategory } from '@sentralyzed/shared/types/expense'

interface Project {
  id: string
  name: string
}

interface ReportPanelProps {
  projects: Project[]
}

export function ReportPanel({ projects }: ReportPanelProps) {
  const { summary, isLoading, error, filters, setFilters } = useExpenseReport()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo" />
      </div>
    )
  }

  const maxCategoryAmount = summary
    ? Math.max(...Object.values(summary.byCategory).filter((v): v is number => v !== undefined), 1)
    : 1

  return (
    <div>
      {error && <p className="text-sm text-coral mb-3">{error}</p>}

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="w-40">
          <Input
            label="Start Date"
            id="report-start-date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="w-40">
          <Input
            label="End Date"
            id="report-end-date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        {projects.length > 0 && (
          <div className="w-44">
            <label
              htmlFor="report-project"
              className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
            >
              Project
            </label>
            <select
              id="report-project"
              value={filters.projectId ?? ''}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-colors"
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
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="p-4 text-center">
              <p className="text-[12px] text-french-gray dark:text-dark-text-secondary mb-1">
                Total Expenses
              </p>
              <p className="text-xl font-bold text-jet dark:text-dark-text">
                {formatCents(summary.totalCents)}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-[12px] text-french-gray dark:text-dark-text-secondary mb-1">
                Count
              </p>
              <p className="text-xl font-bold text-jet dark:text-dark-text">{summary.count}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-[12px] text-french-gray dark:text-dark-text-secondary mb-1">
                Tax Deductible
              </p>
              <p className="text-xl font-bold text-teal">
                {formatCents(summary.taxDeductibleCents)}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-[12px] text-french-gray dark:text-dark-text-secondary mb-1">
                Non-Deductible
              </p>
              <p className="text-xl font-bold text-coral">
                {formatCents(summary.nonDeductibleCents)}
              </p>
            </Card>
          </div>

          <Card className="p-5">
            <h4 className="text-sm font-semibold text-jet dark:text-dark-text mb-4">
              Spending by Category
            </h4>
            {Object.keys(summary.byCategory).length === 0 ? (
              <p className="text-sm text-french-gray dark:text-dark-text-secondary">
                No category data for this period.
              </p>
            ) : (
              <div className="space-y-3">
                {(Object.entries(summary.byCategory) as [ExpenseCategory, number][])
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amount]) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat]}`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </span>
                        <span className="text-sm font-medium text-jet dark:text-dark-text">
                          {formatCents(amount)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-light-muted dark:bg-dark-hover overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo transition-all"
                          style={{ width: `${(amount / maxCategoryAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
