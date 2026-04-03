'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Mail, Building2, Phone } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  status: 'lead' | 'active' | 'inactive' | 'churned'
  createdAt: string
}

const statusColors: Record<string, string> = {
  lead: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  active: 'bg-teal/15 text-teal dark:text-teal',
  inactive: 'bg-french-gray/15 text-french-gray',
  churned: 'bg-coral/15 text-coral',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[+]?[\d\s\-().]{7,50}$/

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void loadClients()
  }, [filterStatus])

  const loadClients = async () => {
    try {
      const url = filterStatus ? `/clients?status=${filterStatus}` : '/clients'
      const data = await api.get<{ clients: Client[] }>(url)
      setClients(data.clients)
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (email && !emailRegex.test(email)) newErrors.email = 'Invalid email address'
    if (phone && !phoneRegex.test(phone)) newErrors.phone = 'Invalid phone number'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const createClient = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      await api.post('/clients', {
        name,
        ...(email && { email }),
        ...(company && { company }),
        ...(phone && { phone }),
      })
      setName('')
      setEmail('')
      setCompany('')
      setPhone('')
      setErrors({})
      setShowForm(false)
      void loadClients()
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Failed to create client' })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse text-french-gray dark:text-dark-text-secondary">
        Loading clients...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet dark:text-dark-text">Clients</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} strokeWidth={1.5} className="mr-1.5" />
          {showForm ? 'Cancel' : 'New Client'}
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {['', 'lead', 'active', 'inactive', 'churned'].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(status)}
          >
            {status || 'All'}
          </Button>
        ))}
      </div>

      {showForm ? (
        <Card className="p-4 mb-6">
          <div className="space-y-3">
            {errors.form ? <p className="text-sm text-coral">{errors.form}</p> : null}
            <div>
              <Input
                placeholder="Client name *"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrors((prev) => {
                    const { name: _, ...rest } = prev
                    return rest
                  })
                }}
              />
              {errors.name ? <p className="text-xs text-coral mt-1">{errors.name}</p> : null}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors((prev) => {
                      const { email: _, ...rest } = prev
                      return rest
                    })
                  }}
                />
                {errors.email ? <p className="text-xs text-coral mt-1">{errors.email}</p> : null}
              </div>
              <Input
                placeholder="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <div>
                <Input
                  placeholder="Phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setErrors((prev) => {
                      const { phone: _, ...rest } = prev
                      return rest
                    })
                  }}
                />
                {errors.phone ? <p className="text-xs text-coral mt-1">{errors.phone}</p> : null}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void createClient()} disabled={saving}>
                {saving ? 'Creating...' : 'Create Client'}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {clients.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-french-gray dark:text-dark-text-secondary text-center">
            No clients yet. Add one to get started.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="p-5 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-jet dark:text-dark-text">
                    {client.name}
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[client.status]}`}
                  >
                    {client.status}
                  </span>
                </div>
                {client.company ? (
                  <div className="flex items-center gap-1.5 text-sm text-slate-gray dark:text-dark-text-secondary mb-1">
                    <Building2 size={14} strokeWidth={1.5} />
                    {client.company}
                  </div>
                ) : null}
                {client.email ? (
                  <div className="flex items-center gap-1.5 text-sm text-slate-gray dark:text-dark-text-secondary mb-1">
                    <Mail size={14} strokeWidth={1.5} />
                    {client.email}
                  </div>
                ) : null}
                {client.phone ? (
                  <div className="flex items-center gap-1.5 text-sm text-slate-gray dark:text-dark-text-secondary">
                    <Phone size={14} strokeWidth={1.5} />
                    {client.phone}
                  </div>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
