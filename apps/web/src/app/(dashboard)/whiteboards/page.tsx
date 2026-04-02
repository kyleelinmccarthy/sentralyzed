'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Whiteboard {
  id: string
  name: string
  thumbnailUrl: string | null
  createdAt: string
}

export default function WhiteboardsPage() {
  const [boards, setBoards] = useState<Whiteboard[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadBoards()
  }, [])

  const loadBoards = async () => {
    try {
      const data = await api.get<{ whiteboards: Whiteboard[] }>('/whiteboards')
      setBoards(data.whiteboards)
    } catch {
      // Endpoint may not exist yet
    } finally {
      setIsLoading(false)
    }
  }

  const createBoard = async () => {
    if (!newName.trim()) return
    try {
      const data = await api.post<{ whiteboard: Whiteboard }>('/whiteboards', { name: newName })
      setNewName('')
      setShowNew(false)
      setBoards((prev) => [data.whiteboard, ...prev])
    } catch {
      // fallback: create locally
      const localBoard = {
        id: `local-${Date.now()}`,
        name: newName,
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
      }
      setBoards((prev) => [localBoard, ...prev])
      setNewName('')
      setShowNew(false)
    }
  }

  if (isLoading) return <div className="animate-pulse text-french-gray">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jet">Whiteboards</h1>
        <Button onClick={() => setShowNew(!showNew)}>
          {showNew ? 'Cancel' : 'New Whiteboard'}
        </Button>
      </div>

      {showNew && (
        <Card className="p-4 mb-6">
          <div className="flex gap-3">
            <Input
              placeholder="Whiteboard name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => void createBoard()}>Create</Button>
          </div>
        </Card>
      )}

      {boards.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-french-gray text-center">
            No whiteboards yet. Create one to start drawing.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link key={board.id} href={`/whiteboards/${board.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="h-40 bg-gray-100 flex items-center justify-center text-4xl text-french-gray">
                  {board.thumbnailUrl ? (
                    <img
                      src={board.thumbnailUrl}
                      alt={board.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🎨'
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-jet">{board.name}</h3>
                  <p className="text-xs text-french-gray mt-1">
                    {new Date(board.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
