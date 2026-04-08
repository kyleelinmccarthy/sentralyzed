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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [clientStatus, setClientStatus] = useState<Client['status']>('lead')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

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

  const validateField = (field: string, value: string) => {
    if (field === 'name' && !value.trim()) return 'Name is required'
    if (field === 'email' && value && !emailRegex.test(value)) return 'Invalid email address'
    if (field === 'phone' && value && !isValidPhone(value)) return 'Phone number must be 10 digits'
    return ''
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    const nameErr = validateField('name', name)
    const emailErr = validateField('email', email)
    const phoneErr = validateField('phone', phone)
    if (nameErr) newErrors.name = nameErr
    if (emailErr) newErrors.email = emailErr
    if (phoneErr) newErrors.phone = phoneErr
    setErrors(newErrors)
    setTouched({ name: true, email: true, phone: true })
    return Object.keys(newErrors).length === 0
  }

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const err = validateField(field, value)
    setErrors((prev) =>
      err
        ? { ...prev, [field]: err }
        : (() => {
            const { [field]: _, ...rest } = prev
            return rest
          })(),
    )
  }

  const createClient = async () => {
    if (!validateForm()) return
    setSaving(true)
    const rawPhone = stripPhoneFormatting(phone)
    try {
      await api.post('/clients', {
        name: name.trim(),
        ...(email && { email: email.trim() }),
        ...(company && { company: company.trim() }),
        ...(rawPhone && { phone: rawPhone }),
        ...(notes.trim() && { notes: notes.trim() }),
        status: clientStatus,
      })
      setName('')
      setEmail('')
      setCompany('')
      setPhone('')
      setNotes('')
      setClientStatus('lead')
      setErrors({})
      setTouched({})
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
                  if (touched.name) {
                    const err = validateField('name', e.target.value)
                    setErrors((prev) =>
                      err
                        ? { ...prev, name: err }
                        : (() => {
                            const { name: _, ...rest } = prev
                            return rest
                          })(),
                    )
                  }
                }}
                onBlur={() => handleBlur('name', name)}
              />
              {errors.name && touched.name ? (
                <p className="text-xs text-coral mt-1">{errors.name}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Input
                  placeholder="Email (optional)"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (touched.email) {
                      const err = validateField('email', e.target.value)
                      setErrors((prev) =>
                        err
                          ? { ...prev, email: err }
                          : (() => {
                              const { email: _, ...rest } = prev
                              return rest
                            })(),
                      )
                    }
                  }}
                  onBlur={() => handleBlur('email', email)}
                />
                {errors.email && touched.email ? (
                  <p className="text-xs text-coral mt-1">{errors.email}</p>
                ) : null}
              </div>
              <Input
                placeholder="Company (optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <div>
                <Input
                  placeholder="Phone (optional)"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value)
                    setPhone(formatted)
                    if (touched.phone) {
                      const err = validateField('phone', formatted)
                      setErrors((prev) =>
                        err
                          ? { ...prev, phone: err }
                          : (() => {
                              const { phone: _, ...rest } = prev
                              return rest
                            })(),
                      )
                    }
                  }}
                  onBlur={() => handleBlur('phone', phone)}
                />
                {errors.phone && touched.phone ? (
                  <p className="text-xs text-coral mt-1">{errors.phone}</p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Status
                </label>
                <select
                  value={clientStatus}
                  onChange={(e) => setClientStatus(e.target.value as Client['status'])}
                  className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-sm text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                >
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Notes (optional)
                </label>
                <textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-sm text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-indigo/30"
                />
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
                    {formatPhoneNumber(client.phone)}
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
