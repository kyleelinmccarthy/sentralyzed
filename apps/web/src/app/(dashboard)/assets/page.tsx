'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Package, User, FolderKanban, Building2 } from 'lucide-react'
import { useAssets } from '@/hooks/use-assets'
import { api } from '@/lib/api'
import { ASSET_STATUSES, ASSET_CATEGORIES } from '@sentral/shared/types/asset'
import type { AssetCategory, AssetStatus } from '@sentral/shared/types/asset'

interface Project {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

interface TeamMember {
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

export default function AssetsPage() {
  const { assets, isLoading, filters, setFilters, createAsset } = useAssets()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<AssetCategory>('laptop')
  const [serialNumber, setSerialNumber] = useState('')
  const [purchaseCostCents, setPurchaseCostCents] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [clientId, setClientId] = useState('')
  const [assetStatus, setAssetStatus] = useState<AssetStatus>('available')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [warrantyExpiresAt, setWarrantyExpiresAt] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [projectsData, clientsData, usersData] = await Promise.all([
          api.get<{ projects: Project[] }>('/projects'),
          api.get<{ clients: Client[] }>('/clients'),
          api.get<{ users: TeamMember[] }>('/assignments/users'),
        ])
        setProjects(projectsData.projects)
        setClients(clientsData.clients)
        setTeamMembers(usersData.users)
      } catch {
        // Dropdowns are optional
      }
    }
    void loadDropdownData()
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createAsset({
        name: name.trim(),
        category,
        status: assetStatus,
        ...(serialNumber && { serialNumber: serialNumber.trim() }),
        ...(purchaseCostCents && {
          purchaseCostCents: Math.round(parseFloat(purchaseCostCents) * 100),
        }),
        ...(description && { description: description.trim() }),
        ...(projectId && { projectId }),
        ...(clientId && { clientId }),
        ...(purchaseDate && { purchaseDate }),
        ...(warrantyExpiresAt && { warrantyExpiresAt: new Date(warrantyExpiresAt).toISOString() }),
        ...(assignedToId && { assignedToId }),
        ...(notes.trim() && { notes: notes.trim() }),
      })
      setName('')
      setCategory('laptop')
      setAssetStatus('available')
      setSerialNumber('')
      setPurchaseCostCents('')
      setDescription('')
      setProjectId('')
      setClientId('')
      setPurchaseDate('')
      setWarrantyExpiresAt('')
      setAssignedToId('')
      setNotes('')
      setShowForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create asset')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse text-french-gray dark:text-dark-text-secondary">
        Loading assets...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet dark:text-dark-text">Assets</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} strokeWidth={1.5} className="mr-1.5" />
          {showForm ? 'Cancel' : 'New Asset'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex gap-2">
          {['', ...ASSET_STATUSES].map((status) => (
            <Button
              key={status}
              variant={filters.status === (status || undefined) ? 'primary' : 'outline'}
              size="sm"
              onClick={() =>
                setFilters({ ...filters, status: (status as AssetStatus) || undefined })
              }
            >
              {status ? status.replace('_', ' ') : 'All'}
            </Button>
          ))}
        </div>
        <select
          value={filters.category || ''}
          onChange={(e) =>
            setFilters({ ...filters, category: (e.target.value as AssetCategory) || undefined })
          }
          className="px-3 py-1.5 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-xs text-jet dark:text-dark-text"
        >
          <option value="">All categories</option>
          {ASSET_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {categoryLabels[cat]}
            </option>
          ))}
        </select>
        <Input
          placeholder="Search assets..."
          value={filters.search || ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
          className="max-w-[200px] text-xs"
        />
      </div>

      {/* Create Form */}
      {showForm ? (
        <Card className="p-4 mb-6">
          <div className="space-y-3">
            {error ? <p className="text-sm text-coral">{error}</p> : null}
            <Input
              placeholder="Asset name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AssetCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                >
                  {ASSET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Status
                </label>
                <select
                  value={assetStatus}
                  onChange={(e) => setAssetStatus(e.target.value as AssetStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                >
                  {ASSET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Serial Number (optional)
                </label>
                <Input
                  placeholder="Serial number"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Purchase Cost ($, optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={purchaseCostCents}
                  onChange={(e) => setPurchaseCostCents(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Purchase Date (optional)
                </label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Warranty Expires (optional)
                </label>
                <Input
                  type="date"
                  value={warrantyExpiresAt}
                  onChange={(e) => setWarrantyExpiresAt(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Assigned To (optional)
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              {projects.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                    Project (optional)
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {clients.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                    Client (optional)
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                  >
                    <option value="">No client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-indigo/30"
            />
            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-indigo/30"
            />
            <div className="flex justify-end">
              <Button onClick={() => void handleCreate()} disabled={saving}>
                {saving ? 'Creating...' : 'Create Asset'}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Asset Grid */}
      {assets.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-french-gray dark:text-dark-text-secondary text-center">
            No assets yet. Add one to get started.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {assets.map((asset) => (
            <Link key={asset.id} href={`/assets/${asset.id}`}>
              <Card className="p-5 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package size={16} strokeWidth={1.5} className="text-indigo" />
                    <h3 className="text-base font-semibold text-jet dark:text-dark-text">
                      {asset.name}
                    </h3>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[asset.status]}`}
                  >
                    {asset.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-gray dark:text-dark-text-secondary">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo/10 text-indigo capitalize">
                    {categoryLabels[asset.category]}
                  </span>
                  {asset.purchaseCostCents ? (
                    <span>{formatCents(asset.purchaseCostCents)}</span>
                  ) : null}
                </div>
                {asset.serialNumber ? (
                  <p className="text-xs text-french-gray dark:text-dark-text-secondary mt-2">
                    S/N: {asset.serialNumber}
                  </p>
                ) : null}
                <div className="flex items-center gap-3 mt-2 text-xs text-french-gray dark:text-dark-text-secondary">
                  {asset.assignedToId ? (
                    <span className="flex items-center gap-1">
                      <User size={12} strokeWidth={1.5} />
                      Assigned
                    </span>
                  ) : null}
                  {asset.projectId ? (
                    <span className="flex items-center gap-1">
                      <FolderKanban size={12} strokeWidth={1.5} />
                      Linked to project
                    </span>
                  ) : null}
                  {asset.clientId ? (
                    <span className="flex items-center gap-1">
                      <Building2 size={12} strokeWidth={1.5} />
                      Linked to client
                    </span>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
