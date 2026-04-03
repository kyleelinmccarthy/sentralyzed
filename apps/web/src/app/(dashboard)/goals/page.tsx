'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAssignmentPicker } from '@/components/assignments/UserAssignmentPicker'

interface Goal {
  id: string
  title: string
  description: string | null
  level: 'company' | 'team' | 'personal'
  status: 'not_started' | 'in_progress' | 'completed' | 'archived'
  progressPercentage: number
  parentGoalId: string | null
  targetDate: string | null
  createdAt: string
}

const statusColors: Record<string, string> = {
  not_started: '#B0BEC5',
  in_progress: '#5C6BC0',
  completed: '#26A69A',
  archived: '#607D8B',
}

const levelLabels: Record<string, string> = {
  company: 'Company',
  team: 'Team',
  personal: 'Personal',
}

function GoalItem({ goal, depth = 0 }: { goal: Goal; depth?: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="border-b border-light-border dark:border-dark-border last:border-0"
      style={{ paddingLeft: depth * 24 }}
    >
      <div
        className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: statusColors[goal.status] }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-jet dark:text-dark-text truncate">{goal.title}</p>
          <p className="text-xs text-french-gray dark:text-dark-text-secondary">
            {levelLabels[goal.level]} · {goal.status.replace('_', ' ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-light-border dark:bg-dark-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${goal.progressPercentage}%`,
                backgroundColor: statusColors[goal.status],
              }}
            />
          </div>
          <span className="text-xs text-french-gray dark:text-dark-text-secondary w-8">
            {goal.progressPercentage}%
          </span>
          <span className="text-xs text-french-gray dark:text-dark-text-secondary">
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3">
          <div className="p-3 rounded-lg bg-light-hover dark:bg-dark-hover border border-light-border dark:border-dark-border">
            <UserAssignmentPicker entityType="goal" entityId={goal.id} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState<'company' | 'team' | 'personal'>('personal')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const data = await api.get<{ goals: Goal[] }>('/goals')
      setGoals(data.goals)
    } finally {
      setIsLoading(false)
    }
  }

  const createGoal = async () => {
    if (!title.trim()) return
    await api.post('/goals', { title, level })
    setTitle('')
    setShowForm(false)
    void loadGoals()
  }

  if (isLoading) {
    return (
      <div className="animate-pulse text-french-gray dark:text-dark-text-secondary">
        Loading goals...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet dark:text-dark-text">Goals</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Goal'}</Button>
      </div>

      {showForm ? (
        <Card className="p-4 mb-6">
          <div className="flex gap-3">
            <Input
              placeholder="Goal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as 'company' | 'team' | 'personal')}
              className="px-3 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm"
            >
              <option value="personal">Personal</option>
              <option value="team">Team</option>
              <option value="company">Company</option>
            </select>
            <Button onClick={() => void createGoal()}>Create</Button>
          </div>
        </Card>
      ) : null}

      <Card>
        {goals.length === 0 ? (
          <p className="p-6 text-sm text-french-gray dark:text-dark-text-secondary text-center">
            No goals yet. Create one to get started.
          </p>
        ) : (
          goals.map((goal) => <GoalItem key={goal.id} goal={goal} />)
        )}
      </Card>
    </div>
  )
}
