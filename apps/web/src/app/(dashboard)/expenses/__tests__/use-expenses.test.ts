import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useExpenses } from '@/hooks/use-expenses'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPatch = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}))

const mockExpense = {
  id: 'exp-1',
  description: 'Test expense',
  amountCents: 5000,
  currency: 'USD',
  category: 'travel' as const,
  customLabel: null,
  receiptUrl: null,
  projectId: null,
  taxDeductible: true,
  date: '2026-01-15',
  vendor: 'Test Vendor',
  notes: null,
  status: 'pending' as const,
  submittedBy: 'user-1',
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-01-15T00:00:00Z',
}

describe('useExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ expenses: [mockExpense] })
    mockPost.mockResolvedValue({})
    mockPatch.mockResolvedValue({})
    mockDelete.mockResolvedValue({})
  })

  it('loads expenses on mount', async () => {
    const { result } = renderHook(() => useExpenses())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/expenses?'))
    expect(result.current.expenses).toEqual([mockExpense])
    expect(result.current.error).toBeNull()
  })

  it('reloads when filters change', async () => {
    const { result } = renderHook(() => useExpenses())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setFilters({ status: 'approved' })
    })

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('status=approved'))
    })
  })

  it('reloads when page changes', async () => {
    const { result } = renderHook(() => useExpenses())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setPage(2)
    })

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('page=2'))
    })
  })

  it('creates expense and reloads', async () => {
    const { result } = renderHook(() => useExpenses())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const input = {
      description: 'New expense',
      amountCents: 1000,
      currency: 'USD',
      category: 'meals' as const,
      date: '2026-01-20',
      taxDeductible: true,
    }

    await act(async () => {
      await result.current.createExpense(input)
    })

    expect(mockPost).toHaveBeenCalledWith('/expenses', input)
    expect(mockGet).toHaveBeenCalledTimes(2) // initial + reload
  })

  it('updates expense and reloads', async () => {
    const { result } = renderHook(() => useExpenses())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateExpense('exp-1', { description: 'Updated' })
    })

    expect(mockPatch).toHaveBeenCalledWith('/expenses/exp-1', { description: 'Updated' })
  })

  it('deletes expense and reloads', async () => {
    const { result } = renderHook(() => useExpenses())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteExpense('exp-1')
    })

    expect(mockDelete).toHaveBeenCalledWith('/expenses/exp-1')
  })

  it('reviews expense and reloads', async () => {
    const { result } = renderHook(() => useExpenses())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.reviewExpense('exp-1', { status: 'approved' })
    })

    expect(mockPost).toHaveBeenCalledWith('/expenses/exp-1/review', { status: 'approved' })
  })

  it('sets error on API failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useExpenses())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.expenses).toEqual([])
  })
})
