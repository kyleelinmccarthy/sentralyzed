'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Asset, AssetStatus, AssetCategory } from '@sentralyzed/shared/types/asset'
import type { CreateAssetInput, UpdateAssetInput } from '@sentralyzed/shared/validators/asset'

export interface AssetFilters {
  status?: AssetStatus
  category?: AssetCategory
  assignedToId?: string
  projectId?: string
  clientId?: string
  search?: string
}

interface UseAssetsReturn {
  assets: Asset[]
  isLoading: boolean
  error: string | null
  filters: AssetFilters
  page: number
  setFilters: (filters: AssetFilters) => void
  setPage: (page: number) => void
  reload: () => Promise<void>
  createAsset: (data: CreateAssetInput) => Promise<void>
  updateAsset: (id: string, data: UpdateAssetInput) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
}

function buildQuery(filters: AssetFilters, page: number): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.category) params.set('category', filters.category)
  if (filters.assignedToId) params.set('assignedToId', filters.assignedToId)
  if (filters.projectId) params.set('projectId', filters.projectId)
  if (filters.clientId) params.set('clientId', filters.clientId)
  if (filters.search) params.set('search', filters.search)
  params.set('page', String(page))
  params.set('limit', '25')
  return params.toString()
}

export function useAssets(): UseAssetsReturn {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AssetFilters>({})
  const [page, setPage] = useState(1)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const query = buildQuery(filters, page)
      const data = await api.get<{ assets: Asset[] }>(`/assets?${query}`)
      setAssets(data.assets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets')
    } finally {
      setIsLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    void reload()
  }, [reload])

  const createAsset = async (input: CreateAssetInput) => {
    await api.post('/assets', input)
    await reload()
  }

  const updateAsset = async (id: string, input: UpdateAssetInput) => {
    await api.patch(`/assets/${id}`, input)
    await reload()
  }

  const deleteAsset = async (id: string) => {
    await api.delete(`/assets/${id}`)
    await reload()
  }

  return {
    assets,
    isLoading,
    error,
    filters,
    page,
    setFilters,
    setPage,
    reload,
    createAsset,
    updateAsset,
    deleteAsset,
  }
}
