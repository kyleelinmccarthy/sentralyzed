'use client'

import { create } from 'zustand'
import { api } from '@/lib/api'
import type { UserSettings } from '@sentral/shared/types/settings'

interface SettingsState {
  settings: UserSettings | null
  isLoading: boolean
  fetchSettings: () => Promise<void>
  updateSettings: (data: Partial<UserSettings>) => Promise<void>
  muteEntity: (entityType: 'channel' | 'project', entityId: string) => Promise<void>
  unmuteEntity: (entityType: 'channel' | 'project', entityId: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const data = await api.get<{ settings: UserSettings }>('/settings')
      set({ settings: data.settings, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  updateSettings: async (data) => {
    try {
      const result = await api.patch<{ settings: UserSettings }>('/settings', data)
      set({ settings: result.settings })
    } catch {
      // re-fetch to stay in sync
      await get().fetchSettings()
    }
  },

  muteEntity: async (entityType, entityId) => {
    try {
      await api.post('/settings/mute', { entityType, entityId })
      await get().fetchSettings()
    } catch {
      // silently ignore
    }
  },

  unmuteEntity: async (entityType, entityId) => {
    try {
      await api.fetch('/settings/mute', {
        method: 'DELETE',
        body: JSON.stringify({ entityType, entityId }),
      })
      await get().fetchSettings()
    } catch {
      // silently ignore
    }
  },
}))
