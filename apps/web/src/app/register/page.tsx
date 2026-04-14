'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { api, ApiError } from '@/lib/api'

interface InviteInfo {
  email: string
  role: 'admin' | 'manager' | 'member'
}

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token') || ''
  const { register } = useAuthStore()

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [inviteError, setInviteError] = useState('')
  const [validating, setValidating] = useState(true)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!inviteToken) {
      setValidating(false)
      return
    }
    api
      .get<InviteInfo>(`/auth/invitations/${encodeURIComponent(inviteToken)}`)
      .then((data) => setInvite(data))
      .catch((err) => setInviteError(err instanceof ApiError ? err.message : 'Invalid invitation'))
      .finally(() => setValidating(false))
  }, [inviteToken])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!invite) return
    setError('')
    setIsLoading(true)

    try {
      await register({ email: invite.email, name, password, inviteToken })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!inviteToken || (!validating && (inviteError || !invite))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold text-jet mb-4">Invitation Required</h1>
          <p className="text-french-gray mb-6">
            {inviteError || 'You need an invitation link to create an email account.'}
          </p>
          <p className="text-sm text-french-gray">
            Have a Google account?{' '}
            <Link href="/login" className="text-indigo hover:underline">
              Sign in with Google
            </Link>{' '}
            instead — no invitation needed.
          </p>
        </Card>
      </div>
    )
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-indigo border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/sentral_logo.png" alt="Sentral" className="h-10 w-auto" />
            <h1 className="text-3xl font-bold text-jet font-[family-name:var(--font-heading)]">
              Sentral
            </h1>
          </div>
          <p className="text-sm text-french-gray mt-2">Create your account ({invite!.role})</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error ? (
            <div className="p-3 bg-lavender-blush text-coral text-sm rounded-[8px]">{error}</div>
          ) : null}

          <Input id="email" label="Email" type="email" value={invite!.email} disabled readOnly />

          <Input
            id="name"
            label="Full Name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
