'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { api, ApiError } from '@/lib/api'
import type { User } from '@sentral/shared/types/user'

/**
 * Combines Better Auth's session (auth identity) with our /auth/me endpoint
 * which returns the local user row including `role` and `isActive`.
 */
export function useCurrentUser() {
  const { data: session, isPending: sessionLoading } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!session?.user) {
        if (!cancelled) {
          setUser(null)
          setIsLoading(sessionLoading)
        }
        return
      }
      try {
        const res = await api.get<{ user: User }>('/auth/me')
        if (!cancelled) {
          setUser(res.user)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setUser(null)
          setIsLoading(false)
          if (!(err instanceof ApiError) || err.status !== 401) {
            console.error('[auth] failed to load /auth/me', err)
          }
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id, sessionLoading])

  return { user, session: session?.user ?? null, isLoading }
}
