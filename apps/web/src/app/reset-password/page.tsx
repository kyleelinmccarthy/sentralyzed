'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    const result = await authClient.resetPassword({ newPassword: password, token })
    setIsLoading(false)

    if (result.error) {
      setError(result.error.message ?? 'Failed to reset password')
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold text-jet mb-4">Invalid Reset Link</h1>
          <p className="text-french-gray mb-6">
            The link is missing a token. Request a new password reset.
          </p>
          <Link href="/forgot-password" className="text-indigo hover:underline">
            Reset password
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-jet">Choose a new password</h1>
        </div>

        {done ? (
          <div className="text-center">
            <p className="text-sm text-teal mb-4">Password updated. Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error ? (
              <div className="p-3 bg-lavender-blush text-coral text-sm rounded-[8px]">{error}</div>
            ) : null}

            <Input
              id="password"
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <Input
              id="confirm"
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Update Password
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
