import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BudgetPanel } from '@/components/expenses/BudgetPanel'

const mockBudgets = [
  {
    id: 'bud-1',
    name: 'Marketing Q2',
    amountCents: 500000,
    periodType: 'quarterly' as const,
    category: 'advertising' as const,
    projectId: null,
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    spentCents: 250000,
    remainingCents: 250000,
  },
]

const mockCreateBudget = vi.fn().mockResolvedValue(undefined)
const mockUpdateBudget = vi.fn().mockResolvedValue(undefined)
const mockDeleteBudget = vi.fn().mockResolvedValue(undefined)
const mockReload = vi.fn().mockResolvedValue(undefined)

vi.mock('@/hooks/use-budgets', () => ({
  useBudgets: () => ({
    budgets: mockBudgets,
    isLoading: false,
    error: null,
    reload: mockReload,
    createBudget: mockCreateBudget,
    updateBudget: mockUpdateBudget,
    deleteBudget: mockDeleteBudget,
  }),
}))

describe('BudgetPanel', () => {
  it('renders budget list', () => {
    render(<BudgetPanel projects={[]} clients={[]} />)

    expect(screen.getByText('Marketing Q2')).toBeInTheDocument()
    expect(screen.getByText('$2,500.00')).toBeInTheDocument() // spent
    expect(screen.getByText('of $5,000.00')).toBeInTheDocument() // total
  })

  it('shows new budget button', () => {
    render(<BudgetPanel projects={[]} clients={[]} />)

    expect(screen.getByText('New Budget')).toBeInTheDocument()
  })

  it('toggles budget form on button click', () => {
    render(<BudgetPanel projects={[]} clients={[]} />)

    fireEvent.click(screen.getByText('New Budget'))

    expect(screen.getByText('New Budget', { selector: 'h3' })).toBeInTheDocument()
    expect(screen.getByLabelText('Budget Name')).toBeInTheDocument()
  })

  it('shows edit and delete buttons on budget card', () => {
    render(<BudgetPanel projects={[]} clients={[]} />)

    expect(screen.getByLabelText('Edit budget')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete budget')).toBeInTheDocument()
  })

  it('calls deleteBudget when delete clicked', async () => {
    render(<BudgetPanel projects={[]} clients={[]} />)

    fireEvent.click(screen.getByLabelText('Delete budget'))

    await waitFor(() => {
      expect(mockDeleteBudget).toHaveBeenCalledWith('bud-1')
    })
  })

  it('shows progress bar with correct color', () => {
    render(<BudgetPanel projects={[]} clients={[]} />)

    expect(screen.getByText('$2,500.00 remaining')).toBeInTheDocument()
  })
})
