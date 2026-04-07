'use client'

import { create } from 'zustand'

interface SidebarState {
  collapsed: boolean
  toggle: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  toggle: () =>
    set((state) => {
      const next = !state.collapsed
      try {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(next))
      } catch {}
      return { collapsed: next }
    }),
}))
