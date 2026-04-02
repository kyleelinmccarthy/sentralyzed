export type ShapeType = 'rectangle' | 'ellipse' | 'line' | 'freehand' | 'text' | 'arrow'
export type ToolType = ShapeType | 'select' | 'eraser' | 'hand'

export interface Shape {
  id: string
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  points?: number[][] // for freehand/line
  color: string
  strokeWidth: number
  fill: string
  text?: string
  rotation: number
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function hitTest(shape: Shape, px: number, py: number): boolean {
  const margin = 8
  switch (shape.type) {
    case 'rectangle':
    case 'text':
      return (
        px >= shape.x - margin &&
        px <= shape.x + shape.width + margin &&
        py >= shape.y - margin &&
        py <= shape.y + shape.height + margin
      )
    case 'ellipse': {
      const cx = shape.x + shape.width / 2
      const cy = shape.y + shape.height / 2
      const rx = shape.width / 2 + margin
      const ry = shape.height / 2 + margin
      return (px - cx) ** 2 / rx ** 2 + (py - cy) ** 2 / ry ** 2 <= 1
    }
    case 'freehand':
    case 'line':
    case 'arrow': {
      if (!shape.points) return false
      for (const [x, y] of shape.points) {
        if (Math.hypot(px - (x! + shape.x), py - (y! + shape.y)) < margin + shape.strokeWidth)
          return true
      }
      return false
    }
    default:
      return false
  }
}

export function renderShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.save()
  ctx.strokeStyle = shape.color
  ctx.fillStyle = shape.fill
  ctx.lineWidth = shape.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (shape.type) {
    case 'rectangle':
      if (shape.fill !== 'transparent') ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
      break
    case 'ellipse': {
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
      break
    }
    case 'freehand':
      if (!shape.points || shape.points.length < 2) break
      ctx.beginPath()
      ctx.moveTo(shape.points[0]![0]! + shape.x, shape.points[0]![1]! + shape.y)
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i]![0]! + shape.x, shape.points[i]![1]! + shape.y)
      }
      ctx.stroke()
      break
    case 'line':
    case 'arrow':
      if (!shape.points || shape.points.length < 2) break
      ctx.beginPath()
      ctx.moveTo(shape.points[0]![0]! + shape.x, shape.points[0]![1]! + shape.y)
      ctx.lineTo(shape.points[1]![0]! + shape.x, shape.points[1]![1]! + shape.y)
      ctx.stroke()
      if (shape.type === 'arrow' && shape.points.length >= 2) {
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
      break
    case 'text':
      ctx.font = `${Math.max(14, shape.height)}px Inter, sans-serif`
      ctx.fillStyle = shape.color
      ctx.fillText(shape.text || '', shape.x, shape.y + shape.height)
      break
  }
  ctx.restore()
}

export function renderSelection(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.save()
  ctx.strokeStyle = '#5C6BC0'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(shape.x - 4, shape.y - 4, shape.width + 8, shape.height + 8)
  ctx.setLineDash([])
  // Resize handles
  const handles = [
    [shape.x - 4, shape.y - 4],
    [shape.x + shape.width + 4, shape.y - 4],
    [shape.x - 4, shape.y + shape.height + 4],
    [shape.x + shape.width + 4, shape.y + shape.height + 4],
  ]
  ctx.fillStyle = '#5C6BC0'
  for (const [hx, hy] of handles) {
    ctx.fillRect(hx! - 3, hy! - 3, 6, 6)
  }
  ctx.restore()
}
