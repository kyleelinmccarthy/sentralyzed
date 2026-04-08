'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'completed' | 'archived'
  priority: number
  color: string
  icon: string
  createdAt: string
}

const gradients: Record<string, string> = {
  '#5C6BC0': 'linear-gradient(135deg, #5C6BC0, #3B82F6)',
  '#3B82F6': 'linear-gradient(135deg, #3B82F6, #5C6BC0)',
  '#26A69A': 'linear-gradient(135deg, #26A69A, #5C6BC0)',
  '#FF7043': 'linear-gradient(135deg, #FF7043, #F59E0B)',
}

interface Goal {
  id: string
  title: string
}

const PROJECT_COLORS = [
  '#5C6BC0',
  '#3B82F6',
  '#26A69A',
  '#FF7043',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
]
const PROJECT_ICONS = ['◈', '◆', '●', '★', '▲', '■', '♦', '⬟', '⬡', '◉']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Project['status']>('active')
  const [priority, setPriority] = useState(0)
  const [goalId, setGoalId] = useState('')
  const [color, setColor] = useState('#5C6BC0')
  const [icon, setIcon] = useState('◈')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadProjects()
    void loadGoals()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await api.get<{ projects: Project[] }>('/projects')
      setProjects(data.projects)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGoals = async () => {
    try {
      const data = await api.get<{ goals: Goal[] }>('/goals')
      setGoals(data.goals)
    } catch {
      // optional
    }
  }

  const createProject = async () => {
    if (!name.trim()) return
    await api.post('/projects', {
      name: name.trim(),
      ...(description.trim() && { description: description.trim() }),
      status,
      priority,
      ...(goalId && { goalId }),
      color,
      icon,
    })
    setName('')
    setDescription('')
    setStatus('active')
    setPriority(0)
    setGoalId('')
    setColor('#5C6BC0')
    setIcon('◈')
    setShowForm(false)
    void loadProjects()
  }

  if (isLoading) {
    return (
      <div className="animate-pulse text-french-gray dark:text-dark-text-secondary">
        Loading projects...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet dark:text-dark-text">Projects</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {showForm ? (
        <Card className="p-4 mb-6">
          <div className="space-y-3">
            <Input
              placeholder="Project name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-sm text-jet dark:text-dark-text placeholder:text-french-gray dark:placeholder:text-dark-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-indigo/30"
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Project['status'])}
                  className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-sm text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-sm text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                >
                  <option value={0}>None</option>
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                </select>
              </div>
              {goals.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                    Goal (optional)
                  </label>
                  <select
                    value={goalId}
                    onChange={(e) => setGoalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card text-sm text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                  >
                    <option value="">No goal</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Color
                </label>
                <div className="flex gap-2">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-jet dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Icon
                </label>
                <div className="flex gap-1.5">
                  {PROJECT_ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-all ${icon === i ? 'border-indigo bg-indigo/10' : 'border-light-border dark:border-dark-border hover:bg-light-hover dark:hover:bg-dark-hover'}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void createProject()}>Create Project</Button>
            </div>
          </div>
        </Card>
      ) : null}

      {projects.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-french-gray dark:text-dark-text-secondary text-center">
            No projects yet. Create one to get started.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card
                gradient={gradients[project.color] || gradients['#5C6BC0']}
                className="p-6 text-white hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{project.icon}</span>
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                </div>
                <p className="text-sm opacity-80">{project.description || 'No description'}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 font-medium rounded-full ${
                      project.status === 'active' ? 'bg-white/20' : 'bg-white/10'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
