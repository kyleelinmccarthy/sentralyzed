'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import {
  type Shape,
  type ToolType,
  type StrokeStyle,
  type FontFamily,
  type FontSize,
  type TextAlign,
  type ResizeHandle,
  type Rect,
  createShape,
  hitTest,
  renderShape,
  renderSelection,
  renderMultiSelection,
  renderSelectionBox,
  getResizeHandle,
  resizeShape,
  getSelectionBounds,
  intersectsRect,
  duplicateShapes,
  reorderShapes,
  measureText,
  loadCachedImage,
  constrainImageDimensions,
  intersectsPolygon,
  renderLassoPath,
  getFrameChildren,
  renderLaserTrail,
  type LaserPoint,
  fontSizeToPx,
  FONT_FAMILY_CSS,
  type ReorderDirection,
} from '@/lib/whiteboard/engine'
import { Toolbar } from './Toolbar'

interface CanvasProps {
  shapes: Shape[]
  onShapesChange: (shapes: Shape[]) => void
  viewport?: { pan: { x: number; y: number }; zoom: number }
  onViewportChange?: (viewport: { pan: { x: number; y: number }; zoom: number }) => void
  onManualPan?: () => void
}

// ─── Tool shortcut map ───
const TOOL_SHORTCUTS: Record<string, ToolType> = {
  '1': 'select',
  '2': 'hand',
  '3': 'rectangle',
  '4': 'diamond',
  '5': 'ellipse',
  '6': 'line',
  '7': 'arrow',
  '8': 'freehand',
  '9': 'text',
  '0': 'image',
  v: 'select',
  h: 'hand',
  r: 'rectangle',
  d: 'diamond',
  o: 'ellipse',
  l: 'line',
  a: 'arrow',
  p: 'freehand',
  t: 'text',
  i: 'image',
  e: 'eraser',
  f: 'frame',
  k: 'laser',
  w: 'embed',
}

export function WhiteboardCanvas({
  shapes,
  onShapesChange,
  viewport,
  onViewportChange,
  onManualPan,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<ToolType>('select')
  const [color, setColor] = useState('#333333')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [fill, setFill] = useState('transparent')
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>('solid')
  const [opacity, setOpacity] = useState(100)
  const [laserColor, setLaserColor] = useState('#FF4444')
  const [textColor, setTextColor] = useState('#333333')
  const [fontFamily, setFontFamily] = useState<FontFamily>('inter')
  const [fontSize, setFontSize] = useState<FontSize>(16)
  const [textAlign, setTextAlign] = useState<TextAlign>('left')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDrawing, setIsDrawing] = useState(false)
  const [undoStack, setUndoStack] = useState<Shape[][]>([])
  const [redoStack, setRedoStack] = useState<Shape[][]>([])
  const [textInput, setTextInput] = useState<{
    x: number
    y: number
    screenX: number
    screenY: number
    value: string
    editingId?: string
  } | null>(null)
  const textInputRef = useRef<HTMLTextAreaElement>(null)
  const drawingShape = useRef<Shape | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const resizeHandle = useRef<ResizeHandle | null>(null)
  const resizeShapeId = useRef<string | null>(null)
  const [selectionBox, setSelectionBox] = useState<Rect | null>(null)
  const selectionBoxStart = useRef<{ x: number; y: number } | null>(null)
  const clipboard = useRef<Shape[]>([])
  const lastClickTime = useRef(0)
  const lastClickId = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingImagePos = useRef<{ x: number; y: number } | null>(null)
  // Lasso selection
  const lassoPoints = useRef<number[][]>([])
  const isLassoing = useRef(false)
  // Laser pointer
  const laserPoints = useRef<LaserPoint[]>([])
  const laserAnimFrame = useRef(0)
  const isLasering = useRef(false)
  // Embed
  const [embedInput, setEmbedInput] = useState<{
    x: number
    y: number
    screenX: number
    screenY: number
    url: string
  } | null>(null)
  const embedInputRef = useRef<HTMLInputElement>(null)
  const [activeEmbedId, setActiveEmbedId] = useState<string | null>(null)

  // ─── Viewport sync (follow mode) ───
  const isProgrammaticViewport = useRef(false)

  // Accept programmatic viewport override from follow mode
  useEffect(() => {
    if (!viewport) return
    isProgrammaticViewport.current = true
    setPan(viewport.pan)
    setZoom(viewport.zoom)
    // Reset flag after React processes the state update
    requestAnimationFrame(() => {
      isProgrammaticViewport.current = false
    })
  }, [viewport])

  // Report viewport changes to parent
  useEffect(() => {
    onViewportChange?.({ pan, zoom })
  }, [pan, zoom, onViewportChange])

  // ─── Rendering ───
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

    // Shapes — frames first (background), then non-text, then text on top
    // Pre-cache images so they trigger re-render when loaded
    for (const shape of shapes) {
      if (shape.type === 'image' && shape.imageUrl) {
        loadCachedImage(shape.imageUrl, () => render())
      }
    }
    for (const shape of shapes) {
      if (shape.type === 'frame') {
        renderShape(ctx, shape)
        if (selectedIds.has(shape.id)) renderSelection(ctx, shape)
      }
    }
    for (const shape of shapes) {
      if (shape.type !== 'text' && shape.type !== 'frame') {
        renderShape(ctx, shape)
        if (selectedIds.has(shape.id)) renderSelection(ctx, shape)
      }
    }
    for (const shape of shapes) {
      if (shape.type === 'text') {
        renderShape(ctx, shape)
        if (selectedIds.has(shape.id)) renderSelection(ctx, shape)
      }
    }

    // Multi-selection bounds
    if (selectedIds.size > 1) {
      const selected = shapes.filter((s) => selectedIds.has(s.id))
      const bounds = getSelectionBounds(selected)
      if (bounds) renderMultiSelection(ctx, bounds)
    }

    // In-progress drawing
    if (drawingShape.current) {
      renderShape(ctx, drawingShape.current)
    }

    // Selection box
    if (selectionBox) {
      renderSelectionBox(ctx, selectionBox)
    }

    // Lasso path
    if (isLassoing.current && lassoPoints.current.length > 1) {
      renderLassoPath(ctx, lassoPoints.current)
    }

    // Laser trail
    if (laserPoints.current.length > 0) {
      laserPoints.current = renderLaserTrail(ctx, laserPoints.current, laserColor)
      if (laserPoints.current.length > 0) {
        cancelAnimationFrame(laserAnimFrame.current)
        laserAnimFrame.current = requestAnimationFrame(render)
      }
    }

    ctx.restore()
  }, [shapes, selectedIds, pan, zoom, selectionBox, laserColor])

  // ─── Canvas sizing ───
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

  // ─── Font loading: re-render once web fonts are ready ───
  useEffect(() => {
    document.fonts.ready.then(() => render())
  }, [render])

  // ─── Undo / Redo ───
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-50), [...shapes]])
    setRedoStack([])
  }, [shapes])

  const undo = useCallback(() => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]!
    setRedoStack((r) => [...r, [...shapes]])
    setUndoStack((s) => s.slice(0, -1))
    onShapesChange(prev)
    setSelectedIds(new Set())
  }, [undoStack, shapes, onShapesChange])

  const redo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]!
    setUndoStack((s) => [...s, [...shapes]])
    setRedoStack((r) => r.slice(0, -1))
    onShapesChange(next)
    setSelectedIds(new Set())
  }, [redoStack, shapes, onShapesChange])

  // ─── Image insertion ───
  const handleImageFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const img = new Image()
        img.onload = () => {
          const { width, height } = constrainImageDimensions(img.naturalWidth, img.naturalHeight)
          const pos = pendingImagePos.current ?? { x: 100, y: 100 }
          pushUndo()
          onShapesChange([
            ...shapes,
            createShape({
              type: 'image',
              x: pos.x,
              y: pos.y,
              width,
              height,
              imageUrl: dataUrl,
              color,
              strokeWidth,
              fill: 'transparent',
              opacity,
              strokeStyle,
            }),
          ])
          loadCachedImage(dataUrl, () => render())
          pendingImagePos.current = null
          setTool('select')
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    },
    [shapes, color, strokeWidth, opacity, strokeStyle, onShapesChange, pushUndo, render],
  )

  // ─── Direct image insert (from toolbar button) ───
  const handleImageInsert = useCallback(() => {
    // Place image at center of current viewport
    const canvas = canvasRef.current
    if (canvas) {
      const centerX = (canvas.width / 2 - pan.x) / zoom
      const centerY = (canvas.height / 2 - pan.y) / zoom
      pendingImagePos.current = { x: centerX, y: centerY }
    } else {
      pendingImagePos.current = { x: 100, y: 100 }
    }
    fileInputRef.current?.click()
  }, [pan, zoom])

  // ─── Text input commit ───
  const commitTextInput = useCallback(() => {
    if (!textInput) return

    const value = textInput.value.trim()

    // Editing existing text shape
    if (textInput.editingId) {
      if (!value) {
        pushUndo()
        onShapesChange(shapes.filter((s) => s.id !== textInput.editingId))
        setSelectedIds(new Set())
      } else {
        pushUndo()
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        let measured = { width: value.length * 10, height: fontSizeToPx(fontSize) * 1.3 }
        if (ctx) {
          measured = measureText(ctx, value, fontFamily, fontSize)
        }
        onShapesChange(
          shapes.map((s) =>
            s.id === textInput.editingId
              ? {
                  ...s,
                  text: value,
                  width: measured.width,
                  height: measured.height,
                  fontFamily,
                  fontSize,
                  textAlign,
                }
              : s,
          ),
        )
      }
      setTextInput(null)
      return
    }

    // Creating new text shape
    if (!value) {
      setTextInput(null)
      return
    }

    pushUndo()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    let measured = { width: value.length * 10, height: fontSizeToPx(fontSize) * 1.3 }
    if (ctx) {
      measured = measureText(ctx, value, fontFamily, fontSize)
    }
    onShapesChange([
      ...shapes,
      createShape({
        type: 'text',
        x: textInput.x,
        y: textInput.y,
        width: measured.width,
        height: measured.height,
        color: textColor,
        strokeWidth,
        fill: 'transparent',
        text: value,
        opacity,
        strokeStyle,
        fontFamily,
        fontSize,
        textAlign,
      }),
    ])
    setTextInput(null)
  }, [
    textInput,
    shapes,
    textColor,
    strokeWidth,
    opacity,
    strokeStyle,
    fontFamily,
    fontSize,
    textAlign,
    onShapesChange,
    pushUndo,
  ])

  // ─── Coordinate helpers ───
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

  // ─── Double-click to edit text ───
  const startEditingText = (shape: Shape, screenX: number, screenY: number) => {
    setFontFamily(shape.fontFamily ?? 'inter')
    setFontSize(typeof shape.fontSize === 'number' ? shape.fontSize : 16)
    setTextAlign(shape.textAlign ?? 'left')
    setTextColor(shape.color)

    setTextInput({
      x: shape.x,
      y: shape.y,
      screenX,
      screenY,
      value: shape.text || '',
      editingId: shape.id,
    })
    setTimeout(() => textInputRef.current?.focus(), 0)
  }

  // ─── Mouse handlers ───
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || tool === 'hand') {
      isPanning.current = true
      panStart.current = getScreenPos(e)
      return
    }

    const pos = getPos(e)
    const screenPos = getScreenPos(e)
    startPos.current = pos

    // Laser pointer
    if (tool === 'laser') {
      isLasering.current = true
      laserPoints.current.push({ x: pos.x, y: pos.y, time: Date.now() })
      return
    }

    // Embed tool — show URL input
    if (tool === 'embed') {
      setEmbedInput({ x: pos.x, y: pos.y, screenX: screenPos.x, screenY: screenPos.y, url: '' })
      setTimeout(() => embedInputRef.current?.focus(), 0)
      return
    }

    // Double-click detection for text editing and embed viewing
    const now = Date.now()
    if (tool === 'select') {
      const found = [...shapes].reverse().find((s) => hitTest(s, pos.x, pos.y))
      if (found && now - lastClickTime.current < 400 && lastClickId.current === found.id) {
        if (found.type === 'text') {
          startEditingText(found, screenPos.x, screenPos.y)
          lastClickTime.current = 0
          return
        }
        if (found.type === 'embed' && found.url) {
          setActiveEmbedId(found.id)
          lastClickTime.current = 0
          return
        }
      }
      lastClickTime.current = now
      lastClickId.current = found?.id || null
    }

    if (tool === 'select') {
      for (const id of selectedIds) {
        const shape = shapes.find((s) => s.id === id)
        if (shape) {
          const handle = getResizeHandle(shape, pos.x, pos.y)
          if (handle) {
            resizeHandle.current = handle
            resizeShapeId.current = id
            setIsDrawing(true)
            return
          }
        }
      }

      const found = [...shapes].reverse().find((s) => hitTest(s, pos.x, pos.y))

      if (found) {
        if (e.shiftKey) {
          setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(found.id)) next.delete(found.id)
            else next.add(found.id)
            return next
          })
        } else if (!selectedIds.has(found.id)) {
          setSelectedIds(new Set([found.id]))
        }
        setIsDrawing(true)
      } else {
        if (!e.shiftKey) setSelectedIds(new Set())
        if (e.altKey) {
          // Lasso selection
          isLassoing.current = true
          lassoPoints.current = [[pos.x, pos.y]]
        } else {
          selectionBoxStart.current = pos
        }
      }
      return
    }

    if (tool === 'eraser') {
      const found = [...shapes].reverse().find((s) => hitTest(s, pos.x, pos.y))
      if (found) {
        pushUndo()
        onShapesChange(shapes.filter((s) => s.id !== found.id))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(found.id)
          return next
        })
      }
      return
    }

    if (tool === 'text') {
      setTextInput({
        x: pos.x,
        y: pos.y,
        screenX: screenPos.x,
        screenY: screenPos.y,
        value: '',
      })
      setTimeout(() => textInputRef.current?.focus(), 0)
      return
    }

    setIsDrawing(true)
    const newShape = createShape({
      type: tool as Shape['type'],
      x: pos.x,
      y: pos.y,
      color,
      strokeWidth,
      fill,
      opacity,
      strokeStyle,
      fontFamily,
      fontSize,
      textAlign,
      label: tool === 'frame' ? 'Frame' : undefined,
      points:
        tool === 'freehand'
          ? [[0, 0]]
          : tool === 'line' || tool === 'arrow'
            ? [
                [0, 0],
                [0, 0],
              ]
            : undefined,
    })
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
      if (!isProgrammaticViewport.current) onManualPan?.()
      return
    }

    const pos = getPos(e)

    // Laser pointer tracking
    if (isLasering.current) {
      laserPoints.current.push({ x: pos.x, y: pos.y, time: Date.now() })
      render()
      return
    }

    // Lasso selection tracking
    if (isLassoing.current) {
      lassoPoints.current.push([pos.x, pos.y])
      const intersecting = shapes.filter((s) => intersectsPolygon(s, lassoPoints.current))
      setSelectedIds(new Set(intersecting.map((s) => s.id)))
      render()
      return
    }

    if (selectionBoxStart.current) {
      const sx = selectionBoxStart.current.x
      const sy = selectionBoxStart.current.y
      const box: Rect = {
        x: Math.min(sx, pos.x),
        y: Math.min(sy, pos.y),
        width: Math.abs(pos.x - sx),
        height: Math.abs(pos.y - sy),
      }
      setSelectionBox(box)
      const intersecting = shapes.filter((s) => intersectsRect(s, box))
      setSelectedIds(new Set(intersecting.map((s) => s.id)))
      return
    }

    if (!isDrawing) return

    if (resizeHandle.current && resizeShapeId.current) {
      const dx = pos.x - startPos.current.x
      const dy = pos.y - startPos.current.y
      startPos.current = pos
      onShapesChange(
        shapes.map((s) =>
          s.id === resizeShapeId.current ? resizeShape(s, resizeHandle.current!, dx, dy) : s,
        ),
      )
      return
    }

    if (tool === 'select' && selectedIds.size > 0) {
      const dx = pos.x - startPos.current.x
      const dy = pos.y - startPos.current.y
      startPos.current = pos
      // Collect child IDs of any selected frames
      const frameChildIds = new Set<string>()
      for (const id of selectedIds) {
        const shape = shapes.find((s) => s.id === id)
        if (shape?.type === 'frame' && shape.childIds) {
          for (const cid of shape.childIds) frameChildIds.add(cid)
        }
      }
      onShapesChange(
        shapes.map((s) =>
          selectedIds.has(s.id) || frameChildIds.has(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s,
        ),
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
    // Lasso selection finalize
    if (isLassoing.current) {
      isLassoing.current = false
      lassoPoints.current = []
      render()
      return
    }

    // Laser pointer — stop collecting but trail keeps fading
    if (isLasering.current) {
      isLasering.current = false
      render() // triggers fade animation via requestAnimationFrame
      return
    }

    if (selectionBoxStart.current) {
      selectionBoxStart.current = null
      setSelectionBox(null)
      return
    }

    if (isPanning.current) {
      isPanning.current = false
      return
    }

    if (!isDrawing) return
    setIsDrawing(false)

    if (resizeHandle.current) {
      pushUndo()
      resizeHandle.current = null
      resizeShapeId.current = null
      // Recompute frame children after resize
      const resizedId = resizeShapeId.current
      if (resizedId) {
        const resizedShape = shapes.find((s) => s.id === resizedId)
        if (resizedShape?.type === 'frame') {
          onShapesChange(
            shapes.map((s) =>
              s.id === resizedId ? { ...s, childIds: getFrameChildren(s, shapes) } : s,
            ),
          )
        }
      }
      return
    }

    if (tool === 'select') {
      // After moving, recompute childIds for all frames
      const hasFrames = shapes.some((s) => s.type === 'frame')
      if (hasFrames) {
        onShapesChange(
          shapes.map((s) =>
            s.type === 'frame' ? { ...s, childIds: getFrameChildren(s, shapes) } : s,
          ),
        )
      }
      return
    }

    if (drawingShape.current) {
      pushUndo()
      const newShape = drawingShape.current
      // If it's a frame, compute its children
      if (newShape.type === 'frame') {
        newShape.childIds = getFrameChildren(newShape, shapes)
      }
      onShapesChange([...shapes, newShape])
      drawingShape.current = null
    }
  }

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (textInput) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const mapped = TOOL_SHORTCUTS[e.key]
        if (mapped) {
          if (mapped === 'image') {
            handleImageInsert()
          } else {
            setTool(mapped)
          }
          return
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          pushUndo()
          onShapesChange(shapes.filter((s) => !selectedIds.has(s.id)))
          setSelectedIds(new Set())
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        setSelectedIds(new Set(shapes.map((s) => s.id)))
        setTool('select')
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        if (selectedIds.size > 0) {
          clipboard.current = shapes.filter((s) => selectedIds.has(s.id))
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
        if (selectedIds.size > 0) {
          clipboard.current = shapes.filter((s) => selectedIds.has(s.id))
          pushUndo()
          onShapesChange(shapes.filter((s) => !selectedIds.has(s.id)))
          setSelectedIds(new Set())
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        if (clipboard.current.length > 0) {
          pushUndo()
          const dupes = duplicateShapes(clipboard.current)
          onShapesChange([...shapes, ...dupes])
          setSelectedIds(new Set(dupes.map((s) => s.id)))
          clipboard.current = dupes
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        if (selectedIds.size > 0) {
          pushUndo()
          const selected = shapes.filter((s) => selectedIds.has(s.id))
          const dupes = duplicateShapes(selected)
          onShapesChange([...shapes, ...dupes])
          setSelectedIds(new Set(dupes.map((s) => s.id)))
        }
        return
      }

      if (e.key === 'Escape') {
        setSelectedIds(new Set())
        setTool('select')
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  // ─── Wheel zoom ───
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvasRef.current!.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const newZoom = Math.min(Math.max(zoom * factor, 0.1), 10)

      setPan((prev) => ({
        x: mx - (mx - prev.x) * (newZoom / zoom),
        y: my - (my - prev.y) * (newZoom / zoom),
      }))
      setZoom(newZoom)
      if (!isProgrammaticViewport.current) onManualPan?.()
    },
    [zoom, onManualPan],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleReorder = useCallback(
    (direction: ReorderDirection) => {
      if (selectedIds.size === 0) return
      pushUndo()
      onShapesChange(reorderShapes(shapes, [...selectedIds], direction))
    },
    [shapes, selectedIds, pushUndo, onShapesChange],
  )

  // ─── Selected text shape support ───
  const selectedTextShapes = shapes.filter((s) => selectedIds.has(s.id) && s.type === 'text')
  const hasTextSelection = selectedTextShapes.length > 0

  // Sync toolbar state from selected text shape
  useEffect(() => {
    if (selectedTextShapes.length === 1) {
      const s = selectedTextShapes[0]!
      setTextColor(s.color)
      setFontFamily((s.fontFamily as FontFamily) ?? 'inter')
      setFontSize(typeof s.fontSize === 'number' ? s.fontSize : 16)
      setTextAlign(s.textAlign ?? 'left')
    }
  }, [selectedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update selected text shapes when toolbar properties change
  const updateSelectedText = useCallback(
    (updates: Partial<Shape>) => {
      if (selectedTextShapes.length === 0) return
      pushUndo()
      const ctx = canvasRef.current?.getContext('2d')
      onShapesChange(
        shapes.map((s) => {
          if (!selectedIds.has(s.id) || s.type !== 'text') return s
          const updated = { ...s, ...updates }
          // Re-measure if font properties changed
          if (ctx && s.text && ('fontFamily' in updates || 'fontSize' in updates)) {
            const measured = measureText(
              ctx,
              s.text,
              updated.fontFamily as FontFamily,
              updated.fontSize,
            )
            updated.width = measured.width
            updated.height = measured.height
          }
          return updated
        }),
      )
    },
    [selectedTextShapes.length, shapes, selectedIds, pushUndo, onShapesChange],
  )

  const handleTextColorChange = useCallback(
    (c: string) => {
      setTextColor(c)
      if (hasTextSelection) updateSelectedText({ color: c })
    },
    [hasTextSelection, updateSelectedText],
  )

  const handleFontFamilyChange = useCallback(
    (f: FontFamily) => {
      setFontFamily(f)
      if (hasTextSelection) updateSelectedText({ fontFamily: f })
    },
    [hasTextSelection, updateSelectedText],
  )

  const handleFontSizeChange = useCallback(
    (s: FontSize) => {
      setFontSize(s)
      if (hasTextSelection) updateSelectedText({ fontSize: s })
    },
    [hasTextSelection, updateSelectedText],
  )

  const handleTextAlignChange = useCallback(
    (a: TextAlign) => {
      setTextAlign(a)
      if (hasTextSelection) updateSelectedText({ textAlign: a })
    },
    [hasTextSelection, updateSelectedText],
  )

  const getCursor = () => {
    if (tool === 'hand') return 'cursor-grab'
    if (tool === 'text') return 'cursor-text'
    if (tool === 'eraser') return 'cursor-pointer'
    if (tool === 'embed') return 'cursor-cell'
    if (tool !== 'select') return 'cursor-crosshair'
    return 'cursor-default'
  }

  const textInputFontSize = fontSizeToPx(fontSize)
  const textInputFontFamily = FONT_FAMILY_CSS[fontFamily] ?? FONT_FAMILY_CSS.inter

  return (
    <div className="relative w-full h-full">
      <Toolbar
        activeTool={tool}
        color={color}
        strokeWidth={strokeWidth}
        fill={fill}
        strokeStyle={strokeStyle}
        opacity={opacity}
        textColor={textColor}
        fontFamily={fontFamily}
        fontSize={fontSize}
        textAlign={textAlign}
        laserColor={laserColor}
        onToolChange={setTool}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
        onFillChange={setFill}
        onStrokeStyleChange={setStrokeStyle}
        onOpacityChange={setOpacity}
        onTextColorChange={handleTextColorChange}
        onFontFamilyChange={handleFontFamilyChange}
        onFontSizeChange={handleFontSizeChange}
        onTextAlignChange={handleTextAlignChange}
        onLaserColorChange={setLaserColor}
        onUndo={undo}
        onRedo={redo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        zoom={zoom}
        onZoomChange={setZoom}
        onPanReset={() => {
          setPan({ x: 0, y: 0 })
          setZoom(1)
          onManualPan?.()
        }}
        hasSelection={selectedIds.size > 0}
        hasTextSelection={hasTextSelection}
        onReorder={handleReorder}
        onImageInsert={handleImageInsert}
        selectedFrameLabel={
          selectedIds.size === 1
            ? shapes.find((s) => s.id === [...selectedIds][0] && s.type === 'frame')?.label
            : undefined
        }
        onFrameLabelChange={(label: string) => {
          const frameId = [...selectedIds][0]
          if (frameId) {
            onShapesChange(shapes.map((s) => (s.id === frameId ? { ...s, label } : s)))
          }
        }}
      />
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${getCursor()} bg-white`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {textInput && (
        <textarea
          ref={textInputRef}
          value={textInput.value}
          onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              commitTextInput()
            }
            if (e.key === 'Escape') setTextInput(null)
          }}
          onBlur={commitTextInput}
          className="absolute border-none outline-none bg-transparent resize-none overflow-hidden"
          style={{
            left: textInput.screenX,
            top: textInput.screenY - 4,
            fontSize: `${textInputFontSize * zoom}px`,
            fontFamily: textInputFontFamily,
            color: textColor,
            minWidth: 40,
            minHeight: textInputFontSize * zoom * 1.3,
            textAlign,
            lineHeight: 1.3,
          }}
          rows={1}
        />
      )}
      {/* Embed URL input */}
      {embedInput && (
        <input
          ref={embedInputRef}
          type="url"
          value={embedInput.url}
          onChange={(e) => setEmbedInput({ ...embedInput, url: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && embedInput.url.trim()) {
              pushUndo()
              onShapesChange([
                ...shapes,
                createShape({
                  type: 'embed',
                  x: embedInput.x,
                  y: embedInput.y,
                  width: 400,
                  height: 300,
                  url: embedInput.url.trim(),
                  color,
                  strokeWidth,
                  fill: 'transparent',
                  opacity,
                  strokeStyle,
                }),
              ])
              setEmbedInput(null)
              setTool('select')
            }
            if (e.key === 'Escape') setEmbedInput(null)
          }}
          onBlur={() => setEmbedInput(null)}
          placeholder="Paste URL and press Enter..."
          className="absolute bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 text-sm shadow-lg w-80 z-20"
          style={{ left: embedInput.screenX, top: embedInput.screenY }}
        />
      )}
      {/* Embed iframe overlay */}
      {activeEmbedId &&
        (() => {
          const embedShape = shapes.find((s) => s.id === activeEmbedId)
          if (!embedShape?.url) return null
          const left = embedShape.x * zoom + pan.x
          const top = embedShape.y * zoom + pan.y
          const width = embedShape.width * zoom
          const height = embedShape.height * zoom
          return (
            <div
              className="absolute z-20 border border-gray-300 dark:border-dark-border rounded-lg overflow-hidden shadow-lg"
              style={{ left, top, width, height }}
            >
              <div className="h-6 bg-gray-100 dark:bg-dark-card flex items-center justify-between px-2">
                <span className="text-[10px] text-french-gray truncate flex-1">
                  {embedShape.url}
                </span>
                <button
                  onClick={() => setActiveEmbedId(null)}
                  className="text-xs text-french-gray hover:text-jet dark:hover:text-dark-text ml-2"
                >
                  x
                </button>
              </div>
              <iframe
                src={embedShape.url}
                sandbox="allow-scripts allow-same-origin"
                className="w-full bg-white"
                style={{ height: height - 24 }}
                title="Embedded content"
              />
            </div>
          )
        })()}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
