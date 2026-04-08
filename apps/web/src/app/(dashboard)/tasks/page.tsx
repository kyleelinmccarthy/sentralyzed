'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { UserAssignmentPicker } from '@/components/assignments/UserAssignmentPicker'
import { FileAttachments } from '@/components/files/FileAttachments'

interface Project {
  id: string
  name: string
  color: string
}

interface TeamMember {
  id: string
  name: string
}

type TaskLevel = 'project' | 'team' | 'company'

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  dueDate: string | null
  level: TaskLevel
  projectId: string | null
  assigneeId: string | null
  createdAt: string
}

const priorityColors: Record<string, string> = {
  urgent: '#FF7043',
  high: '#F59E0B',
  medium: '#5C6BC0',
  low: '#9CA3AF',
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

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editStatus, setEditStatus] = useState<Task['status']>('todo')
  const [editPriority, setEditPriority] = useState<Task['priority']>('medium')
  const [editDueDate, setEditDueDate] = useState('')

  const [title, setTitle] = useState('')
  const [level, setLevel] = useState<TaskLevel>('project')
  const [projectId, setProjectId] = useState('')
  const [priority, setPriority] = useState<'medium' | 'urgent' | 'high' | 'low'>('medium')
  const [status, setStatus] = useState<Task['status']>('todo')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [labels, setLabels] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    void loadProjects()
    void loadTeamMembers()
  }, [])

  useEffect(() => {
    void loadAllTasks()
  }, [projects])

  const loadProjects = async () => {
    try {
      const data = await api.get<{ projects: Project[] }>('/projects')
      setProjects(data.projects)
    } catch {
      // ignore
    }
  }

  const loadTeamMembers = async () => {
    try {
      const data = await api.get<{ users: TeamMember[] }>('/assignments/users')
      setTeamMembers(data.users)
    } catch {
      // ignore
    }
  }

  const loadAllTasks = async () => {
    setIsLoading(true)
    try {
      const allTasks: Task[] = []
      // Fetch project tasks
      for (const project of projects) {
        const data = await api.get<{ tasks: Task[] }>(`/tasks/project/${project.id}`)
        allTasks.push(...data.tasks)
      }
      // Fetch team and company tasks
      const [teamData, companyData] = await Promise.all([
        api.get<{ tasks: Task[] }>('/tasks/level/team'),
        api.get<{ tasks: Task[] }>('/tasks/level/company'),
      ])
      allTasks.push(...teamData.tasks, ...companyData.tasks)
      setTasks(allTasks)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    if (level === 'project' && !projectId) return
    setCreating(true)
    try {
      const parsedLabels = labels.trim()
        ? labels
            .split(',')
            .map((l) => l.trim())
            .filter(Boolean)
        : undefined
      await api.post('/tasks', {
        title: title.trim(),
        level,
        ...(level === 'project' ? { projectId } : {}),
        priority,
        status,
        ...(dueDate && { dueDate }),
        ...(assigneeId && { assigneeId }),
        ...(estimatedHours && { estimatedHours: Number(estimatedHours) }),
        ...(parsedLabels?.length && { labels: parsedLabels }),
      })
      setTitle('')
      setLevel('project')
      setProjectId('')
      setPriority('medium')
      setStatus('todo')
      setDueDate('')
      setAssigneeId('')
      setEstimatedHours('')
      setLabels('')
      setShowForm(false)
      void loadAllTasks()
    } finally {
      setCreating(false)
    }
  }

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditTitle(task.title)
    setEditStatus(task.status)
    setEditPriority(task.priority)
    setEditDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
  }

  const saveEditTask = async () => {
    if (!editingTaskId || !editTitle.trim()) return
    await api.patch(`/tasks/${editingTaskId}`, {
      title: editTitle.trim(),
      status: editStatus,
      priority: editPriority,
      dueDate: editDueDate || undefined,
    })
    setEditingTaskId(null)
    void loadAllTasks()
  }

  const activeTasks = tasks.filter((t) => t.status !== 'done')
  const completedTasks = tasks.filter((t) => t.status === 'done')
  const displayedTasks = filter === 'active' ? activeTasks : completedTasks

  const getProjectName = (id: string | null) => {
    if (!id) return null
    return projects.find((p) => p.id === id)?.name ?? 'Unknown'
  }

  const getLevelLabel = (task: Task) => {
    if (task.level === 'company') return 'Company'
    if (task.level === 'team') return 'Team'
    return getProjectName(task.projectId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet dark:text-dark-text">All Tasks</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Task'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-6">
          <div className="space-y-3">
            <Input
              placeholder="Task title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Level
                </label>
                <select
                  value={level}
                  onChange={(e) => {
                    setLevel(e.target.value as TaskLevel)
                    if (e.target.value !== 'project') setProjectId('')
                  }}
                  className="w-full rounded-lg border border-light-border dark:border-dark-border px-3 py-2 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                >
                  <option value="project">Project</option>
                  <option value="team">Team</option>
                  <option value="company">Company</option>
                </select>
              </div>
              {level === 'project' && (
                <div>
                  <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                    Project *
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-lg border border-light-border dark:border-dark-border px-3 py-2 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                  >
                    <option value="">Select project...</option>
                    {[...projects]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Task['status'])}
                  className="w-full rounded-lg border border-light-border dark:border-dark-border px-3 py-2 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="w-full rounded-lg border border-light-border dark:border-dark-border px-3 py-2 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Assignee (optional)
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-lg border border-light-border dark:border-dark-border px-3 py-2 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-indigo/30"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Due Date (optional)
                </label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Estimated Hours (optional)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 4"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-gray dark:text-dark-text-secondary mb-1">
                  Labels (optional, comma-separated)
                </label>
                <Input
                  placeholder="e.g. frontend, bug, urgent"
                  value={labels}
                  onChange={(e) => setLabels(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => void handleCreate()} isLoading={creating}>
                Create Task
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setFilter('active')}
            className={`text-sm font-medium pb-1 ${filter === 'active' ? 'text-indigo border-b-2 border-indigo' : 'text-french-gray dark:text-dark-text-secondary'}`}
          >
            Active Tasks ({activeTasks.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`text-sm font-medium pb-1 ${filter === 'completed' ? 'text-indigo border-b-2 border-indigo' : 'text-french-gray dark:text-dark-text-secondary'}`}
          >
            Completed ({completedTasks.length})
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-french-gray dark:text-dark-text-secondary">Loading tasks...</p>
        ) : displayedTasks.length === 0 ? (
          <p className="text-sm text-french-gray dark:text-dark-text-secondary">
            {filter === 'active'
              ? 'No active tasks. Click "+ New Task" to create one.'
              : 'No completed tasks yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {displayedTasks.map((task) => (
              <div key={task.id}>
                <div
                  onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-hover dark:hover:bg-dark-hover transition-colors cursor-pointer"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: priorityColors[task.priority] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-jet dark:text-dark-text truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-french-gray dark:text-dark-text-secondary">
                      {getLevelLabel(task)} · {statusLabels[task.status]}
                      {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className="text-xs text-french-gray dark:text-dark-text-secondary">
                    {expandedTaskId === task.id ? '▲' : '▼'}
                  </span>
                </div>
                {expandedTaskId === task.id && (
                  <div className="ml-5 mt-2 mb-3 p-3 rounded-lg bg-light-hover dark:bg-dark-hover border border-light-border dark:border-dark-border space-y-3">
                    {editingTaskId === task.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Task title"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as Task['status'])}
                            className="flex-1 rounded-lg border border-light-border dark:border-dark-border px-3 py-2 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
                          >
                            <option value="done">Done</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="todo">To Do</option>
                          </select>
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as Task['priority'])}
                            className="rounded-lg border border-light-border dark:border-dark-border px-3 py-2 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
                          >
                            <option value="high">High</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="urgent">Urgent</option>
                          </select>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-french-gray dark:text-dark-text-secondary whitespace-nowrap">
                              Due Date
                            </label>
                            <Input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button onClick={() => void saveEditTask()}>Save Changes</Button>
                          <Button variant="outline" onClick={() => setEditingTaskId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button variant="outline" onClick={() => startEditTask(task)}>
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
                          Edit Task
                        </Button>
                      </div>
                    )}
                    <UserAssignmentPicker entityType="task" entityId={task.id} />
                    <FileAttachments entityType="task" entityId={task.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
