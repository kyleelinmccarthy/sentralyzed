import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  formatCents,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/expense-helpers'
import type { Expense } from '@sentralyzed/shared/types/expense'
import { Calendar, Tag, Building2, Pencil, Trash2, ClipboardCheck } from 'lucide-react'
import { FileAttachments } from '@/components/files/FileAttachments'

interface ExpenseCardProps {
  expense: Expense
  isOwner: boolean
  isManager: boolean
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
  onReview: (expense: Expense) => void
}

export function ExpenseCard({
  expense,
  isOwner,
  isManager,
  onEdit,
  onDelete,
  onReview,
}: ExpenseCardProps) {
  const isPending = expense.status === 'pending'
  const canEdit = isOwner && isPending
  const canReview = isManager && isPending

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-jet dark:text-dark-text truncate">
              {expense.description}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[expense.status]}`}
            >
              {STATUS_LABELS[expense.status]}
            </span>
          </div>

          <p className="text-lg font-semibold text-jet dark:text-dark-text mb-2">
            {formatCents(expense.amountCents)}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-[12px] text-french-gray dark:text-dark-text-secondary">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${CATEGORY_COLORS[expense.category]}`}
            >
              <Tag size={11} />
              {CATEGORY_LABELS[expense.category]}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              {expense.date}
            </span>
            {expense.vendor && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={11} />
                {expense.vendor}
              </span>
            )}
            {expense.taxDeductible && <span className="text-teal">Tax deductible</span>}
          </div>

          {expense.rejectionReason && (
            <p className="mt-2 text-[12px] text-coral">Rejected: {expense.rejectionReason}</p>
          )}

          {expense.notes && (
            <p className="mt-2 text-[12px] text-french-gray dark:text-dark-text-secondary">
              {expense.notes}
            </p>
          )}

          <div className="mt-3">
            <FileAttachments entityType="expense" entityId={expense.id} />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(expense)}
                aria-label="Edit expense"
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(expense.id)}
                aria-label="Delete expense"
              >
                <Trash2 size={14} className="text-coral" />
              </Button>
            </>
          )}
          {canReview && (
            <Button variant="outline" size="sm" onClick={() => onReview(expense)}>
              <ClipboardCheck size={14} className="mr-1" />
              Review
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
