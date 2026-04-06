import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportPanel } from '@/components/expenses/ReportPanel'

const mockSummary = {
  totalCents: 150000,
  byCategory: {
    travel: 80000,
    meals: 50000,
    office_supplies: 20000,
  },
  taxDeductibleCents: 120000,
  nonDeductibleCents: 30000,
  count: 12,
}

const mockSetFilters = vi.fn()

vi.mock('@/hooks/use-expense-report', () => ({
  useExpenseReport: () => ({
    summary: mockSummary,
    isLoading: false,
    error: null,
    filters: { startDate: '2026-01-01', endDate: '2026-03-31' },
    setFilters: mockSetFilters,
  }),
}))

describe('ReportPanel', () => {
  it('renders summary cards', () => {
    render(<ReportPanel projects={[]} />)

    expect(screen.getByText('$1,500.00')).toBeInTheDocument() // total
    expect(screen.getByText('12')).toBeInTheDocument() // count
    expect(screen.getByText('$1,200.00')).toBeInTheDocument() // tax deductible
    expect(screen.getByText('$300.00')).toBeInTheDocument() // non-deductible
  })

  it('renders category breakdown', () => {
    render(<ReportPanel projects={[]} />)

    expect(screen.getByText('Travel')).toBeInTheDocument()
    expect(screen.getByText('Meals')).toBeInTheDocument()
    expect(screen.getByText('Office Supplies')).toBeInTheDocument()
    expect(screen.getByText('$800.00')).toBeInTheDocument() // travel amount
  })

  it('renders date filter inputs', () => {
    render(<ReportPanel projects={[]} />)

    expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
    expect(screen.getByLabelText('End Date')).toBeInTheDocument()
  })

  it('renders label headings', () => {
    render(<ReportPanel projects={[]} />)

    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
    expect(screen.getByText('Count')).toBeInTheDocument()
    expect(screen.getByText('Tax Deductible')).toBeInTheDocument()
    expect(screen.getByText('Non-Deductible')).toBeInTheDocument()
    expect(screen.getByText('Spending by Category')).toBeInTheDocument()
  })
})
