'use client'

import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div>
      <h1 className="text-2xl font-bold text-jet dark:text-dark-text mb-6">
        Welcome back, {user?.name?.split(' ')[0] || 'there'}
      </h1>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card gradient="linear-gradient(135deg, #5C6BC0, #3F51B5)" className="p-6 text-white">
          <h3 className="text-lg font-semibold">Projects</h3>
          <p className="text-sm mt-1 opacity-80">Manage and track all your projects</p>
        </Card>
        <Card gradient="linear-gradient(135deg, #26A69A, #00897B)" className="p-6 text-white">
          <h3 className="text-lg font-semibold">Tasks</h3>
          <p className="text-sm mt-1 opacity-80">Track your to-dos and assignments</p>
        </Card>
      </div>

      {/* Active Tasks placeholder */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <button className="text-sm font-medium text-indigo border-b-2 border-indigo pb-1">
            Active Tasks
          </button>
          <button className="text-sm font-medium text-french-gray dark:text-dark-text-secondary pb-1">
            Completed
          </button>
        </div>
        <p className="text-sm text-french-gray dark:text-dark-text-secondary">
          No tasks yet. Create a project to get started.
        </p>
      </Card>
    </div>
  )
}
