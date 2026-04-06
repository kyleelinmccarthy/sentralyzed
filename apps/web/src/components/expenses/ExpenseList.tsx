import { ExpenseCard } from './ExpenseCard'
import { Button } from '@/components/ui/button'
import type { Expense } from '@sentralyzed/shared/types/expense'

interface ExpenseListProps {
  expenses: Expense[]
  isLoading: boolean
  userId: string
  userRole: string
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
  onReview: (expense: Expense) => void
  page: number
  onPageChange: (page: number) => void
}

export function ExpenseList({
  expenses,
  isLoading,
  userId,
  userRole,
  onEdit,
  onDelete,
  onReview,
  page,
  onPageChange,
}: ExpenseListProps) {
  const isManager = userRole === 'admin' || userRole === 'manager'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo" />
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-french-gray dark:text-dark-text-secondary text-sm">
          No expenses found. Create one to get started.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            isOwner={expense.submittedBy === userId}
            isManager={isManager}
            onEdit={onEdit}
            onDelete={onDelete}
            onReview={onReview}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-french-gray dark:text-dark-text-secondary">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={expenses.length < 25}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
