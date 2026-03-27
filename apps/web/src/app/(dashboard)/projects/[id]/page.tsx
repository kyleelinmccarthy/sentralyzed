'use client'

import { useState, useEffect, use } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  urgent: '#E53935',
  high: '#FF7043',
  medium: '#5C6BC0',
  low: '#B0BEC5',
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [tab, setTab] = useState<'kanban' | 'list'>('kanban')
  const [newTaskTitle, setNewTaskTitle] = useState('')

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

  const createTask = async () => {
    if (!newTaskTitle.trim()) return
    await api.post('/tasks', { title: newTaskTitle, projectId: id })
    setNewTaskTitle('')
    void loadData()
  }

  if (!project) {
    return <div className="animate-pulse text-french-gray">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-jet">{project.name}</h1>
          {project.description ? (
            <p className="text-sm text-french-gray mt-1">{project.description}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
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
                <span className="text-french-gray">
                  ({tasks.filter((t) => t.status === status).length})
                </span>
              </h3>
              <div className="space-y-2 min-h-[200px] bg-gray-100/50 rounded-[12px] p-2">
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
                        <p className="text-sm text-jet">{task.title}</p>
                      </div>
                      {task.dueDate ? (
                        <p className="text-xs text-french-gray mt-2">{task.dueDate}</p>
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
            <p className="p-6 text-sm text-french-gray text-center">No tasks yet.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: priorityColors[task.priority] }}
                />
                <p className="text-sm flex-1">{task.title}</p>
                <span className="text-xs text-french-gray">{statusLabels[task.status]}</span>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  )
}
