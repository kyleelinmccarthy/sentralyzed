'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import {
  type Shape,
  type ToolType,
  generateId,
  hitTest,
  renderShape,
  renderSelection,
} from '@/lib/whiteboard/engine'
import { Toolbar } from './Toolbar'

interface CanvasProps {
  shapes: Shape[]
  onShapesChange: (shapes: Shape[]) => void
}

export function WhiteboardCanvas({ shapes, onShapesChange }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<ToolType>('select')
  const [color, setColor] = useState('#333333')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [fill, setFill] = useState('transparent')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [undoStack, setUndoStack] = useState<Shape[][]>([])
  const [redoStack, setRedoStack] = useState<Shape[][]>([])
  const [textInput, setTextInput] = useState<{
    x: number
    y: number
    screenX: number
    screenY: number
    value: string
  } | null>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const drawingShape = useRef<Shape | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Grid
    const gridSize = 20
    const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize
    const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize
    const endX = startX + canvas.width / zoom + gridSize
    const endY = startY + canvas.height / zoom + gridSize
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1 / zoom
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
      ctx.stroke()
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }

    for (const shape of shapes) {
      renderShape(ctx, shape)
      if (shape.id === selectedId) renderSelection(ctx, shape)
    }

    if (drawingShape.current) {
      renderShape(ctx, drawingShape.current)
    }
    ctx.restore()
  }, [shapes, selectedId, pan, zoom])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800
      canvas.height = canvas.parentElement?.clientHeight || 600
      render()
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [render])

  useEffect(() => {
    render()
  }, [render])

  const pushUndo = () => {
    setUndoStack((prev) => [...prev.slice(-50), [...shapes]])
    setRedoStack([])
  }

  const undo = () => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]!
    setRedoStack((r) => [...r, [...shapes]])
    setUndoStack((s) => s.slice(0, -1))
    onShapesChange(prev)
  }

  const redo = () => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]!
    setUndoStack((s) => [...s, [...shapes]])
    setRedoStack((r) => r.slice(0, -1))
    onShapesChange(next)
  }

  const commitTextInput = useCallback(() => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null)
      return
    }
    pushUndo()
    const fontSize = 20
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    let textWidth = textInput.value.length * 10
    if (ctx) {
      ctx.font = `${fontSize}px Inter, sans-serif`
      textWidth = ctx.measureText(textInput.value).width
    }
    onShapesChange([
      ...shapes,
      {
        id: generateId(),
        type: 'text',
        x: textInput.x,
        y: textInput.y,
        width: textWidth,
        height: fontSize,
        color,
        strokeWidth,
        fill: 'transparent',
        text: textInput.value,
        rotation: 0,
      },
    ])
    setTextInput(null)
  }, [textInput, shapes, color, strokeWidth, onShapesChange])

  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    }
  }

  const getScreenPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button always pans
    if (e.button === 1 || tool === 'hand') {
      isPanning.current = true
      panStart.current = getScreenPos(e)
      return
    }

    const pos = getPos(e)
    startPos.current = pos

    if (tool === 'select') {
      const found = [...shapes].reverse().find((s) => hitTest(s, pos.x, pos.y))
      setSelectedId(found?.id || null)
      if (found) setIsDrawing(true) // drag mode
      return
    }

    if (tool === 'eraser') {
      const found = [...shapes].reverse().find((s) => hitTest(s, pos.x, pos.y))
      if (found) {
        pushUndo()
        onShapesChange(shapes.filter((s) => s.id !== found.id))
      }
      return
    }

    if (tool === 'text') {
      const screenPos = getScreenPos(e)
      setTextInput({ x: pos.x, y: pos.y, screenX: screenPos.x, screenY: screenPos.y, value: '' })
      setTimeout(() => textInputRef.current?.focus(), 0)
      return
    }

    setIsDrawing(true)
    const newShape: Shape = {
      id: generateId(),
      type: tool as Shape['type'],
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      color,
      strokeWidth,
      fill,
      rotation: 0,
      points:
        tool === 'freehand'
          ? [[0, 0]]
          : tool === 'line' || tool === 'arrow'
            ? [
                [0, 0],
                [0, 0],
              ]
            : undefined,
    }
    drawingShape.current = newShape
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const screen = getScreenPos(e)
      setPan((prev) => ({
        x: prev.x + screen.x - panStart.current.x,
        y: prev.y + screen.y - panStart.current.y,
      }))
      panStart.current = screen
      return
    }

    if (!isDrawing) return
    const pos = getPos(e)

    if (tool === 'select' && selectedId) {
      const dx = pos.x - startPos.current.x
      const dy = pos.y - startPos.current.y
      startPos.current = pos
      onShapesChange(
        shapes.map((s) => (s.id === selectedId ? { ...s, x: s.x + dx, y: s.y + dy } : s)),
      )
      return
    }

    if (!drawingShape.current) return

    if (drawingShape.current.type === 'freehand') {
      drawingShape.current.points!.push([
        pos.x - drawingShape.current.x,
        pos.y - drawingShape.current.y,
      ])
    } else if (drawingShape.current.type === 'line' || drawingShape.current.type === 'arrow') {
      drawingShape.current.points![1] = [
        pos.x - drawingShape.current.x,
        pos.y - drawingShape.current.y,
      ]
      drawingShape.current.width = Math.abs(pos.x - drawingShape.current.x)
      drawingShape.current.height = Math.abs(pos.y - drawingShape.current.y)
    } else {
      drawingShape.current.width = pos.x - startPos.current.x
      drawingShape.current.height = pos.y - startPos.current.y
    }
    render()
  }

  const handleMouseUp = () => {
    if (isPanning.current) {
      isPanning.current = false
      return
    }
    if (!isDrawing) return
    setIsDrawing(false)

    if (tool === 'select') return

    if (drawingShape.current) {
      pushUndo()
      onShapesChange([...shapes, drawingShape.current])
      drawingShape.current = null
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (textInput) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          pushUndo()
          onShapesChange(shapes.filter((s) => s.id !== selectedId))
          setSelectedId(null)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvasRef.current!.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const newZoom = Math.min(Math.max(zoom * factor, 0.1), 10)

      // Zoom toward cursor position
      setPan((prev) => ({
        x: mx - (mx - prev.x) * (newZoom / zoom),
        y: my - (my - prev.y) * (newZoom / zoom),
      }))
      setZoom(newZoom)
    },
    [zoom],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const cursorClass = tool === 'hand' ? 'cursor-grab' : 'cursor-default'

  return (
    <div className="relative w-full h-full">
      <Toolbar
        activeTool={tool}
        color={color}
        strokeWidth={strokeWidth}
        fill={fill}
        onToolChange={setTool}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
        onFillChange={setFill}
        onUndo={undo}
        onRedo={redo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        zoom={zoom}
        onZoomChange={setZoom}
        onPanReset={() => {
          setPan({ x: 0, y: 0 })
          setZoom(1)
        }}
      />
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${cursorClass} bg-white`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {textInput && (
        <input
          ref={textInputRef}
          type="text"
          value={textInput.value}
          onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitTextInput()
            if (e.key === 'Escape') setTextInput(null)
          }}
          onBlur={commitTextInput}
          className="absolute border-none outline-none bg-transparent"
          style={{
            left: textInput.screenX,
            top: textInput.screenY - 10,
            fontSize: `${20 * zoom}px`,
            fontFamily: 'Inter, sans-serif',
            color,
            minWidth: 20,
          }}
        />
      )}
    </div>
  )
}
