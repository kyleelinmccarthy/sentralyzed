'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

interface Assignment {
  id: string
  entityType: string
  entityId: string
  userId: string
  role: string | null
  assignedBy: string
  createdAt: string
}

const ROLES = ['assignee', 'owner', 'reviewer', 'collaborator', 'viewer'] as const

interface UserAssignmentPickerProps {
  entityType: string
  entityId: string
  onUpdate?: () => void
}

export function UserAssignmentPicker({
  entityType,
  entityId,
  onUpdate,
}: UserAssignmentPickerProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('assignee')
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)

  const load = useCallback(async () => {
    try {
      const [assignmentData, userData] = await Promise.all([
        api.get<{ assignments: Assignment[] }>(`/assignments/entity/${entityType}/${entityId}`),
        api.get<{ users: User[] }>('/chat/users'),
      ])
      setAssignments(assignmentData.assignments)
      setUsers(userData.users)
    } catch {
      // ignore load errors
    } finally {
      setIsLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    void load()
  }, [load])

  const assignedUserIds = new Set(assignments.map((a) => a.userId))
  const availableUsers = users.filter((u) => !assignedUserIds.has(u.id))

  const handleAssign = async () => {
    if (!selectedUserId) return
    setIsAssigning(true)
    try {
      await api.post('/assignments', {
        entityType,
        entityId,
        userId: selectedUserId,
        role: selectedRole,
      })
      setSelectedUserId('')
      await load()
      onUpdate?.()
    } catch {
      // ignore
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemove = async (assignmentId: string) => {
    try {
      await api.delete(`/assignments/${assignmentId}`)
      await load()
      onUpdate?.()
    } catch {
      // ignore
    }
  }

  const handleRoleChange = async (assignmentId: string, role: string) => {
    try {
      await api.patch(`/assignments/${assignmentId}`, { role })
      await load()
      onUpdate?.()
    } catch {
      // ignore
    }
  }

  if (isLoading) {
    return <div className="text-sm text-french-gray">Loading assignments...</div>
  }

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user?.name ?? 'Unknown'
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-jet dark:text-dark-text">Assigned Users</h4>

      {assignments.length === 0 && <p className="text-xs text-french-gray">No users assigned</p>}

      <div className="space-y-2">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="flex items-center gap-2 rounded-lg border border-light-border dark:border-dark-border p-2"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo/10 text-xs font-medium text-indigo">
              {getUserName(assignment.userId).charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 text-sm text-jet dark:text-dark-text truncate">
              {getUserName(assignment.userId)}
            </span>
            <select
              value={assignment.role ?? 'assignee'}
              onChange={(e) => handleRoleChange(assignment.id, e.target.value)}
              className="rounded border border-light-border dark:border-dark-border px-1.5 py-0.5 text-xs bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-indigo/20"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleRemove(assignment.id)}
              className="text-french-gray hover:text-coral text-sm transition-colors"
              title="Remove assignment"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {availableUsers.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 rounded-lg border border-light-border dark:border-dark-border px-2 py-1.5 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/20"
          >
            <option value="">Select user...</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-lg border border-light-border dark:border-dark-border px-2 py-1.5 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/20"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={handleAssign} isLoading={isAssigning}>
            Assign
          </Button>
        </div>
      )}
    </div>
  )
}
