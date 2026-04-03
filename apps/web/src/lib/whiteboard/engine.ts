export type ShapeType = 'rectangle' | 'ellipse' | 'line' | 'freehand' | 'text' | 'arrow' | 'diamond'
export type ToolType = ShapeType | 'select' | 'eraser' | 'hand'
export type StrokeStyle = 'solid' | 'dashed' | 'dotted'
export type FontFamily = 'hand' | 'serif' | 'mono' | 'sans'
export type FontSize = 'S' | 'M' | 'L' | 'XL'
export type TextAlign = 'left' | 'center' | 'right'
export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'
export type ReorderDirection = 'front' | 'back' | 'forward' | 'backward'

export interface Shape {
  id: string
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  points?: number[][] // for freehand/line/arrow
  color: string
  strokeWidth: number
  fill: string
  text?: string
  rotation: number
  opacity: number // 0-100
  strokeStyle: StrokeStyle
  fontFamily: FontFamily
  fontSize: FontSize
  textAlign: TextAlign
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// ─── Constants ───

export const FONT_SIZE_PX: Record<FontSize, number> = { S: 16, M: 20, L: 28, XL: 40 }

export const FONT_FAMILY_CSS: Record<FontFamily, string> = {
  hand: "'Segoe Print', 'Comic Sans MS', cursive",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Fira Code', 'Courier New', monospace",
  sans: 'Inter, system-ui, sans-serif',
}

// ─── Factory ───

const SHAPE_DEFAULTS: Omit<Shape, 'id' | 'type' | 'x' | 'y'> = {
  width: 0,
  height: 0,
  color: '#333333',
  strokeWidth: 2,
  fill: 'transparent',
  rotation: 0,
  opacity: 100,
  strokeStyle: 'solid',
  fontFamily: 'sans',
  fontSize: 'M',
  textAlign: 'left',
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function createShape(partial: Partial<Shape> & Pick<Shape, 'type' | 'x' | 'y'>): Shape {
  return {
    ...SHAPE_DEFAULTS,
    id: generateId(),
    ...partial,
  }
}

// ─── Hit Testing ───

const HIT_MARGIN = 8

export function hitTest(shape: Shape, px: number, py: number): boolean {
  switch (shape.type) {
    case 'rectangle':
    case 'text':
      return hitTestRect(shape, px, py)
    case 'ellipse':
      return hitTestEllipse(shape, px, py)
    case 'diamond':
      return hitTestDiamond(shape, px, py)
    case 'freehand':
    case 'line':
    case 'arrow':
      return hitTestPoints(shape, px, py)
    default:
      return false
  }
}

function hitTestRect(shape: Shape, px: number, py: number): boolean {
  return (
    px >= shape.x - HIT_MARGIN &&
    px <= shape.x + shape.width + HIT_MARGIN &&
    py >= shape.y - HIT_MARGIN &&
    py <= shape.y + shape.height + HIT_MARGIN
  )
}

function hitTestEllipse(shape: Shape, px: number, py: number): boolean {
  const cx = shape.x + shape.width / 2
  const cy = shape.y + shape.height / 2
  const rx = shape.width / 2 + HIT_MARGIN
  const ry = shape.height / 2 + HIT_MARGIN
  return (px - cx) ** 2 / rx ** 2 + (py - cy) ** 2 / ry ** 2 <= 1
}

function hitTestDiamond(shape: Shape, px: number, py: number): boolean {
  const cx = shape.x + shape.width / 2
  const cy = shape.y + shape.height / 2
  const hw = shape.width / 2 + HIT_MARGIN
  const hh = shape.height / 2 + HIT_MARGIN
  return Math.abs(px - cx) / hw + Math.abs(py - cy) / hh <= 1
}

function hitTestPoints(shape: Shape, px: number, py: number): boolean {
  if (!shape.points) return false
  const threshold = HIT_MARGIN + shape.strokeWidth
  for (const [x, y] of shape.points) {
    if (Math.hypot(px - (x! + shape.x), py - (y! + shape.y)) < threshold) return true
  }
  return false
}

// ─── Bounding Box ───

export function getBoundingBox(shape: Shape): Rect {
  if (
    shape.points &&
    shape.points.length > 0 &&
    (shape.type === 'freehand' || shape.type === 'line' || shape.type === 'arrow')
  ) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of shape.points) {
      if (x! < minX) minX = x!
      if (y! < minY) minY = y!
      if (x! > maxX) maxX = x!
      if (y! > maxY) maxY = y!
    }
    return {
      x: shape.x + minX,
      y: shape.y + minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }
  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
}

export function getSelectionBounds(shapes: Shape[]): Rect | null {
  if (shapes.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const shape of shapes) {
    const box = getBoundingBox(shape)
    if (box.x < minX) minX = box.x
    if (box.y < minY) minY = box.y
    if (box.x + box.width > maxX) maxX = box.x + box.width
    if (box.y + box.height > maxY) maxY = box.y + box.height
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function intersectsRect(shape: Shape, rect: Rect): boolean {
  const box = getBoundingBox(shape)
  return !(
    box.x + box.width < rect.x ||
    rect.x + rect.width < box.x ||
    box.y + box.height < rect.y ||
    rect.y + rect.height < box.y
  )
}

// ─── Grid Snap ───

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

// ─── Resize ───

const HANDLE_RADIUS = 8

export function getResizeHandle(shape: Shape, px: number, py: number): ResizeHandle | null {
  const box = getBoundingBox(shape)
  const corners: [number, number, ResizeHandle][] = [
    [box.x, box.y, 'nw'],
    [box.x + box.width, box.y, 'ne'],
    [box.x, box.y + box.height, 'sw'],
    [box.x + box.width, box.y + box.height, 'se'],
  ]
  for (const [cx, cy, handle] of corners) {
    if (Math.hypot(px - cx, py - cy) <= HANDLE_RADIUS) return handle
  }
  return null
}

const MIN_SIZE = 10

export function resizeShape(shape: Shape, handle: ResizeHandle, dx: number, dy: number): Shape {
  let { x, y, width, height } = shape

  switch (handle) {
    case 'se':
      width = Math.max(MIN_SIZE, width + dx)
      height = Math.max(MIN_SIZE, height + dy)
      break
    case 'nw':
      x += dx
      y += dy
      width = Math.max(MIN_SIZE, width - dx)
      height = Math.max(MIN_SIZE, height - dy)
      break
    case 'ne':
      y += dy
      width = Math.max(MIN_SIZE, width + dx)
      height = Math.max(MIN_SIZE, height - dy)
      break
    case 'sw':
      x += dx
      width = Math.max(MIN_SIZE, width - dx)
      height = Math.max(MIN_SIZE, height + dy)
      break
  }

  return { ...shape, x, y, width, height }
}

// ─── Layer Reordering ───

export function reorderShapes(
  shapes: Shape[],
  ids: string[],
  direction: ReorderDirection,
): Shape[] {
  const result = [...shapes]
  const idSet = new Set(ids)

  switch (direction) {
    case 'front': {
      const selected = result.filter((s) => idSet.has(s.id))
      const rest = result.filter((s) => !idSet.has(s.id))
      return [...rest, ...selected]
    }
    case 'back': {
      const selected = result.filter((s) => idSet.has(s.id))
      const rest = result.filter((s) => !idSet.has(s.id))
      return [...selected, ...rest]
    }
    case 'forward': {
      for (let i = result.length - 2; i >= 0; i--) {
        if (idSet.has(result[i]!.id) && !idSet.has(result[i + 1]!.id)) {
          ;[result[i], result[i + 1]] = [result[i + 1]!, result[i]!]
        }
      }
      return result
    }
    case 'backward': {
      for (let i = 1; i < result.length; i++) {
        if (idSet.has(result[i]!.id) && !idSet.has(result[i - 1]!.id)) {
          ;[result[i], result[i - 1]] = [result[i - 1]!, result[i]!]
        }
      }
      return result
    }
  }
}

// ─── Duplicate ───

const DUPLICATE_OFFSET = 10

export function duplicateShapes(shapes: Shape[]): Shape[] {
  return shapes.map((s) => ({
    ...s,
    id: generateId(),
    x: s.x + DUPLICATE_OFFSET,
    y: s.y + DUPLICATE_OFFSET,
    points: s.points ? s.points.map((p) => [...p]) : undefined,
  }))
}

// ─── Text Measurement ───

export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFamily: FontFamily,
  fontSize: FontSize,
): { width: number; height: number } {
  const sizePx = FONT_SIZE_PX[fontSize]
  const family = FONT_FAMILY_CSS[fontFamily]
  ctx.font = `${sizePx}px ${family}`
  const lines = text.split('\n')
  const lineHeight = sizePx * 1.3
  let maxWidth = 0
  for (const line of lines) {
    const w = ctx.measureText(line).width
    if (w > maxWidth) maxWidth = w
  }
  return { width: maxWidth, height: lines.length * lineHeight }
}

// ─── Rendering ───

function applyStrokeStyle(ctx: CanvasRenderingContext2D, style: StrokeStyle, strokeWidth: number) {
  switch (style) {
    case 'dashed':
      ctx.setLineDash([strokeWidth * 4, strokeWidth * 3])
      break
    case 'dotted':
      ctx.setLineDash([strokeWidth, strokeWidth * 2])
      break
    default:
      ctx.setLineDash([])
  }
}

export function renderShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.save()
  ctx.globalAlpha = (shape.opacity ?? 100) / 100
  ctx.strokeStyle = shape.color
  ctx.fillStyle = shape.fill
  ctx.lineWidth = shape.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  applyStrokeStyle(ctx, shape.strokeStyle ?? 'solid', shape.strokeWidth)

  switch (shape.type) {
    case 'rectangle':
      renderRectangle(ctx, shape)
      break
    case 'ellipse':
      renderEllipse(ctx, shape)
      break
    case 'diamond':
      renderDiamond(ctx, shape)
      break
    case 'freehand':
      renderFreehand(ctx, shape)
      break
    case 'line':
    case 'arrow':
      renderLineOrArrow(ctx, shape)
      break
    case 'text':
      renderText(ctx, shape)
      break
  }

  ctx.restore()
}

function renderRectangle(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (shape.fill !== 'transparent') ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
  ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
}

function renderEllipse(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.beginPath()
  ctx.ellipse(
    shape.x + shape.width / 2,
    shape.y + shape.height / 2,
    Math.abs(shape.width / 2),
    Math.abs(shape.height / 2),
    0,
    0,
    Math.PI * 2,
  )
  if (shape.fill !== 'transparent') ctx.fill()
  ctx.stroke()
}

function renderDiamond(ctx: CanvasRenderingContext2D, shape: Shape) {
  const cx = shape.x + shape.width / 2
  const cy = shape.y + shape.height / 2
  ctx.beginPath()
  ctx.moveTo(cx, shape.y)
  ctx.lineTo(shape.x + shape.width, cy)
  ctx.lineTo(cx, shape.y + shape.height)
  ctx.lineTo(shape.x, cy)
  ctx.closePath()
  if (shape.fill !== 'transparent') ctx.fill()
  ctx.stroke()
}

function renderFreehand(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (!shape.points || shape.points.length < 2) return
  ctx.beginPath()
  ctx.moveTo(shape.points[0]![0]! + shape.x, shape.points[0]![1]! + shape.y)
  for (let i = 1; i < shape.points.length; i++) {
    ctx.lineTo(shape.points[i]![0]! + shape.x, shape.points[i]![1]! + shape.y)
  }
  ctx.stroke()
}

function renderLineOrArrow(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (!shape.points || shape.points.length < 2) return
  ctx.beginPath()
  ctx.moveTo(shape.points[0]![0]! + shape.x, shape.points[0]![1]! + shape.y)
  ctx.lineTo(shape.points[1]![0]! + shape.x, shape.points[1]![1]! + shape.y)
  ctx.stroke()

  if (shape.type === 'arrow') {
    const dx = shape.points[1]![0]! - shape.points[0]![0]!
    const dy = shape.points[1]![1]! - shape.points[0]![1]!
    const angle = Math.atan2(dy, dx)
    const headLen = 15
    const ex = shape.points[1]![0]! + shape.x
    const ey = shape.points[1]![1]! + shape.y
    ctx.beginPath()
    ctx.moveTo(
      ex - headLen * Math.cos(angle - Math.PI / 6),
      ey - headLen * Math.sin(angle - Math.PI / 6),
    )
    ctx.lineTo(ex, ey)
    ctx.lineTo(
      ex - headLen * Math.cos(angle + Math.PI / 6),
      ey - headLen * Math.sin(angle + Math.PI / 6),
    )
    ctx.stroke()
  }
}

function renderText(ctx: CanvasRenderingContext2D, shape: Shape) {
  const sizePx = FONT_SIZE_PX[shape.fontSize ?? 'M']
  const family = FONT_FAMILY_CSS[shape.fontFamily ?? 'sans']
  ctx.font = `${sizePx}px ${family}`
  ctx.fillStyle = shape.color
  ctx.textBaseline = 'top'

  const align = shape.textAlign ?? 'left'
  const lines = (shape.text || '').split('\n')
  const lineHeight = sizePx * 1.3

  for (let i = 0; i < lines.length; i++) {
    let drawX = shape.x
    if (align === 'center') drawX = shape.x + shape.width / 2
    else if (align === 'right') drawX = shape.x + shape.width

    ctx.textAlign = align
    ctx.fillText(lines[i]!, drawX, shape.y + i * lineHeight)
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

// ─── Selection Rendering ───

export function renderSelection(ctx: CanvasRenderingContext2D, shape: Shape) {
  const box = getBoundingBox(shape)
  ctx.save()
  ctx.strokeStyle = '#5C6BC0'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(box.x - 4, box.y - 4, box.width + 8, box.height + 8)
  ctx.setLineDash([])

  const handles: [number, number][] = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ]
  ctx.fillStyle = '#5C6BC0'
  for (const [hx, hy] of handles) {
    ctx.fillRect(hx - 3, hy - 3, 6, 6)
  }
  ctx.restore()
}

export function renderMultiSelection(ctx: CanvasRenderingContext2D, bounds: Rect) {
  ctx.save()
  ctx.strokeStyle = '#5C6BC0'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8)
  ctx.setLineDash([])
  ctx.restore()
}

export function renderSelectionBox(ctx: CanvasRenderingContext2D, rect: Rect) {
  ctx.save()
  ctx.strokeStyle = '#5C6BC0'
  ctx.fillStyle = 'rgba(92, 107, 192, 0.08)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
  ctx.setLineDash([])
  ctx.restore()
}
