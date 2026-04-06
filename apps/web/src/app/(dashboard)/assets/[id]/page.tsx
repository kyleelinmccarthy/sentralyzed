'use client'

import { useState, useEffect, use } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Package, FolderKanban, Building2 } from 'lucide-react'
import Link from 'next/link'
import { UserAssignmentPicker } from '@/components/assignments/UserAssignmentPicker'
import { ASSET_STATUSES, ASSET_CATEGORIES } from '@sentral/shared/types/asset'
import type { Asset, AssetStatus, AssetCategory } from '@sentral/shared/types/asset'
import type { Expense } from '@sentral/shared/types/expense'

interface Project {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

const statusColors: Record<AssetStatus, string> = {
  available: 'bg-teal/15 text-teal dark:text-teal',
  in_use: 'bg-indigo/15 text-indigo dark:text-indigo',
  maintenance: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  retired: 'bg-french-gray/15 text-french-gray',
}

const categoryLabels: Record<AssetCategory, string> = {
  laptop: 'Laptop',
  monitor: 'Monitor',
  phone: 'Phone',
  tablet: 'Tablet',
  peripheral: 'Peripheral',
  furniture: 'Furniture',
  vehicle: 'Vehicle',
  software_license: 'Software License',
  equipment: 'Equipment',
  other: 'Other',
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [linkedExpenses, setLinkedExpenses] = useState<Expense[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Asset>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadData()
  }, [id])

  const loadData = async () => {
    const [assetData, expensesData, projectsData, clientsData] = await Promise.all([
      api.get<{ asset: Asset }>(`/assets/${id}`),
      api.get<{ expenses: Expense[] }>(`/assets/${id}/expenses`),
      api.get<{ projects: Project[] }>('/projects'),
      api.get<{ clients: Client[] }>('/clients'),
    ])
    setAsset(assetData.asset)
    setLinkedExpenses(expensesData.expenses)
    setProjects(projectsData.projects)
    setClients(clientsData.clients)
  }

  const saveEdit = async () => {
    if (!asset) return
    setSaving(true)
    setError('')
    try {
      const data = await api.patch<{ asset: Asset }>(`/assets/${id}`, editData)
      setAsset(data.asset)
      setIsEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (status: AssetStatus) => {
    setSaving(true)
    try {
      const data = await api.patch<{ asset: Asset }>(`/assets/${id}`, { status })
      setAsset(data.asset)
    } finally {
      setSaving(false)
    }
  }

  if (!asset) {
    return (
      <div className="animate-pulse text-french-gray dark:text-dark-text-secondary">Loading...</div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/assets">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Package size={20} strokeWidth={1.5} className="text-indigo" />
            <h1 className="text-2xl font-bold text-jet dark:text-dark-text">{asset.name}</h1>
          </div>
          <p className="text-sm text-french-gray dark:text-dark-text-secondary">
            {categoryLabels[asset.category]}
            {asset.serialNumber ? ` \u00B7 S/N: ${asset.serialNumber}` : ''}
          </p>
        </div>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[asset.status]}`}
        >
          {asset.status.replace('_', ' ')}
        </span>
        <Button
          variant={isEditing ? 'primary' : 'outline'}
          disabled={saving}
          onClick={() => {
            if (isEditing) {
              void saveEdit()
            } else {
              setEditData({
                name: asset.name,
                description: asset.description,
                category: asset.category,
                serialNumber: asset.serialNumber,
                purchaseCostCents: asset.purchaseCostCents,
                notes: asset.notes,
                projectId: asset.projectId,
                clientId: asset.clientId,
              })
              setError('')
              setIsEditing(true)
            }
          }}
        >
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Asset'}
        </Button>
      </div>

      {/* Status Actions */}
      <Card className="p-4 mb-6">
        <h2 className="text-sm font-semibold text-slate-gray dark:text-dark-text-secondary uppercase tracking-wider mb-3">
          Status Actions
        </h2>
        <div className="flex gap-2">
          {ASSET_STATUSES.filter((s) => s !== asset.status).map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => void updateStatus(status)}
            >
              Mark {status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </Card>

      {/* Assignments */}
      <Card className="p-4 mb-6">
        <UserAssignmentPicker entityType="asset" entityId={id} />
      </Card>

      {/* Details */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card className="col-span-2 p-5">
          <h2 className="text-sm font-semibold text-slate-gray dark:text-dark-text-secondary uppercase tracking-wider mb-4">
            Details
          </h2>
          {error ? <p className="text-sm text-coral mb-3">{error}</p> : null}
          {isEditing ? (
            <div className="space-y-3">
              <Input
                placeholder="Name"
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editData.category || 'laptop'}
                  onChange={(e) =>
                    setEditData({ ...editData, category: e.target.value as AssetCategory })
                  }
                  className="px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text"
                >
                  {ASSET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Serial number"
                  value={editData.serialNumber || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, serialNumber: e.target.value || null })
                  }
                />
              </div>
              <Input
                placeholder="Purchase cost (cents)"
                type="number"
                value={editData.purchaseCostCents || ''}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    purchaseCostCents: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                    Project (optional)
                  </label>
                  <select
                    value={editData.projectId || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, projectId: e.target.value || null })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text"
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                    Client (optional)
                  </label>
                  <select
                    value={editData.clientId || ''}
                    onChange={(e) => setEditData({ ...editData, clientId: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text"
                  >
                    <option value="">No client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea
                placeholder="Description"
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value || null })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text resize-none"
              />
              <textarea
                placeholder="Notes"
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value || null })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text resize-none"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {asset.description ? (
                <div>
                  <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                    Description
                  </p>
                  <p className="text-sm text-jet dark:text-dark-text whitespace-pre-wrap">
                    {asset.description}
                  </p>
                </div>
              ) : null}
              {asset.notes ? (
                <div>
                  <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                    Notes
                  </p>
                  <p className="text-sm text-jet dark:text-dark-text whitespace-pre-wrap">
                    {asset.notes}
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
                Category
              </p>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo/10 text-indigo capitalize">
                {categoryLabels[asset.category]}
              </span>
            </div>
            <div>
              <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                Status
              </p>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[asset.status]}`}
              >
                {asset.status.replace('_', ' ')}
              </span>
            </div>
            {asset.serialNumber ? (
              <div>
                <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                  Serial Number
                </p>
                <p className="text-sm font-mono text-jet dark:text-dark-text">
                  {asset.serialNumber}
                </p>
              </div>
            ) : null}
            {asset.purchaseCostCents ? (
              <div>
                <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                  Purchase Cost
                </p>
                <p className="text-sm font-medium text-jet dark:text-dark-text">
                  {formatCents(asset.purchaseCostCents)}
                </p>
              </div>
            ) : null}
            {asset.purchaseDate ? (
              <div>
                <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                  Purchase Date
                </p>
                <p className="text-sm text-jet dark:text-dark-text">
                  {new Date(asset.purchaseDate).toLocaleDateString()}
                </p>
              </div>
            ) : null}
            {asset.warrantyExpiresAt ? (
              <div>
                <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                  Warranty Expires
                </p>
                <p className="text-sm text-jet dark:text-dark-text">
                  {new Date(asset.warrantyExpiresAt).toLocaleDateString()}
                </p>
              </div>
            ) : null}
            {asset.projectId ? (
              <div>
                <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                  Project
                </p>
                <Link
                  href={`/projects/${asset.projectId}`}
                  className="flex items-center gap-1.5 text-sm text-indigo hover:underline"
                >
                  <FolderKanban size={14} strokeWidth={1.5} />
                  {projects.find((p) => p.id === asset.projectId)?.name || 'View project'}
                </Link>
              </div>
            ) : null}
            {asset.clientId ? (
              <div>
                <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                  Client
                </p>
                <Link
                  href={`/clients/${asset.clientId}`}
                  className="flex items-center gap-1.5 text-sm text-indigo hover:underline"
                >
                  <Building2 size={14} strokeWidth={1.5} />
                  {clients.find((c) => c.id === asset.clientId)?.name || 'View client'}
                </Link>
              </div>
            ) : null}
            <div>
              <p className="text-xs text-french-gray dark:text-dark-text-secondary mb-0.5">
                Linked Expenses
              </p>
              <p className="text-sm font-medium text-jet dark:text-dark-text">
                {linkedExpenses.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Linked Expenses */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-gray dark:text-dark-text-secondary uppercase tracking-wider mb-4">
          Linked Expenses
        </h2>
        {linkedExpenses.length === 0 ? (
          <p className="text-sm text-french-gray dark:text-dark-text-secondary text-center py-4">
            No expenses linked to this asset.
          </p>
        ) : (
          <div className="space-y-1">
            {linkedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-jet dark:text-dark-text">
                    {expense.description}
                  </p>
                  <p className="text-xs text-french-gray dark:text-dark-text-secondary">
                    {expense.date} \u00B7 {expense.category.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-jet dark:text-dark-text">
                    {formatCents(expense.amountCents)}
                  </p>
                  <span
                    className={`text-xs capitalize ${
                      expense.status === 'approved'
                        ? 'text-teal'
                        : expense.status === 'rejected'
                          ? 'text-coral'
                          : 'text-amber-500'
                    }`}
                  >
                    {expense.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
