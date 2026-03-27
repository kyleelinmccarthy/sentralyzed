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
  '#5C6BC0': 'linear-gradient(135deg, #5C6BC0, #3F51B5)',
  '#7B1FA2': 'linear-gradient(135deg, #7B1FA2, #9C27B0)',
  '#26A69A': 'linear-gradient(135deg, #26A69A, #00897B)',
  '#FF7043': 'linear-gradient(135deg, #FF7043, #F4511E)',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await api.get<{ projects: Project[] }>('/projects')
      setProjects(data.projects)
    } finally {
      setIsLoading(false)
    }
  }

  const createProject = async () => {
    if (!name.trim()) return
    await api.post('/projects', { name })
    setName('')
    setShowForm(false)
    void loadProjects()
  }

  if (isLoading) {
    return <div className="animate-pulse text-french-gray">Loading projects...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet">Projects</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {showForm ? (
        <Card className="p-4 mb-6">
          <div className="flex gap-3">
            <Input
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => void createProject()}>Create</Button>
          </div>
        </Card>
      ) : null}

      {projects.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-french-gray text-center">
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
                    className={`text-xs px-2 py-0.5 rounded-full ${
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
