'use client'

import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ApiError } from '@/lib/api'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token') || ''
  const { register } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await register({ email, name, password, inviteToken })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold text-jet mb-4">Invitation Required</h1>
          <p className="text-french-gray">
            You need an invitation link to create an account. Contact your team admin.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-jet">Join Sentralyzed</h1>
          <p className="text-sm text-french-gray mt-2">Create your account</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error ? (
            <div className="p-3 bg-lavender-blush text-coral text-sm rounded-[8px]">{error}</div>
          ) : null}

          <Input
            id="name"
            label="Full Name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>
      </Card>
    </div>
  )
}
