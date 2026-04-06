import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'

const defaultProps = {
  onSubmit: vi.fn().mockResolvedValue(undefined),
  onCancel: vi.fn(),
  projects: [{ id: 'proj-1', name: 'Project Alpha' }],
  clients: [{ id: 'client-1', name: 'Acme Corp' }],
  budgets: [{ id: 'bud-1', name: 'Q2 Marketing' }],
  assets: [{ id: 'asset-1', name: 'MacBook Pro' }],
  isSubmitting: false,
}

describe('ExpenseForm', () => {
  it('renders all required fields', () => {
    render(<ExpenseForm {...defaultProps} />)

    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount ($)')).toBeInTheDocument()
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Vendor')).toBeInTheDocument()
    expect(screen.getByLabelText('Tax deductible')).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    render(<ExpenseForm {...defaultProps} />)

    // Clear the date field which has a default value
    const dateInput = screen.getByLabelText('Date')
    fireEvent.change(dateInput, { target: { value: '' } })

    fireEvent.click(screen.getByText('Add Expense'))

    expect(screen.getByText('Description is required')).toBeInTheDocument()
    expect(screen.getByText('Amount must be positive')).toBeInTheDocument()
    expect(screen.getByText('Category is required')).toBeInTheDocument()
  })

  it('calls onSubmit with correct data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ExpenseForm {...defaultProps} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Office lunch' } })
    fireEvent.change(screen.getByLabelText('Amount ($)'), { target: { value: '25.50' } })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'meals' } })
    fireEvent.change(screen.getByLabelText('Vendor'), { target: { value: 'Deli Shop' } })

    fireEvent.click(screen.getByText('Add Expense'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Office lunch',
          amountCents: 2550,
          category: 'meals',
          vendor: 'Deli Shop',
          taxDeductible: true,
        }),
      )
    })
  })

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn()
    render(<ExpenseForm {...defaultProps} onCancel={onCancel} />)

    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows "Edit Expense" title when editing', () => {
    const expense = {
      id: 'exp-1',
      description: 'Existing expense',
      amountCents: 5000,
      currency: 'USD',
      category: 'travel' as const,
      customLabel: null,
      receiptUrl: null,
      projectId: null,
      clientId: null,
      budgetId: null,
      assetId: null,
      taxDeductible: false,
      date: '2026-01-15',
      vendor: 'Airline',
      notes: 'Business trip',
      status: 'pending' as const,
      submittedBy: 'user-1',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    }

    render(<ExpenseForm {...defaultProps} initialValues={expense} />)

    expect(screen.getByText('Edit Expense')).toBeInTheDocument()
    expect(screen.getByText('Update Expense')).toBeInTheDocument()
  })

  it('shows loading state on submit button', () => {
    render(<ExpenseForm {...defaultProps} isSubmitting={true} />)

    const submitBtn = screen.getByText('Add Expense').closest('button')
    expect(submitBtn).toBeDisabled()
  })

  it('renders project select with options', () => {
    render(<ExpenseForm {...defaultProps} />)

    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
  })
})
