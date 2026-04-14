'use client'

import { useEffect, useState, useCallback } from 'react'
import { authClient, useSession } from '@/lib/auth-client'
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

/**
 * Compatibility shim around Better Auth so existing call sites keep working.
 * Sources auth identity from authClient.useSession() and enriches with our
 * local user row (role/isActive) from /auth/me.
 */
export function useAuthStore(): AuthState {
  const { data: session, isPending, refetch } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    if (!session?.user) {
      setUser(null)
      setProfileLoading(false)
      return
    }
    try {
      const res = await api.get<{ user: User }>('/auth/me')
      setUser(res.user)
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        console.error('[auth] failed to load /auth/me', err)
      }
      setUser(null)
    } finally {
      setProfileLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        throw new ApiError(result.error.status ?? 401, result.error.message ?? 'Login failed')
      }
      await refetch()
    },
    [refetch],
  )

  const register = useCallback(
    async (data: { email: string; name: string; password: string; inviteToken: string }) => {
      // Custom invitation-gated flow — backend validates the invite then signs the user in.
      await api.post<{ user: User }>('/auth/invitation-signup', data)
      await refetch()
    },
    [refetch],
  )

  const logout = useCallback(async () => {
    await authClient.signOut()
    setUser(null)
    await refetch()
  }, [refetch])

  return {
    user,
    isLoading: isPending || profileLoading,
    isAuthenticated: !!session?.user,
    login,
    register,
    logout,
    fetchUser,
  }
}
