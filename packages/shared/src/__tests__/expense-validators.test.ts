import { describe, it, expect } from 'vitest'
import {
  createExpenseSchema,
  expenseQuerySchema,
  createBudgetSchema,
  reportQuerySchema,
} from '../validators/expense.js'

const validUuid = '550e8400-e29b-41d4-a716-446655440000'

const validExpense = {
  description: 'Office supplies',
  amountCents: 2500,
  category: 'office_supplies' as const,
  date: '2026-04-01',
}

describe('createExpenseSchema', () => {
  it('validates a minimal expense', () => {
    const result = createExpenseSchema.safeParse(validExpense)
    expect(result.success).toBe(true)
  })

  it('validates expense with clientId', () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      clientId: validUuid,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.clientId).toBe(validUuid)
    }
  })

  it('validates expense with both projectId and clientId', () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      projectId: validUuid,
      clientId: validUuid,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.projectId).toBe(validUuid)
      expect(result.data.clientId).toBe(validUuid)
    }
  })

  it('rejects invalid clientId format', () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      clientId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('allows omitting clientId', () => {
    const result = createExpenseSchema.safeParse(validExpense)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.clientId).toBeUndefined()
    }
  })

  it('rejects missing description', () => {
    const { description: _, ...noDesc } = validExpense
    const result = createExpenseSchema.safeParse(noDesc)
    expect(result.success).toBe(false)
  })

  it('rejects non-positive amount', () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      amountCents: -100,
    })
    expect(result.success).toBe(false)
  })
})

describe('expenseQuerySchema', () => {
  it('validates empty query (uses defaults)', () => {
    const result = expenseQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(25)
    }
  })

  it('validates query with clientId filter', () => {
    const result = expenseQuerySchema.safeParse({ clientId: validUuid })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.clientId).toBe(validUuid)
    }
  })

  it('validates query with both projectId and clientId', () => {
    const result = expenseQuerySchema.safeParse({
      projectId: validUuid,
      clientId: validUuid,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid clientId in query', () => {
    const result = expenseQuerySchema.safeParse({ clientId: 'bad' })
    expect(result.success).toBe(false)
  })

  it('validates query with budgetId filter', () => {
    const result = expenseQuerySchema.safeParse({ budgetId: validUuid })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.budgetId).toBe(validUuid)
    }
  })

  it('rejects invalid budgetId in query', () => {
    const result = expenseQuerySchema.safeParse({ budgetId: 'bad' })
    expect(result.success).toBe(false)
  })
})

describe('createExpenseSchema — budgetId', () => {
  it('validates expense with budgetId', () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      budgetId: validUuid,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.budgetId).toBe(validUuid)
    }
  })

  it('allows omitting budgetId', () => {
    const result = createExpenseSchema.safeParse(validExpense)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.budgetId).toBeUndefined()
    }
  })

  it('rejects invalid budgetId format', () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      budgetId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('createBudgetSchema — clientId', () => {
  const validBudget = {
    name: 'Q1 Marketing',
    amountCents: 100000,
    periodType: 'quarterly' as const,
  }

  it('validates budget with clientId', () => {
    const result = createBudgetSchema.safeParse({
      ...validBudget,
      clientId: validUuid,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.clientId).toBe(validUuid)
    }
  })

  it('allows omitting clientId', () => {
    const result = createBudgetSchema.safeParse(validBudget)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.clientId).toBeUndefined()
    }
  })

  it('rejects invalid clientId format', () => {
    const result = createBudgetSchema.safeParse({
      ...validBudget,
      clientId: 'not-valid',
    })
    expect(result.success).toBe(false)
  })
})

describe('reportQuerySchema — budgetId and clientId filters', () => {
  const validReport = { startDate: '2026-01-01', endDate: '2026-12-31' }

  it('validates report query with budgetId', () => {
    const result = reportQuerySchema.safeParse({ ...validReport, budgetId: validUuid })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.budgetId).toBe(validUuid)
    }
  })

  it('validates report query with clientId', () => {
    const result = reportQuerySchema.safeParse({ ...validReport, clientId: validUuid })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.clientId).toBe(validUuid)
    }
  })
})
