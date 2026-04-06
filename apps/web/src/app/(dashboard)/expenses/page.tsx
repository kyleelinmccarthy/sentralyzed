'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useExpenses } from '@/hooks/use-expenses'
import { useBudgets } from '@/hooks/use-budgets'
import { api } from '@/lib/api'
import { useEffect } from 'react'
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { ExpenseReviewModal } from '@/components/expenses/ExpenseReviewModal'
import { BudgetPanel } from '@/components/expenses/BudgetPanel'
import { ReportPanel } from '@/components/expenses/ReportPanel'
import { Button } from '@/components/ui/button'
import type { Expense } from '@sentral/shared/types/expense'
import type { CreateExpenseInput, ReviewExpenseInput } from '@sentral/shared/validators/expense'
import { Plus, Receipt, PieChart, Wallet } from 'lucide-react'

interface Project {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

interface AssetOption {
  id: string
  name: string
}

type Tab = 'expenses' | 'budgets' | 'reports'

export default function ExpensesPage() {
  const { user } = useAuthStore()
  const {
    expenses,
    isLoading,
    error,
    filters,
    page,
    setFilters,
    setPage,
    createExpense,
    updateExpense,
    deleteExpense,
    reviewExpense,
  } = useExpenses()
  const { budgets } = useBudgets()

  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [assets, setAssets] = useState<AssetOption[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('expenses')
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [reviewingExpense, setReviewingExpense] = useState<Expense | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isManager = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [projectsData, clientsData, assetsData] = await Promise.all([
          api.get<{ projects: Project[] }>('/projects'),
          api.get<{ clients: Client[] }>('/clients'),
          api.get<{ assets: AssetOption[] }>('/assets?limit=100'),
        ])
        setProjects(projectsData.projects)
        setClients(clientsData.clients)
        setAssets(assetsData.assets)
      } catch {
        // Dropdowns are optional
      }
    }
    void loadDropdownData()
  }, [])

  const handleCreateExpense = async (data: CreateExpenseInput) => {
    setIsSubmitting(true)
    try {
      await createExpense(data)
      setShowForm(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateExpense = async (data: CreateExpenseInput) => {
    if (!editingExpense) return
    setIsSubmitting(true)
    try {
      await updateExpense(editingExpense.id, data)
      setEditingExpense(null)
      setShowForm(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    await deleteExpense(id)
  }

  const handleReview = (expense: Expense) => {
    setReviewingExpense(expense)
  }

  const handleReviewSubmit = async (data: ReviewExpenseInput) => {
    if (!reviewingExpense) return
    setIsSubmitting(true)
    try {
      await reviewExpense(reviewingExpense.id, data)
      setReviewingExpense(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; managerOnly?: boolean }[] = [
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Wallet, managerOnly: true },
    { id: 'reports', label: 'Reports', icon: PieChart, managerOnly: true },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold text-jet dark:text-dark-text"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Expenses
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-light-border dark:border-dark-border">
        {tabs
          .filter((tab) => !tab.managerOnly || isManager)
          .map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${
                    activeTab === tab.id
                      ? 'border-indigo text-indigo'
                      : 'border-transparent text-french-gray dark:text-dark-text-secondary hover:text-jet dark:hover:text-dark-text'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
      </div>

      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <ExpenseFilters
              filters={filters}
              onFilterChange={setFilters}
              projects={projects}
              clients={clients}
            />
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus size={14} className="mr-1" />
                New Expense
              </Button>
            )}
          </div>

          {showForm && (
            <ExpenseForm
              onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
              onCancel={handleCancelForm}
              projects={projects}
              clients={clients}
              budgets={budgets}
              assets={assets}
              initialValues={editingExpense ?? undefined}
              isSubmitting={isSubmitting}
            />
          )}

          <ExpenseList
            expenses={expenses}
            isLoading={isLoading}
            userId={user?.id ?? ''}
            userRole={user?.role ?? 'member'}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReview={handleReview}
            page={page}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && isManager && (
        <BudgetPanel projects={projects} clients={clients} />
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && isManager && <ReportPanel projects={projects} />}

      {/* Review Modal */}
      {reviewingExpense && (
        <ExpenseReviewModal
          expense={reviewingExpense}
          onSubmit={handleReviewSubmit}
          onCancel={() => setReviewingExpense(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
