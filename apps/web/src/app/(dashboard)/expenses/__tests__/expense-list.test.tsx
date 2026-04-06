import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import type { Expense } from '@sentralyzed/shared/types/expense'

const mockExpense: Expense = {
  id: 'exp-1',
  description: 'Test expense',
  amountCents: 5000,
  currency: 'USD',
  category: 'travel',
  customLabel: null,
  receiptUrl: null,
  projectId: null,
  clientId: null,
  budgetId: null,
  assetId: null,
  taxDeductible: true,
  date: '2026-01-15',
  vendor: null,
  notes: null,
  status: 'pending',
  submittedBy: 'user-1',
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-01-15T00:00:00Z',
}

const defaultProps = {
  expenses: [mockExpense],
  isLoading: false,
  userId: 'user-1',
  userRole: 'member',
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onReview: vi.fn(),
  page: 1,
  onPageChange: vi.fn(),
}

describe('ExpenseList', () => {
  it('renders a list of expenses', () => {
    render(<ExpenseList {...defaultProps} />)

    expect(screen.getByText('Test expense')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
  })

  it('shows empty state when no expenses', () => {
    render(<ExpenseList {...defaultProps} expenses={[]} />)

    expect(screen.getByText(/No expenses found/)).toBeInTheDocument()
  })

  it('shows loading spinner', () => {
    render(<ExpenseList {...defaultProps} isLoading={true} />)

    expect(screen.queryByText('Test expense')).not.toBeInTheDocument()
  })

  it('disables previous button on page 1', () => {
    render(<ExpenseList {...defaultProps} page={1} />)

    const prevBtn = screen.getByText('Previous')
    expect(prevBtn).toBeDisabled()
  })

  it('calls onPageChange when next clicked', () => {
    const onPageChange = vi.fn()
    // Need 25 expenses to enable "Next"
    const expenses = Array.from({ length: 25 }, (_, i) => ({
      ...mockExpense,
      id: `exp-${i}`,
    }))
    render(<ExpenseList {...defaultProps} expenses={expenses} onPageChange={onPageChange} />)

    fireEvent.click(screen.getByText('Next'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('shows page number', () => {
    render(<ExpenseList {...defaultProps} page={3} />)

    expect(screen.getByText('Page 3')).toBeInTheDocument()
  })
})
