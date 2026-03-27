'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ApiError } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function LoginPage() {
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-jet font-[family-name:var(--font-heading)]">
            Sentralyzed
          </h1>
          <p className="text-sm text-french-gray mt-2">Sign in to your workspace</p>
        </div>

        {/* Google OAuth */}
        <a
          href={`${API_URL}/auth/google`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-french-gray rounded-[8px] text-sm font-medium text-jet hover:bg-gray-50 transition-colors mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </a>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-french-gray">or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error ? (
            <div className="p-3 bg-lavender-blush text-coral text-sm rounded-[8px]">{error}</div>
          ) : null}

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@solvre.tech"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-french-gray mt-6">
          <Link href="/forgot-password" className="text-indigo hover:underline">
            Forgot password?
          </Link>
        </p>
      </Card>
    </div>
  )
}
