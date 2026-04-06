'use client'

import { useState, useEffect, useRef, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WhiteboardCanvas } from '@/components/whiteboard/Canvas'
import type { Shape } from '@/lib/whiteboard/engine'
import { UserAssignmentPicker } from '@/components/assignments/UserAssignmentPicker'
import { FileAttachments } from '@/components/files/FileAttachments'
import { api } from '@/lib/api'

const SAVE_DEBOUNCE_MS = 1500

interface WhiteboardData {
  id: string
  name: string
  shapesData: Shape[] | null
}

export default function WhiteboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [shapes, setShapes] = useState<Shape[]>([])
  const [showAssignments, setShowAssignments] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved')
  const [loaded, setLoaded] = useState(false)
  const [name, setName] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingShapes = useRef<Shape[] | null>(null)
  const isInitialLoad = useRef(true)
  const realIdRef = useRef<string>(id)

  const isLocalId = id.startsWith('local-')

  // Load whiteboard data on mount
  useEffect(() => {
    const load = async () => {
      if (isLocalId) {
        // Local whiteboard — nothing to load from DB yet
        setLoaded(true)
        isInitialLoad.current = false
        return
      }
      try {
        const data = await api.get<{ whiteboard: WhiteboardData }>(`/whiteboards/${id}`)
        setName(data.whiteboard.name)
        if (data.whiteboard.shapesData && Array.isArray(data.whiteboard.shapesData)) {
          setShapes(data.whiteboard.shapesData)
        }
      } catch {
        // Whiteboard may not exist in DB yet
      } finally {
        setLoaded(true)
        isInitialLoad.current = false
      }
    }
    void load()
  }, [id, isLocalId])

  // Auto-save shapes with debounce
  const saveShapes = useCallback(
    async (shapesToSave: Shape[]) => {
      setSaveStatus('saving')
      try {
        // If this is a local whiteboard, create it in the DB first
        if (realIdRef.current.startsWith('local-')) {
          const boardName = name || `Whiteboard ${id.substring(6)}`
          const data = await api.post<{ whiteboard: WhiteboardData }>('/whiteboards', {
            name: boardName,
          })
          realIdRef.current = data.whiteboard.id
          setName(data.whiteboard.name)
        }
        await api.patch(`/whiteboards/${realIdRef.current}`, { shapesData: shapesToSave })
        pendingShapes.current = null
        setSaveStatus('saved')
        // Redirect to the real URL so refreshes and future saves work
        if (realIdRef.current !== id) {
          router.replace(`/whiteboards/${realIdRef.current}`)
        }
      } catch {
        setSaveStatus('error')
      }
    },
    [id, name, router],
  )

  const handleShapesChange = useCallback(
    (newShapes: Shape[]) => {
      setShapes(newShapes)

      if (isInitialLoad.current) return

      setSaveStatus('unsaved')
      pendingShapes.current = newShapes
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        void saveShapes(newShapes)
      }, SAVE_DEBOUNCE_MS)
    },
    [saveShapes],
  )

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (pendingShapes.current && !realIdRef.current.startsWith('local-')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        fetch(`${apiUrl}/whiteboards/${realIdRef.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          keepalive: true,
          body: JSON.stringify({ shapesData: pendingShapes.current }),
        })
      }
    }
  }, [id])

  const statusLabel = {
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved',
    error: 'Save failed',
  }
  const statusColor = {
    saved: 'bg-teal/10 text-teal',
    saving: 'bg-amber/10 text-amber-600',
    unsaved: 'bg-french-gray/10 text-french-gray',
    error: 'bg-red-100 text-red-600',
  }

  if (!loaded) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <span className="text-french-gray animate-pulse">Loading whiteboard...</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/whiteboards" className="text-sm text-indigo hover:underline">
            &larr; Back
          </Link>
          <span className="text-sm font-medium text-jet">
            {name || `Whiteboard ${id.substring(0, 8)}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-french-gray">{shapes.length} shapes</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[saveStatus]}`}>
            {statusLabel[saveStatus]}
          </span>
          <button
            onClick={() => setShowAssignments(!showAssignments)}
            className="text-xs px-2 py-0.5 rounded-full bg-indigo/10 text-indigo hover:bg-indigo/20 transition-colors"
          >
            {showAssignments ? 'Hide' : 'People'}
          </button>
        </div>
      </div>

      {/* Assignments & Files panel */}
      {showAssignments && (
        <div className="border-b border-gray-200 p-4 bg-white space-y-4">
          <UserAssignmentPicker entityType="whiteboard" entityId={id} />
          <FileAttachments entityType="whiteboard" entityId={id} />
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1">
        <WhiteboardCanvas shapes={shapes} onShapesChange={handleShapesChange} />
      </div>
    </div>
  )
}
