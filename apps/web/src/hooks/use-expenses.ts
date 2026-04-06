'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Expense, ExpenseStatus, ExpenseCategory } from '@sentralyzed/shared/types/expense'
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ReviewExpenseInput,
} from '@sentralyzed/shared/validators/expense'

export interface ExpenseFilters {
  status?: ExpenseStatus
  category?: ExpenseCategory
  projectId?: string
  clientId?: string
  startDate?: string
  endDate?: string
  submittedBy?: string
}

interface UseExpensesReturn {
  expenses: Expense[]
  isLoading: boolean
  error: string | null
  filters: ExpenseFilters
  page: number
  setFilters: (filters: ExpenseFilters) => void
  setPage: (page: number) => void
  reload: () => Promise<void>
  createExpense: (data: CreateExpenseInput) => Promise<void>
  updateExpense: (id: string, data: UpdateExpenseInput) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  reviewExpense: (id: string, data: ReviewExpenseInput) => Promise<void>
}

function buildQuery(filters: ExpenseFilters, page: number): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.category) params.set('category', filters.category)
  if (filters.projectId) params.set('projectId', filters.projectId)
  if (filters.clientId) params.set('clientId', filters.clientId)
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.submittedBy) params.set('submittedBy', filters.submittedBy)
  params.set('page', String(page))
  params.set('limit', '25')
  return params.toString()
}

export function useExpenses(): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [page, setPage] = useState(1)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const query = buildQuery(filters, page)
      const data = await api.get<{ expenses: Expense[] }>(`/expenses?${query}`)
      setExpenses(data.expenses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses')
    } finally {
      setIsLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    void reload()
  }, [reload])

  const createExpense = async (input: CreateExpenseInput) => {
    await api.post('/expenses', input)
    await reload()
  }

  const updateExpense = async (id: string, input: UpdateExpenseInput) => {
    await api.patch(`/expenses/${id}`, input)
    await reload()
  }

  const deleteExpense = async (id: string) => {
    await api.delete(`/expenses/${id}`)
    await reload()
  }

  const reviewExpense = async (id: string, input: ReviewExpenseInput) => {
    await api.post(`/expenses/${id}/review`, input)
    await reload()
  }

  return {
    expenses,
    isLoading,
    error,
    filters,
    page,
    setFilters,
    setPage,
    reload,
    createExpense,
    updateExpense,
    deleteExpense,
    reviewExpense,
  }
}
