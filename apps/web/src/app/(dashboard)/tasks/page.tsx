'use client'

import { Card } from '@/components/ui/card'

export default function TasksPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-jet mb-6">All Tasks</h1>
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <button className="text-sm font-medium text-indigo border-b-2 border-indigo pb-1">
            Active Tasks
          </button>
          <button className="text-sm font-medium text-french-gray pb-1">Completed</button>
        </div>
        <p className="text-sm text-french-gray">
          Select a project to view its tasks, or create a new project to get started.
        </p>
      </Card>
    </div>
  )
}
