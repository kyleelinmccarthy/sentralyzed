import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCents, CATEGORY_LABELS, PERIOD_LABELS } from '@/lib/expense-helpers'
import type { Budget } from '@sentral/shared/types/expense'
import { Pencil, Trash2 } from 'lucide-react'

interface BudgetCardProps {
  budget: Budget & { spentCents?: number; remainingCents?: number }
  onEdit: (budget: Budget) => void
  onDelete: (id: string) => void
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const spentCents = budget.spentCents ?? 0
  const percentage =
    budget.amountCents > 0 ? Math.min((spentCents / budget.amountCents) * 100, 100) : 0
  const isOverBudget = spentCents > budget.amountCents

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-medium text-jet dark:text-dark-text">{budget.name}</h4>
          <div className="flex items-center gap-2 mt-0.5 text-[12px] text-french-gray dark:text-dark-text-secondary">
            <span>{PERIOD_LABELS[budget.periodType]}</span>
            {budget.category && <span>{CATEGORY_LABELS[budget.category]}</span>}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(budget)} aria-label="Edit budget">
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(budget.id)}
            aria-label="Delete budget"
          >
            <Trash2 size={14} className="text-coral" />
          </Button>
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-lg font-semibold text-jet dark:text-dark-text">
          {formatCents(spentCents)}
        </span>
        <span className="text-sm text-french-gray dark:text-dark-text-secondary">
          of {formatCents(budget.amountCents)}
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-light-muted dark:bg-dark-hover overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-coral' : 'bg-teal'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {budget.remainingCents !== undefined && (
        <p className={`text-[12px] mt-1 ${isOverBudget ? 'text-coral' : 'text-teal'}`}>
          {isOverBudget
            ? `Over budget by ${formatCents(spentCents - budget.amountCents)}`
            : `${formatCents(budget.remainingCents)} remaining`}
        </p>
      )}
    </Card>
  )
}
