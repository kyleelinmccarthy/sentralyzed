'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Better Auth always returns success even if the email doesn't exist
    // (prevents user enumeration). The reset email is sent server-side.
    await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    })
    setSubmitted(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-jet">Reset Password</h1>
          <p className="text-sm text-french-gray mt-2">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        {submitted ? (
          <div className="text-center">
            <p className="text-sm text-teal mb-4">
              If an account exists with that email, you&apos;ll receive a reset link.
            </p>
            <Link href="/login" className="text-sm text-indigo hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@solvre.tech"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send Reset Link
            </Button>
            <p className="text-center">
              <Link href="/login" className="text-sm text-indigo hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  )
}
