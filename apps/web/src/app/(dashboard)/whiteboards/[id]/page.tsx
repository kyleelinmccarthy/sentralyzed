'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { WhiteboardCanvas } from '@/components/whiteboard/Canvas'
import type { Shape } from '@/lib/whiteboard/engine'

export default function WhiteboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [shapes, setShapes] = useState<Shape[]>([])

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/whiteboards" className="text-sm text-indigo hover:underline">
            &larr; Back
          </Link>
          <span className="text-sm font-medium text-jet">Whiteboard {id.substring(0, 8)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-french-gray">{shapes.length} shapes</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal">Auto-saved</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <WhiteboardCanvas shapes={shapes} onShapesChange={setShapes} />
      </div>
    </div>
  )
}
