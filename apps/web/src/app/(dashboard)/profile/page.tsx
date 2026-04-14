'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import { authClient, useSession } from '@/lib/auth-client'
import { api, ApiError } from '@/lib/api'
import {
  Camera,
  Check,
  AlertCircle,
  Monitor,
  Trash2,
  Download,
  Shield,
  X,
  KeyRound,
} from 'lucide-react'

function ProfileInfo() {
  const { user, fetchUser } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user?.name) setName(user.name)
  }, [user?.name])

  const handleSaveName = async () => {
    if (!name.trim() || name === user?.name) return
    setSaving(true)
    setMessage(null)
    try {
      // Update both Better Auth (so the session reflects the new name) and our row.
      await authClient.updateUser({ name: name.trim() })
      await api.patch('/auth/profile', { name: name.trim() })
      await fetchUser()
      setMessage({ type: 'success', text: 'Name updated' })
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to update name'
      setMessage({ type: 'error', text: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-jet dark:text-dark-text mb-4">
        Profile Information
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
            Display Name
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
            />
            <button
              onClick={handleSaveName}
              disabled={saving || !name.trim() || name === user?.name}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo text-white hover:bg-indigo/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-muted dark:bg-dark-card text-french-gray dark:text-dark-text-secondary cursor-not-allowed"
          />
          <p className="text-xs text-french-gray dark:text-dark-text-secondary mt-1">
            Email cannot be changed
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
            Role
          </label>
          <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-indigo/10 text-indigo font-medium">
            {user?.role}
          </span>
        </div>
        {message && (
          <div
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${message.type === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}
          >
            {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            {message.text}
          </div>
        )}
      </div>
    </Card>
  )
}

function ProfilePicture() {
  const { user, fetchUser } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 5MB' })
      return
    }

    setUploading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const data = await api.upload<{ url: string }>('/files/upload', formData)
      await authClient.updateUser({ image: data.url })
      await api.patch('/auth/profile', { avatarUrl: data.url })
      await fetchUser()
      setMessage({ type: 'success', text: 'Profile picture updated' })
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to upload image'
      setMessage({ type: 'error', text: msg })
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setMessage(null)
    try {
      await authClient.updateUser({ image: null })
      await api.patch('/auth/profile', { avatarUrl: null })
      await fetchUser()
      setMessage({ type: 'success', text: 'Profile picture removed' })
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to remove picture'
      setMessage({ type: 'error', text: msg })
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-jet dark:text-dark-text mb-4">Profile Picture</h2>
      <div className="flex items-center gap-5">
        <div className="relative group">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo flex items-center justify-center text-3xl font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <Camera size={20} className="text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
        <div className="space-y-2">
          <label className="block">
            <span className="px-3 py-1.5 text-sm font-medium rounded-lg bg-light-muted dark:bg-dark-card text-jet dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover cursor-pointer transition-colors border border-light-border dark:border-dark-border inline-block">
              {uploading ? 'Uploading...' : 'Upload new picture'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {user?.avatarUrl && (
            <button
              onClick={handleRemove}
              className="block text-sm text-french-gray dark:text-dark-text-secondary hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Remove picture
            </button>
          )}
          <p className="text-xs text-french-gray dark:text-dark-text-secondary">
            JPG, PNG or GIF. Max 5MB.
          </p>
        </div>
      </div>
      {message && (
        <div
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mt-4 ${message.type === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}
        >
          {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}
    </Card>
  )
}

interface AccountInfo {
  id: string
  providerId: string
}

function ChangePassword() {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    authClient
      .listAccounts()
      .then((res: { data?: AccountInfo[] | null }) => {
        const accounts = res.data ?? []
        setHasPassword(accounts.some((a) => a.providerId === 'credential'))
      })
      .catch(() => setHasPassword(false))
  }, [])

  if (hasPassword === null) {
    return (
      <Card className="p-6">
        <p className="text-sm text-french-gray">Loading account info…</p>
      </Card>
    )
  }

  if (!hasPassword) {
    return (
      <Card className="p-6">
        <h2 className="text-base font-semibold text-jet dark:text-dark-text mb-2">Password</h2>
        <p className="text-sm text-french-gray dark:text-dark-text-secondary">
          Your account uses social sign-in. Password management is handled through your identity
          provider.
        </p>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setSaving(true)
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })
    setSaving(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error.message ?? 'Failed to change password' })
      return
    }

    setMessage({ type: 'success', text: 'Password changed successfully' })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-jet dark:text-dark-text mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
          />
          <p className="text-xs text-french-gray dark:text-dark-text-secondary mt-1">
            Minimum 8 characters
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo text-white hover:bg-indigo/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Changing...' : 'Change Password'}
        </button>
        {message && (
          <div
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${message.type === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}
          >
            {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            {message.text}
          </div>
        )}
      </form>
    </Card>
  )
}

interface BetterAuthSession {
  id: string
  token: string
  expiresAt: string | Date
  createdAt: string | Date
  ipAddress?: string | null
  userAgent?: string | null
}

function ActiveSessions() {
  const { data: currentSession } = useSession()
  const [sessions, setSessions] = useState<BetterAuthSession[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchSessions = useCallback(async () => {
    const res = await authClient.listSessions()
    if (res.error) {
      setMessage({ type: 'error', text: res.error.message ?? 'Failed to load sessions' })
    } else {
      setSessions((res.data ?? []) as BetterAuthSession[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchSessions()
  }, [fetchSessions])

  const handleRevoke = async (token: string) => {
    setRevoking(token)
    setMessage(null)
    const res = await authClient.revokeSession({ token })
    setRevoking(null)
    if (res.error) {
      setMessage({ type: 'error', text: res.error.message ?? 'Failed to revoke session' })
    } else {
      setSessions((prev) => prev.filter((s) => s.token !== token))
      setMessage({ type: 'success', text: 'Session revoked' })
    }
  }

  const handleRevokeOthers = async () => {
    setMessage(null)
    const res = await authClient.revokeOtherSessions()
    if (res.error) {
      setMessage({ type: 'error', text: res.error.message ?? 'Failed to revoke sessions' })
    } else {
      const currentToken = currentSession?.session.token
      setSessions((prev) => prev.filter((s) => s.token === currentToken))
      setMessage({ type: 'success', text: 'All other sessions revoked' })
    }
  }

  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-indigo" />
          <h2 className="text-base font-semibold text-jet dark:text-dark-text">Active Sessions</h2>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={handleRevokeOthers}
            className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            Revoke all others
          </button>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-french-gray dark:text-dark-text-secondary">
          Loading sessions...
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isCurrent = session.token === currentSession?.session.token
            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg bg-light-muted dark:bg-dark-bg"
              >
                <div className="flex items-center gap-3">
                  <Monitor
                    size={16}
                    className="text-french-gray dark:text-dark-text-secondary shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-jet dark:text-dark-text">
                        {isCurrent ? 'Current session' : 'Session'}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal/10 text-teal font-medium">
                          This device
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-french-gray dark:text-dark-text-secondary">
                      Created {formatDate(session.createdAt)} &middot; Expires{' '}
                      {formatDate(session.expiresAt)}
                    </p>
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => handleRevoke(session.token)}
                    disabled={revoking === session.token}
                    className="p-1.5 rounded-lg text-french-gray hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Revoke session"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
      {message && (
        <div
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mt-4 ${message.type === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}
        >
          {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}
    </Card>
  )
}

function TwoFactorAuth() {
  const { data: session } = useSession()
  const twoFactorEnabled = (session?.user as { twoFactorEnabled?: boolean } | undefined)
    ?.twoFactorEnabled

  const [showEnable, setShowEnable] = useState(false)
  const [password, setPassword] = useState('')
  const [totpUri, setTotpUri] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleEnable = async () => {
    setBusy(true)
    setMessage(null)
    const res = await authClient.twoFactor.enable({ password })
    setBusy(false)
    if (res.error) {
      setMessage({ type: 'error', text: res.error.message ?? 'Failed to enable 2FA' })
      return
    }
    setTotpUri(res.data?.totpURI ?? null)
    setBackupCodes(res.data?.backupCodes ?? null)
  }

  const handleVerify = async () => {
    setBusy(true)
    setMessage(null)
    const res = await authClient.twoFactor.verifyTotp({ code: verifyCode })
    setBusy(false)
    if (res.error) {
      setMessage({ type: 'error', text: res.error.message ?? 'Invalid code' })
      return
    }
    setMessage({ type: 'success', text: 'Two-factor authentication enabled' })
    setShowEnable(false)
    setTotpUri(null)
    setVerifyCode('')
    setPassword('')
  }

  const handleDisable = async () => {
    setBusy(true)
    setMessage(null)
    const res = await authClient.twoFactor.disable({ password })
    setBusy(false)
    if (res.error) {
      setMessage({ type: 'error', text: res.error.message ?? 'Failed to disable 2FA' })
      return
    }
    setMessage({ type: 'success', text: 'Two-factor authentication disabled' })
    setPassword('')
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound size={16} className="text-indigo" />
        <h2 className="text-base font-semibold text-jet dark:text-dark-text">
          Two-Factor Authentication
        </h2>
      </div>
      <p className="text-sm text-french-gray dark:text-dark-text-secondary mb-4">
        Add an extra layer of security with a TOTP authenticator app (like Google Authenticator,
        1Password, or Authy).
      </p>

      {twoFactorEnabled ? (
        <div className="space-y-3 max-w-md">
          <div className="flex items-center gap-2 text-sm text-teal">
            <Check size={14} /> Enabled
          </div>
          <div>
            <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
              Enter password to disable
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
            />
          </div>
          <button
            onClick={() => void handleDisable()}
            disabled={busy || !password}
            className="px-4 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
          >
            Disable 2FA
          </button>
        </div>
      ) : showEnable ? (
        <div className="space-y-4 max-w-md">
          {!totpUri ? (
            <>
              <div>
                <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
                  Confirm your password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => void handleEnable()}
                  disabled={busy || !password}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo text-white hover:bg-indigo/90 disabled:opacity-50 transition-colors"
                >
                  {busy ? 'Generating…' : 'Continue'}
                </button>
                <button
                  onClick={() => {
                    setShowEnable(false)
                    setPassword('')
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-jet dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-light-muted dark:bg-dark-bg">
                <p className="text-sm font-medium text-jet dark:text-dark-text mb-2">
                  Scan this QR code in your authenticator app
                </p>
                <p className="text-xs text-french-gray break-all font-mono">{totpUri}</p>
                <p className="text-xs text-french-gray dark:text-dark-text-secondary mt-2">
                  (Generate a QR image client-side from this URI, or paste the URI directly into
                  your app.)
                </p>
              </div>
              {backupCodes && backupCodes.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/40">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                    Save these backup codes — each can be used once if you lose your device:
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                    {backupCodes.map((c) => (
                      <code key={c}>{c}</code>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
                  Enter the 6-digit code from your app
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo"
                />
              </div>
              <button
                onClick={() => void handleVerify()}
                disabled={busy || verifyCode.length !== 6}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo text-white hover:bg-indigo/90 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Verifying…' : 'Verify and enable'}
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowEnable(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo text-white hover:bg-indigo/90 transition-colors"
        >
          Enable 2FA
        </button>
      )}

      {message && (
        <div
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mt-4 ${message.type === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}
        >
          {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}
    </Card>
  )
}

function DataExport() {
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setMessage(null)
    try {
      const data = await api.get<Record<string, unknown>>('/auth/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sentral-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Data exported successfully' })
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to export data'
      setMessage({ type: 'error', text: msg })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <Download size={16} className="text-indigo" />
        <h2 className="text-base font-semibold text-jet dark:text-dark-text">Data Export</h2>
      </div>
      <p className="text-sm text-french-gray dark:text-dark-text-secondary mb-4">
        Download a copy of all your data including projects, tasks, goals, messages, and activity
        history as a JSON file.
      </p>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-light-muted dark:bg-dark-card text-jet dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover border border-light-border dark:border-dark-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting ? 'Exporting...' : 'Export my data'}
      </button>
      {message && (
        <div
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mt-4 ${message.type === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}
        >
          {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}
    </Card>
  )
}

function DeleteAccount() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'error'; text: string } | null>(null)

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setMessage(null)
    try {
      // Soft-delete our app data first (anonymize + drop sessions)
      await api.post('/auth/delete-account')
      // Then delete the Better Auth identity record
      await authClient.deleteUser()
      router.push('/login')
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to delete account'
      setMessage({ type: 'error', text: msg })
      setDeleting(false)
    }
  }

  return (
    <Card className="p-6 border-red-200 dark:border-red-900/40">
      <div className="flex items-center gap-2 mb-2">
        <Trash2 size={16} className="text-red-500" />
        <h2 className="text-base font-semibold text-red-600 dark:text-red-400">Delete Account</h2>
      </div>
      <p className="text-sm text-french-gray dark:text-dark-text-secondary mb-4">
        Permanently delete your account and anonymize your data. This action cannot be undone. Your
        content will remain but will no longer be associated with your identity.
      </p>
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete my account
        </button>
      ) : (
        <div className="space-y-4 max-w-md p-4 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Are you sure? This is permanent.
          </p>
          <div>
            <label className="block text-sm font-medium text-jet dark:text-dark-text mb-1.5">
              Type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to
              confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting || confirmText !== 'DELETE'}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? 'Deleting...' : 'Permanently delete'}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false)
                setConfirmText('')
                setMessage(null)
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg text-jet dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
            >
              Cancel
            </button>
          </div>
          {message && (
            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle size={14} />
              {message.text}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-jet dark:text-dark-text mb-6">Profile</h1>
      <div className="space-y-6 max-w-2xl">
        <ProfilePicture />
        <ProfileInfo />
        <ChangePassword />
        <TwoFactorAuth />
        <ActiveSessions />
        <DataExport />
        <DeleteAccount />
      </div>
    </div>
  )
}
