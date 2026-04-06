'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Budget, BudgetWithSpent } from '@sentralyzed/shared/types/expense'
import type { CreateBudgetInput, UpdateBudgetInput } from '@sentralyzed/shared/validators/expense'

interface UseBudgetsReturn {
  budgets: BudgetWithSpent[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createBudget: (data: CreateBudgetInput) => Promise<void>
  updateBudget: (id: string, data: UpdateBudgetInput) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
}

export function useBudgets(): UseBudgetsReturn {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get<{ budgets: Budget[] }>('/expenses/budgets')
      const withSpent = await Promise.all(
        data.budgets.map(async (budget) => {
          try {
            const spending = await api.get<{ budget: BudgetWithSpent }>(
              `/expenses/budgets/${budget.id}/spending`,
            )
            return spending.budget
          } catch {
            return { ...budget, spentCents: 0, remainingCents: budget.amountCents }
          }
        }),
      )
      setBudgets(withSpent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const createBudget = async (input: CreateBudgetInput) => {
    await api.post('/expenses/budgets', input)
    await reload()
  }

  const updateBudget = async (id: string, input: UpdateBudgetInput) => {
    await api.patch(`/expenses/budgets/${id}`, input)
    await reload()
  }

  const deleteBudget = async (id: string) => {
    await api.delete(`/expenses/budgets/${id}`)
    await reload()
  }

  return { budgets, isLoading, error, reload, createBudget, updateBudget, deleteBudget }
}
