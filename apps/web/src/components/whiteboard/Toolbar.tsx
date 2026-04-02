'use client'

import type { ToolType } from '@/lib/whiteboard/engine'

interface ToolbarProps {
  activeTool: ToolType
  color: string
  strokeWidth: number
  fill: string
  onToolChange: (tool: ToolType) => void
  onColorChange: (color: string) => void
  onStrokeWidthChange: (width: number) => void
  onFillChange: (fill: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  zoom: number
  onZoomChange: (zoom: number) => void
  onPanReset: () => void
}

const tools: { type: ToolType; label: string; icon: string }[] = [
  { type: 'select', label: 'Select', icon: '↖' },
  { type: 'hand', label: 'Hand (Pan)', icon: '✋' },
  { type: 'rectangle', label: 'Rectangle', icon: '▭' },
  { type: 'ellipse', label: 'Ellipse', icon: '◯' },
  { type: 'line', label: 'Line', icon: '╱' },
  { type: 'arrow', label: 'Arrow', icon: '→' },
  { type: 'freehand', label: 'Draw', icon: '✎' },
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'eraser', label: 'Eraser', icon: '⌫' },
]

const colors = [
  '#333333',
  '#5C6BC0',
  '#E53935',
  '#26A69A',
  '#FF7043',
  '#7B1FA2',
  '#607D8B',
  '#FFFFFF',
]

export function Toolbar(props: ToolbarProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-[12px] shadow-lg flex items-center gap-1 p-2 z-10">
      {/* Tools */}
      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => props.onToolChange(tool.type)}
          title={tool.label}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors
            ${props.activeTool === tool.type ? 'bg-indigo text-white' : 'hover:bg-gray-100 text-jet'}`}
        >
          {tool.icon}
        </button>
      ))}

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Colors */}
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => props.onColorChange(c)}
          className={`w-6 h-6 rounded-full border-2 ${props.color === c ? 'border-indigo' : 'border-gray-200'}`}
          style={{ backgroundColor: c }}
        />
      ))}

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Stroke width */}
      <select
        value={props.strokeWidth}
        onChange={(e) => props.onStrokeWidthChange(Number(e.target.value))}
        className="text-xs border border-gray-200 rounded px-1 py-1"
      >
        <option value={1}>1px</option>
        <option value={2}>2px</option>
        <option value={4}>4px</option>
        <option value={8}>8px</option>
      </select>

      {/* Fill toggle */}
      <button
        onClick={() =>
          props.onFillChange(props.fill === 'transparent' ? props.color + '33' : 'transparent')
        }
        className={`px-2 py-1 text-xs rounded ${props.fill !== 'transparent' ? 'bg-indigo/10 text-indigo' : 'text-french-gray'}`}
      >
        Fill
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Undo/Redo */}
      <button
        onClick={props.onUndo}
        disabled={!props.canUndo}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm disabled:opacity-30 hover:bg-gray-100"
      >
        ↩
      </button>
      <button
        onClick={props.onRedo}
        disabled={!props.canRedo}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm disabled:opacity-30 hover:bg-gray-100"
      >
        ↪
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Zoom */}
      <button
        onClick={() => props.onZoomChange(Math.min(props.zoom * 1.2, 10))}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm hover:bg-gray-100"
        title="Zoom in"
      >
        +
      </button>
      <button
        onClick={props.onPanReset}
        className="px-1 py-1 text-xs rounded hover:bg-gray-100 min-w-[3rem] text-center"
        title="Reset view"
      >
        {Math.round(props.zoom * 100)}%
      </button>
      <button
        onClick={() => props.onZoomChange(Math.max(props.zoom / 1.2, 0.1))}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm hover:bg-gray-100"
        title="Zoom out"
      >
        −
      </button>
    </div>
  )
}
