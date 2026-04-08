import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExpenseCard } from '@/components/expenses/ExpenseCard'
import type { Expense } from '@sentral/shared/types/expense'

const baseExpense: Expense = {
  id: 'exp-1',
  description: 'Client dinner',
  amountCents: 7500,
  currency: 'USD',
  category: 'meals',
  customLabel: null,
  receiptUrl: null,
  projectId: null,
  clientId: null,
  budgetId: null,
  assetId: null,
  userId: null,
  frequency: 'one_time',
  taxDeductible: true,
  date: '2026-03-15',
  vendor: 'Restaurant ABC',
  notes: 'Team celebration',
  status: 'pending',
  submittedBy: 'user-1',
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: '2026-03-15T00:00:00Z',
  updatedAt: '2026-03-15T00:00:00Z',
}

const defaultProps = {
  expense: baseExpense,
  isOwner: false,
  isManager: false,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onReview: vi.fn(),
}

describe('ExpenseCard', () => {
  it('renders expense data', () => {
    render(<ExpenseCard {...defaultProps} />)

    expect(screen.getByText('Client dinner')).toBeInTheDocument()
    expect(screen.getByText('$75.00')).toBeInTheDocument()
    expect(screen.getByText('Meals')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('2026-03-15')).toBeInTheDocument()
    expect(screen.getByText('Restaurant ABC')).toBeInTheDocument()
    expect(screen.getByText('Tax deductible')).toBeInTheDocument()
    expect(screen.getByText('Team celebration')).toBeInTheDocument()
  })

  it('shows edit/delete buttons for owner of pending expense', () => {
    render(<ExpenseCard {...defaultProps} isOwner={true} />)

    expect(screen.getByLabelText('Edit expense')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete expense')).toBeInTheDocument()
  })

  it('hides edit/delete for non-owner', () => {
    render(<ExpenseCard {...defaultProps} isOwner={false} />)

    expect(screen.queryByLabelText('Edit expense')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Delete expense')).not.toBeInTheDocument()
  })

  it('hides edit/delete for approved expense even if owner', () => {
    render(
      <ExpenseCard
        {...defaultProps}
        isOwner={true}
        expense={{ ...baseExpense, status: 'approved' }}
      />,
    )

    expect(screen.queryByLabelText('Edit expense')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Delete expense')).not.toBeInTheDocument()
  })

  it('shows review button for manager on pending expense', () => {
    render(<ExpenseCard {...defaultProps} isManager={true} />)

    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('hides review button for non-manager', () => {
    render(<ExpenseCard {...defaultProps} isManager={false} />)

    expect(screen.queryByText('Review')).not.toBeInTheDocument()
  })

  it('hides review for already reviewed expense', () => {
    render(
      <ExpenseCard
        {...defaultProps}
        isManager={true}
        expense={{ ...baseExpense, status: 'approved' }}
      />,
    )

    expect(screen.queryByText('Review')).not.toBeInTheDocument()
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    render(<ExpenseCard {...defaultProps} isOwner={true} onEdit={onEdit} />)

    fireEvent.click(screen.getByLabelText('Edit expense'))
    expect(onEdit).toHaveBeenCalledWith(baseExpense)
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    render(<ExpenseCard {...defaultProps} isOwner={true} onDelete={onDelete} />)

    fireEvent.click(screen.getByLabelText('Delete expense'))
    expect(onDelete).toHaveBeenCalledWith('exp-1')
  })

  it('calls onReview when review button clicked', () => {
    const onReview = vi.fn()
    render(<ExpenseCard {...defaultProps} isManager={true} onReview={onReview} />)

    fireEvent.click(screen.getByText('Review'))
    expect(onReview).toHaveBeenCalledWith(baseExpense)
  })

  it('shows rejection reason for rejected expenses', () => {
    render(
      <ExpenseCard
        {...defaultProps}
        expense={{ ...baseExpense, status: 'rejected', rejectionReason: 'Missing receipt' }}
      />,
    )

    expect(screen.getByText('Rejected: Missing receipt')).toBeInTheDocument()
  })
})
