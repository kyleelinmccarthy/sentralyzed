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
  not_started: '#9CA3AF',
  in_progress: '#5C6BC0',
  completed: '#26A69A',
  archived: '#64748B',
}

const levelLabels: Record<string, string> = {
  company: 'Company',
  team: 'Team',
  personal: 'Personal',
}

function GoalItem({
  goal,
  depth = 0,
  onUpdated,
}: {
  goal: Goal
  depth?: number
  onUpdated: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(goal.title)
  const [editDescription, setEditDescription] = useState(goal.description || '')
  const [editStatus, setEditStatus] = useState(goal.status)
  const [editTargetDate, setEditTargetDate] = useState(
    goal.targetDate ? goal.targetDate.slice(0, 10) : '',
  )
  const [editProgress, setEditProgress] = useState(goal.progressPercentage)

  const saveGoal = async () => {
    if (!editTitle.trim()) return
    await api.patch(`/goals/${goal.id}`, {
      title: editTitle.trim(),
      description: editDescription || undefined,
      status: editStatus,
      targetDate: editTargetDate || undefined,
    })
    if (editProgress !== goal.progressPercentage) {
      await api.patch(`/goals/${goal.id}/progress`, { progress: editProgress })
    }
    setEditing(false)
    onUpdated()
  }

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
        <div className="px-4 pb-3 space-y-3">
          {editing ? (
            <div className="p-3 rounded-lg bg-light-hover dark:bg-dark-hover border border-light-border dark:border-dark-border space-y-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Goal title"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary resize-none"
              />
              <div className="flex gap-2">
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Goal['status'])}
                  className="flex-1 rounded-lg border border-light-border dark:border-dark-border px-3 py-2 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-french-gray dark:text-dark-text-secondary whitespace-nowrap">
                    Target Date
                  </label>
                  <Input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-french-gray dark:text-dark-text-secondary">
                  Progress:
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-jet dark:text-dark-text w-8">{editProgress}%</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={() => void saveGoal()}>Save Changes</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditing(true)
                }}
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Goal
              </Button>
            </div>
          )}
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
          goals.map((goal) => (
            <GoalItem key={goal.id} goal={goal} onUpdated={() => void loadGoals()} />
          ))
        )}
      </Card>
    </div>
  )
}
