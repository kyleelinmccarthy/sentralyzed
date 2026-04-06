import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCents } from '@/lib/expense-helpers'
import type { Expense } from '@sentralyzed/shared/types/expense'
import type { ReviewExpenseInput } from '@sentralyzed/shared/validators/expense'

interface ExpenseReviewModalProps {
  expense: Expense
  onSubmit: (data: ReviewExpenseInput) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function ExpenseReviewModal({
  expense,
  onSubmit,
  onCancel,
  isSubmitting,
}: ExpenseReviewModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleApprove = async () => {
    await onSubmit({ status: 'approved' })
  }

  const handleReject = async () => {
    await onSubmit({ status: 'rejected', rejectionReason: rejectionReason.trim() || undefined })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-label="Review expense"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-light-surface dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border shadow-lg p-6 w-full max-w-md">
        <h3 className="text-base font-semibold text-jet dark:text-dark-text mb-3">
          Review Expense
        </h3>

        <div className="mb-4 space-y-1 text-sm text-jet dark:text-dark-text">
          <p>
            <span className="text-french-gray dark:text-dark-text-secondary">Description:</span>{' '}
            {expense.description}
          </p>
          <p>
            <span className="text-french-gray dark:text-dark-text-secondary">Amount:</span>{' '}
            {formatCents(expense.amountCents)}
          </p>
          <p>
            <span className="text-french-gray dark:text-dark-text-secondary">Date:</span>{' '}
            {expense.date}
          </p>
          {expense.vendor && (
            <p>
              <span className="text-french-gray dark:text-dark-text-secondary">Vendor:</span>{' '}
              {expense.vendor}
            </p>
          )}
        </div>

        {showRejectForm ? (
          <div className="mb-4">
            <label
              htmlFor="rejection-reason"
              className="block text-sm font-medium text-jet dark:text-dark-text mb-1"
            >
              Rejection Reason (optional)
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Why is this expense being rejected?"
              className="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo placeholder:text-french-gray dark:placeholder:text-dark-text-secondary transition-colors resize-none"
            />
            <div className="flex gap-2 mt-3">
              <Button variant="danger" onClick={handleReject} isLoading={isSubmitting}>
                Confirm Rejection
              </Button>
              <Button variant="ghost" onClick={() => setShowRejectForm(false)}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleApprove} isLoading={isSubmitting}>
              Approve
            </Button>
            <Button variant="danger" onClick={() => setShowRejectForm(true)}>
              Reject
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
