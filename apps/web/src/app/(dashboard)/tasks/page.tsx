'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Project {
  id: string
  name: string
  color: string
}

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  dueDate: string | null
  projectId: string
  assigneeId: string | null
  createdAt: string
}

const priorityColors: Record<string, string> = {
  urgent: '#E53935',
  high: '#FF7043',
  medium: '#5C6BC0',
  low: '#B0BEC5',
}

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'active' | 'completed'>('active')

  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [priority, setPriority] = useState<'medium' | 'urgent' | 'high' | 'low'>('medium')

  useEffect(() => {
    void loadProjects()
  }, [])

  useEffect(() => {
    if (projects.length > 0) {
      void loadAllTasks()
    }
  }, [projects])

  const loadProjects = async () => {
    try {
      const data = await api.get<{ projects: Project[] }>('/projects')
      setProjects(data.projects)
    } catch {
      // ignore
    }
  }

  const loadAllTasks = async () => {
    setIsLoading(true)
    try {
      const allTasks: Task[] = []
      for (const project of projects) {
        const data = await api.get<{ tasks: Task[] }>(`/tasks/project/${project.id}`)
        allTasks.push(...data.tasks)
      }
      setTasks(allTasks)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!title.trim() || !projectId) return
    setCreating(true)
    try {
      await api.post('/tasks', { title: title.trim(), projectId, priority })
      setTitle('')
      setProjectId('')
      setPriority('medium')
      setShowForm(false)
      void loadAllTasks()
    } finally {
      setCreating(false)
    }
  }

  const activeTasks = tasks.filter((t) => t.status !== 'done')
  const completedTasks = tasks.filter((t) => t.status === 'done')
  const displayedTasks = filter === 'active' ? activeTasks : completedTasks

  const getProjectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Unknown'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet">All Tasks</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Task'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-6">
          <div className="space-y-3">
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
            />
            <div className="flex gap-3">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="flex-1 rounded-lg border border-french-gray/30 px-3 py-2 text-sm bg-white text-jet focus:outline-none focus:ring-2 focus:ring-indigo/30"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="rounded-lg border border-french-gray/30 px-3 py-2 text-sm bg-white text-jet focus:outline-none focus:ring-2 focus:ring-indigo/30"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <Button size="sm" onClick={() => void handleCreate()} isLoading={creating}>
                Create
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setFilter('active')}
            className={`text-sm font-medium pb-1 ${filter === 'active' ? 'text-indigo border-b-2 border-indigo' : 'text-french-gray'}`}
          >
            Active Tasks ({activeTasks.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`text-sm font-medium pb-1 ${filter === 'completed' ? 'text-indigo border-b-2 border-indigo' : 'text-french-gray'}`}
          >
            Completed ({completedTasks.length})
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-french-gray">Loading tasks...</p>
        ) : displayedTasks.length === 0 ? (
          <p className="text-sm text-french-gray">
            {filter === 'active'
              ? 'No active tasks. Click "+ New Task" to create one.'
              : 'No completed tasks yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {displayedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-french-gray/20 hover:bg-french-gray/5 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: priorityColors[task.priority] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-jet truncate">{task.title}</p>
                  <p className="text-xs text-french-gray">
                    {getProjectName(task.projectId)} · {statusLabels[task.status]}
                    {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
