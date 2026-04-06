import { describe, it, expect } from 'vitest'
import {
  formatCents,
  parseDollarsToCents,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  PERIOD_LABELS,
} from '@/lib/expense-helpers'
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES, BUDGET_PERIODS } from '@sentral/shared/types/expense'

describe('formatCents', () => {
  it('formats positive amounts', () => {
    expect(formatCents(1550)).toBe('$15.50')
    expect(formatCents(100)).toBe('$1.00')
    expect(formatCents(1)).toBe('$0.01')
  })

  it('formats zero', () => {
    expect(formatCents(0)).toBe('$0.00')
  })

  it('formats large amounts with commas', () => {
    expect(formatCents(1000000)).toBe('$10,000.00')
  })

  it('formats negative amounts', () => {
    expect(formatCents(-500)).toBe('-$5.00')
  })
})

describe('parseDollarsToCents', () => {
  it('parses dollar strings to cents', () => {
    expect(parseDollarsToCents('15.50')).toBe(1550)
    expect(parseDollarsToCents('1.00')).toBe(100)
    expect(parseDollarsToCents('0.01')).toBe(1)
  })

  it('parses strings with dollar sign', () => {
    expect(parseDollarsToCents('$15.50')).toBe(1550)
  })

  it('parses strings with commas', () => {
    expect(parseDollarsToCents('10,000.00')).toBe(1000000)
  })

  it('returns 0 for invalid input', () => {
    expect(parseDollarsToCents('')).toBe(0)
    expect(parseDollarsToCents('abc')).toBe(0)
  })

  it('handles whole numbers without decimals', () => {
    expect(parseDollarsToCents('25')).toBe(2500)
  })
})

describe('CATEGORY_LABELS', () => {
  it('has a label for every category', () => {
    for (const category of EXPENSE_CATEGORIES) {
      expect(CATEGORY_LABELS[category]).toBeDefined()
      expect(CATEGORY_LABELS[category].length).toBeGreaterThan(0)
    }
  })

  it('converts snake_case to Title Case', () => {
    expect(CATEGORY_LABELS.office_supplies).toBe('Office Supplies')
    expect(CATEGORY_LABELS.bank_fees).toBe('Bank Fees')
    expect(CATEGORY_LABELS.travel).toBe('Travel')
  })
})

describe('CATEGORY_COLORS', () => {
  it('has a color for every category', () => {
    for (const category of EXPENSE_CATEGORIES) {
      expect(CATEGORY_COLORS[category]).toBeDefined()
      expect(CATEGORY_COLORS[category].length).toBeGreaterThan(0)
    }
  })
})

describe('STATUS_LABELS', () => {
  it('has a label for every status', () => {
    for (const status of EXPENSE_STATUSES) {
      expect(STATUS_LABELS[status]).toBeDefined()
    }
  })
})

describe('STATUS_COLORS', () => {
  it('has a color for every status', () => {
    for (const status of EXPENSE_STATUSES) {
      expect(STATUS_COLORS[status]).toBeDefined()
    }
  })

  it('uses correct semantic colors', () => {
    expect(STATUS_COLORS.pending).toContain('amber')
    expect(STATUS_COLORS.approved).toContain('teal')
    expect(STATUS_COLORS.rejected).toContain('coral')
  })
})

describe('PERIOD_LABELS', () => {
  it('has a label for every budget period', () => {
    for (const period of BUDGET_PERIODS) {
      expect(PERIOD_LABELS[period]).toBeDefined()
    }
  })
})
