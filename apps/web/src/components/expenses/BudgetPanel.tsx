import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BudgetCard } from './BudgetCard'
import { BudgetForm } from './BudgetForm'
import { useBudgets } from '@/hooks/use-budgets'
import type { Budget } from '@sentral/shared/types/expense'
import type { CreateBudgetInput } from '@sentral/shared/validators/expense'
import { Plus } from 'lucide-react'

interface Project {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

interface BudgetPanelProps {
  projects: Project[]
  clients: Client[]
}

export function BudgetPanel({ projects, clients }: BudgetPanelProps) {
  const { budgets, isLoading, error, createBudget, updateBudget, deleteBudget } = useBudgets()
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: CreateBudgetInput) => {
    setIsSubmitting(true)
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, data)
      } else {
        await createBudget(data)
      }
      setShowForm(false)
      setEditingBudget(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    await deleteBudget(id)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingBudget(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo" />
      </div>
    )
  }

  return (
    <div>
      {error && <p className="text-sm text-coral mb-3">{error}</p>}

      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)} className="mb-4">
          <Plus size={14} className="mr-1" />
          New Budget
        </Button>
      )}

      {showForm && (
        <BudgetForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          projects={projects}
          clients={clients}
          initialValues={editingBudget ?? undefined}
          isSubmitting={isSubmitting}
        />
      )}

      {budgets.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <p className="text-french-gray dark:text-dark-text-secondary text-sm">
            No budgets set up yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
