'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password']

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated && !isPublicPath) {
      router.replace('/login')
    }

    if (isAuthenticated && isPublicPath) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, isPublicPath, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-indigo border-t-transparent rounded-full" />
      </div>
    )
  }

  return <>{children}</>
}
