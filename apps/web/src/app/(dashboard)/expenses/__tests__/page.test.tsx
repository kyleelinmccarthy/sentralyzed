import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExpensesPage from '../page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/expenses',
}))

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@test.com',
  role: 'member' as const,
}

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}))

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ expenses: [], projects: [] }),
    post: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/hooks/use-expenses', () => ({
  useExpenses: () => ({
    expenses: [],
    isLoading: false,
    error: null,
    filters: {},
    page: 1,
    setFilters: vi.fn(),
    setPage: vi.fn(),
    reload: vi.fn(),
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
    reviewExpense: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-budgets', () => ({
  useBudgets: () => ({
    budgets: [],
    isLoading: false,
    error: null,
    reload: vi.fn(),
    createBudget: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-expense-report', () => ({
  useExpenseReport: () => ({
    summary: null,
    isLoading: false,
    error: null,
    filters: { startDate: '2026-01-01', endDate: '2026-03-31' },
    setFilters: vi.fn(),
  }),
}))

describe('ExpensesPage', () => {
  it('renders page title', () => {
    render(<ExpensesPage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Expenses')
  })

  it('renders Expenses tab by default', () => {
    render(<ExpensesPage />)

    expect(screen.getByText('No expenses found. Create one to get started.')).toBeInTheDocument()
    expect(screen.getByText('New Expense')).toBeInTheDocument()
  })

  it('hides Budgets and Reports tabs for member role', () => {
    render(<ExpensesPage />)

    expect(screen.queryByText('Budgets')).not.toBeInTheDocument()
    expect(screen.queryByText('Reports')).not.toBeInTheDocument()
  })

  it('shows Budgets and Reports tabs for admin', () => {
    mockUser.role = 'admin' as 'member'
    render(<ExpensesPage />)

    expect(screen.getByText('Budgets')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()

    // Reset
    mockUser.role = 'member' as 'member'
  })

  it('switches to Budgets tab', () => {
    mockUser.role = 'admin' as 'member'
    render(<ExpensesPage />)

    fireEvent.click(screen.getByText('Budgets'))

    expect(screen.getByText('No budgets set up yet.')).toBeInTheDocument()

    mockUser.role = 'member' as 'member'
  })

  it('switches to Reports tab', () => {
    mockUser.role = 'admin' as 'member'
    render(<ExpensesPage />)

    fireEvent.click(screen.getByText('Reports'))

    expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
    expect(screen.getByLabelText('End Date')).toBeInTheDocument()

    mockUser.role = 'member' as 'member'
  })

  it('toggles new expense form', () => {
    render(<ExpensesPage />)

    fireEvent.click(screen.getByText('New Expense'))

    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount ($)')).toBeInTheDocument()
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
  })

  it('shows filter controls', () => {
    render(<ExpensesPage />)

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })
})
