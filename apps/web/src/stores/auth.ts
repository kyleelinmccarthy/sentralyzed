'use client'

import { create } from 'zustand'
import { api, ApiError } from '@/lib/api'
import type { User } from '@sentral/shared/types/user'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    name: string
    password: string
    inviteToken: string
  }) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const data = await api.post<{ user: User }>('/auth/login', { email, password })
    set({ user: data.user, isAuthenticated: true })
  },

  register: async ({ email, name, password, inviteToken }) => {
    const data = await api.post<{ user: User }>('/auth/register', {
      email,
      name,
      password,
      inviteToken,
    })
    set({ user: data.user, isAuthenticated: true })
  },

  logout: async () => {
    await api.post('/auth/logout')
    set({ user: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    try {
      const data = await api.get<{ user: User }>('/auth/me')
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        set({ user: null, isAuthenticated: false, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    }
  },
}))
