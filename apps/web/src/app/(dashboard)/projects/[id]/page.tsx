'use client'

import { useState, useEffect, use } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAssignmentPicker } from '@/components/assignments/UserAssignmentPicker'
import { FileAttachments } from '@/components/files/FileAttachments'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  color: string
}

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  assigneeId: string | null
  dueDate: string | null
}

const statusColumns = ['todo', 'in_progress', 'in_review', 'done'] as const
const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}
const priorityColors: Record<string, string> = {
  urgent: '#FF7043',
  high: '#F59E0B',
  medium: '#5C6BC0',
  low: '#9CA3AF',
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [tab, setTab] = useState<'kanban' | 'list'>('kanban')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editColor, setEditColor] = useState('')

  useEffect(() => {
    void loadData()
  }, [id])

  const loadData = async () => {
    const [projData, tasksData] = await Promise.all([
      api.get<{ project: Project }>(`/projects/${id}`),
      api.get<{ tasks: Task[] }>(`/tasks/project/${id}`),
    ])
    setProject(projData.project)
    setTasks(tasksData.tasks)
  }

  const startEditProject = () => {
    if (!project) return
    setEditName(project.name)
    setEditDescription(project.description || '')
    setEditStatus(project.status)
    setEditColor(project.color)
    setIsEditing(true)
  }

  const saveProject = async () => {
    if (!editName.trim()) return
    await api.patch(`/projects/${id}`, {
      name: editName.trim(),
      description: editDescription || undefined,
      status: editStatus,
      color: editColor,
    })
    setIsEditing(false)
    void loadData()
  }

  const deleteProject = async () => {
    await api.delete(`/projects/${id}`)
    window.location.href = '/projects'
  }

  const createTask = async () => {
    if (!newTaskTitle.trim()) return
    await api.post('/tasks', { title: newTaskTitle, projectId: id })
    setNewTaskTitle('')
    void loadData()
  }

  if (!project) {
    return (
      <div className="animate-pulse text-french-gray dark:text-dark-text-secondary">Loading...</div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-jet dark:text-dark-text">{project.name}</h1>
          {project.description ? (
            <p className="text-sm text-french-gray dark:text-dark-text-secondary mt-1">
              {project.description}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={startEditProject}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Project
          </Button>
          <Button
            variant={tab === 'kanban' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTab('kanban')}
          >
            Kanban
          </Button>
          <Button
            variant={tab === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTab('list')}
          >
            List
          </Button>
        </div>
      </div>

      {isEditing && (
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-semibold text-jet dark:text-dark-text mb-3">Edit Project</h3>
          <div className="space-y-3">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Project name"
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
                onChange={(e) => setEditStatus(e.target.value)}
                className="flex-1 rounded-lg border border-light-border dark:border-dark-border px-3 py-2 text-sm bg-light-surface dark:bg-dark-card text-jet dark:text-dark-text"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="text-sm text-french-gray dark:text-dark-text-secondary">
                  Color
                </label>
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-light-border dark:border-dark-border bg-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={() => void saveProject()}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void deleteProject()}>
                Delete Project
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Assigned Users */}
      <Card className="p-4 mb-6">
        <UserAssignmentPicker entityType="project" entityId={id} />
      </Card>

      {/* File Attachments */}
      <Card className="p-4 mb-6">
        <FileAttachments entityType="project" entityId={id} />
      </Card>

      {/* Quick add task */}
      <Card className="p-3 mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void createTask()}
            className="flex-1"
          />
          <Button size="sm" onClick={() => void createTask()}>
            Add
          </Button>
        </div>
      </Card>

      {tab === 'kanban' ? (
        <div className="grid grid-cols-4 gap-4">
          {statusColumns.map((status) => (
            <div key={status} className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-gray px-1">
                {statusLabels[status]}{' '}
                <span className="text-french-gray dark:text-dark-text-secondary">
                  ({tasks.filter((t) => t.status === status).length})
                </span>
              </h3>
              <div className="space-y-2 min-h-[200px] bg-light-hover/50 dark:bg-dark-hover/50 rounded-xl p-2">
                {tasks
                  .filter((t) => t.status === status)
                  .map((task) => (
                    <Card
                      key={task.id}
                      className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: priorityColors[task.priority] }}
                        />
                        <p className="text-sm text-jet dark:text-dark-text">{task.title}</p>
                      </div>
                      {task.dueDate ? (
                        <p className="text-xs text-french-gray dark:text-dark-text-secondary mt-2">
                          {task.dueDate}
                        </p>
                      ) : null}
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          {tasks.length === 0 ? (
            <p className="p-6 text-sm text-french-gray dark:text-dark-text-secondary text-center">
              No tasks yet.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-light-border dark:border-dark-border last:border-0"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: priorityColors[task.priority] }}
                />
                <p className="text-sm flex-1">{task.title}</p>
                <span className="text-xs text-french-gray dark:text-dark-text-secondary">
                  {statusLabels[task.status]}
                </span>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  )
}
