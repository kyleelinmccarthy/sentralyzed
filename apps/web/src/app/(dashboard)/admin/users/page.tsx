'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'member'
  isActive: boolean
  emailVerified: boolean
  createdAt: string
}

interface Invitation {
  id: string
  email: string
  role: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [tab, setTab] = useState<'users' | 'invitations'>('users')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member'>('member')
  const [inviteToken, setInviteToken] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersData, invData] = await Promise.all([
        api.get<{ users: AdminUser[] }>('/admin/users'),
        api.get<{ invitations: Invitation[] }>('/admin/invitations'),
      ])
      setUsers(usersData.users)
      setInvitations(invData.invitations)
    } catch {
      // May not be admin
    } finally {
      setIsLoading(false)
    }
  }

  const changeRole = async (userId: string, role: string) => {
    await api.patch(`/admin/users/${userId}`, { role })
    void loadData()
  }

  const toggleActive = async (userId: string, isActive: boolean) => {
    if (!confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'reactivate'} this user?`))
      return
    await api.patch(`/admin/users/${userId}`, { isActive: !isActive })
    void loadData()
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return
    try {
      const data = await api.post<{ invitation: { token: string } }>('/admin/invitations', {
        email: inviteEmail,
        role: inviteRole,
      })
      setInviteToken(data.invitation.token)
      setInviteEmail('')
      void loadData()
    } catch {
      alert('Failed to send invitation')
    }
  }

  const revokeInvite = async (id: string) => {
    if (!confirm('Revoke this invitation?')) return
    await api.delete(`/admin/invitations/${id}`)
    void loadData()
  }

  if (isLoading) return <div className="animate-pulse text-french-gray">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-jet mb-6">User Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('users')}
          className={`text-sm font-medium pb-1 ${tab === 'users' ? 'text-indigo border-b-2 border-indigo' : 'text-french-gray'}`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab('invitations')}
          className={`text-sm font-medium pb-1 ${tab === 'invitations' ? 'text-indigo border-b-2 border-indigo' : 'text-french-gray'}`}
        >
          Invitations ({invitations.length})
        </button>
      </div>

      {tab === 'users' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-french-gray">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-jet">{u.name}</td>
                    <td className="px-4 py-3 text-french-gray">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => void changeRole(u.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-teal/10 text-teal' : 'bg-coral/10 text-coral'}`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-french-gray">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void toggleActive(u.id, u.isActive)}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div>
          {/* Send invitation */}
          <Card className="p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3">Send Invitation</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'manager' | 'member')}
                className="border border-french-gray rounded-[8px] px-3 text-sm"
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <Button onClick={() => void sendInvite()}>Send Invite</Button>
            </div>
            {inviteToken && (
              <div className="mt-3 p-3 bg-mint rounded-[8px] text-sm">
                <p className="font-medium text-teal">Invitation created!</p>
                <p className="text-xs mt-1 break-all">
                  Registration link: {typeof window !== 'undefined' ? window.location.origin : ''}
                  /register?token={inviteToken}
                </p>
              </div>
            )}
          </Card>

          {/* Invitation list */}
          <Card>
            {invitations.length === 0 ? (
              <p className="p-6 text-sm text-french-gray text-center">No invitations.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-french-gray">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3">{inv.email}</td>
                      <td className="px-4 py-3">{inv.role}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            inv.acceptedAt
                              ? 'bg-teal/10 text-teal'
                              : new Date(inv.expiresAt) < new Date()
                                ? 'bg-coral/10 text-coral'
                                : 'bg-indigo/10 text-indigo'
                          }`}
                        >
                          {inv.acceptedAt
                            ? 'Accepted'
                            : new Date(inv.expiresAt) < new Date()
                              ? 'Expired'
                              : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-french-gray">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {!inv.acceptedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void revokeInvite(inv.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
