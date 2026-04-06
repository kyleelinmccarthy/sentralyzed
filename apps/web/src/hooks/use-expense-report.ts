'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { ExpenseSummary } from '@sentralyzed/shared/types/expense'

export interface ReportFilters {
  startDate: string
  endDate: string
  projectId?: string
}

interface UseExpenseReportReturn {
  summary: ExpenseSummary | null
  isLoading: boolean
  error: string | null
  filters: ReportFilters
  setFilters: (filters: ReportFilters) => void
}

function getDefaultFilters(): ReportFilters {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0] as string
  const endDate = now.toISOString().split('T')[0] as string
  return { startDate, endDate }
}

export function useExpenseReport(): UseExpenseReportReturn {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ReportFilters>(getDefaultFilters)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      if (filters.projectId) params.set('projectId', filters.projectId)
      const data = await api.get<ExpenseSummary>(`/expenses/reports/summary?${params}`)
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  return { summary, isLoading, error, filters, setFilters }
}
