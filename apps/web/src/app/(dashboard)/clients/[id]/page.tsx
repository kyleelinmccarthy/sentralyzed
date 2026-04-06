'use client'

import { useState, useEffect, use } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { UserAssignmentPicker } from '@/components/assignments/UserAssignmentPicker'
import { FileAttachments } from '@/components/files/FileAttachments'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  status: 'lead' | 'active' | 'inactive' | 'churned'
}

interface ClientProject {
  id: string
  clientId: string
  projectId: string
  role: string
  startDate: string | null
  endDate: string | null
}

interface Project {
  id: string
  name: string
  status: string
  icon: string
}

const statusOptions = ['lead', 'active', 'inactive', 'churned'] as const
const roleOptions = ['sponsor', 'stakeholder', 'end_user'] as const

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

function stripPhoneFormatting(value: string): string {
  return value.replace(/\D/g, '')
}

function isValidPhone(value: string): boolean {
  const digits = stripPhoneFormatting(value)
  return digits.length === 0 || digits.length === 10
}

const statusColors: Record<string, string> = {
  lead: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  active: 'bg-teal/15 text-teal dark:text-teal',
  inactive: 'bg-french-gray/15 text-french-gray',
  churned: 'bg-coral/15 text-coral',
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [client, setClient] = useState<Client | null>(null)
  const [clientProjects, setClientProjects] = useState<ClientProject[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Client>>({})
  const [showAddProject, setShowAddProject] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('stakeholder')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void loadData()
  }, [id])

  const loadData = async () => {
    const [clientData, projectsData, allProjectsData] = await Promise.all([
      api.get<{ client: Client }>(`/clients/${id}`),
      api.get<{ clientProjects: ClientProject[] }>(`/clients/${id}/projects`),
      api.get<{ projects: Project[] }>('/projects'),
    ])
    setClient(clientData.client)
    setClientProjects(projectsData.clientProjects)
    setAllProjects(allProjectsData.projects)
  }

  const validateEdit = () => {
    const newErrors: Record<string, string> = {}
    if (editData.name !== undefined && !editData.name?.trim()) newErrors.name = 'Name is required'
    if (editData.email && !emailRegex.test(editData.email))
      newErrors.email = 'Invalid email address'
    if (editData.phone && !isValidPhone(editData.phone))
      newErrors.phone = 'Phone number must be 10 digits'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveEdit = async () => {
    if (!client) return
    if (!validateEdit()) return
    setSaving(true)
    try {
      const payload = {
        ...editData,
        ...(editData.phone ? { phone: stripPhoneFormatting(editData.phone) || null } : {}),
      }
      const data = await api.patch<{ client: Client }>(`/clients/${id}`, payload)
      setClient(data.client)
      setErrors({})
      setIsEditing(false)
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  const addProject = async () => {
    if (!selectedProjectId) return
    await api.post(`/clients/${id}/projects`, {
      projectId: selectedProjectId,
      role: selectedRole,
    })
    setSelectedProjectId('')
    setShowAddProject(false)
    void loadData()
  }

  const removeProject = async (projectId: string) => {
    await api.delete(`/clients/${id}/projects/${projectId}`)
    void loadData()
  }

  if (!client) {
    return (
      <div className="animate-pulse text-french-gray dark:text-dark-text-secondary">Loading...</div>
    )
  }

  const associatedProjectIds = new Set(clientProjects.map((cp) => cp.projectId))
  const availableProjects = allProjects.filter((p) => !associatedProjectIds.has(p.id))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-jet dark:text-dark-text">{client.name}</h1>
          {client.company ? (
            <p className="text-sm text-french-gray dark:text-dark-text-secondary">
              {client.company}
            </p>
          ) : null}
        </div>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[client.status]}`}
        >
          {client.status}
        </span>
        <Button
          variant={isEditing ? 'primary' : 'outline'}
          disabled={saving}
          onClick={() => {
            if (isEditing) {
              void saveEdit()
            } else {
              setEditData({
                name: client.name,
                email: client.email,
                phone: client.phone ? formatPhoneNumber(client.phone) : null,
                company: client.company,
                notes: client.notes,
                status: client.status,
              })
              setErrors({})
              setIsEditing(true)
            }
          }}
        >
          {saving ? (
            'Saving...'
          ) : isEditing ? (
            'Save Changes'
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Client
            </>
          )}
        </Button>
      </div>

      {/* Assigned Users */}
      <Card className="p-4 mb-6">
        <UserAssignmentPicker entityType="client" entityId={id} />
      </Card>

      {/* File Attachments */}
      <Card className="p-4 mb-6">
        <FileAttachments entityType="client" entityId={id} />
      </Card>

      {/* Client Details */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card className="col-span-2 p-5">
          <h2 className="text-sm font-semibold text-slate-gray dark:text-dark-text-secondary uppercase tracking-wider mb-4">
            Details
          </h2>
          {isEditing ? (
            <div className="space-y-3">
              {errors.form ? <p className="text-sm text-coral">{errors.form}</p> : null}
              <div>
                <Input
                  placeholder="Name"
                  value={editData.name || ''}
                  onChange={(e) => {
                    setEditData({ ...editData, name: e.target.value })
                    setErrors((prev) => {
                      const { name: _, ...rest } = prev
                      return rest
                    })
                  }}
                />
                {errors.name ? <p className="text-xs text-coral mt-1">{errors.name}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    placeholder="Email"
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => {
                      setEditData({ ...editData, email: e.target.value || null })
                      setErrors((prev) => {
                        const { email: _, ...rest } = prev
                        return rest
                      })
                    }}
                  />
                  {errors.email ? <p className="text-xs text-coral mt-1">{errors.email}</p> : null}
                </div>
                <div>
                  <Input
                    placeholder="Phone"
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value)
                      setEditData({ ...editData, phone: formatted || null })
                      setErrors((prev) => {
                        const { phone: _, ...rest } = prev
                        return rest
                      })
                    }}
                  />
                  {errors.phone ? <p className="text-xs text-coral mt-1">{errors.phone}</p> : null}
                </div>
              </div>
              <Input
                placeholder="Company"
                value={editData.company || ''}
                onChange={(e) => setEditData({ ...editData, company: e.target.value || null })}
              />
              <select
                value={editData.status || 'lead'}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value as Client['status'] })
                }
                className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Notes"
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value || null })}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text resize-none"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                    Email
                  </p>
                  <p className="text-sm text-jet dark:text-dark-text">{client.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                    Phone
                  </p>
                  <p className="text-sm text-jet dark:text-dark-text">
                    {client.phone ? formatPhoneNumber(client.phone) : '—'}
                  </p>
                </div>
              </div>
              {client.notes ? (
                <div>
                  <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                    Notes
                  </p>
                  <p className="text-sm text-jet dark:text-dark-text whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </Card>

        {/* Quick Info */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-gray dark:text-dark-text-secondary uppercase tracking-wider mb-4">
            Info
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                Status
              </p>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[client.status]}`}
              >
                {client.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                Projects
              </p>
              <p className="text-sm font-medium text-jet dark:text-dark-text">
                {clientProjects.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Associated Projects */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-gray dark:text-dark-text-secondary uppercase tracking-wider">
            Associated Projects
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowAddProject(!showAddProject)}>
            <Plus size={14} strokeWidth={1.5} className="mr-1" />
            {showAddProject ? 'Cancel' : 'Add Project'}
          </Button>
        </div>

        {showAddProject && availableProjects.length > 0 ? (
          <div className="flex gap-2 mb-4 p-3 bg-light-hover dark:bg-dark-hover rounded-lg">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text"
            >
              <option value="">Select a project...</option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r.replace('_', ' ')}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={() => void addProject()}>
              Add
            </Button>
          </div>
        ) : null}

        {clientProjects.length === 0 ? (
          <p className="text-sm text-french-gray dark:text-dark-text-secondary text-center py-4">
            No projects associated yet.
          </p>
        ) : (
          <div className="space-y-1">
            {clientProjects.map((cp) => {
              const project = allProjects.find((p) => p.id === cp.projectId)
              return (
                <div
                  key={cp.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
                >
                  <span className="text-base">{project?.icon || '◈'}</span>
                  <Link
                    href={`/projects/${cp.projectId}`}
                    className="flex-1 text-sm font-medium text-jet dark:text-dark-text hover:text-indigo transition-colors"
                  >
                    {project?.name || cp.projectId}
                  </Link>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo/10 text-indigo capitalize">
                    {cp.role.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => void removeProject(cp.projectId)}
                    className="text-french-gray hover:text-coral transition-colors p-1"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
