import { describe, it, expect } from 'vitest'
import {
  type Shape,
  type StrokeStyle,
  generateId,
  hitTest,
  getBoundingBox,
  getSelectionBounds,
  intersectsRect,
  snapToGrid,
  getResizeHandle,
  resizeShape,
  reorderShapes,
  duplicateShapes,
  createShape,
  FONT_SIZE_PX,
  FONT_FAMILY_CSS,
} from '../engine'

// ─── Factory helper ───
function makeRect(overrides: Partial<Shape> = {}): Shape {
  return createShape({
    type: 'rectangle',
    x: 10,
    y: 10,
    width: 100,
    height: 80,
    ...overrides,
  })
}

function makeDiamond(overrides: Partial<Shape> = {}): Shape {
  return createShape({
    type: 'diamond',
    x: 50,
    y: 50,
    width: 100,
    height: 80,
    ...overrides,
  })
}

function makeLine(overrides: Partial<Shape> = {}): Shape {
  return createShape({
    type: 'line',
    x: 0,
    y: 0,
    points: [
      [0, 0],
      [100, 100],
    ],
    ...overrides,
  })
}

function makeFreehand(overrides: Partial<Shape> = {}): Shape {
  return createShape({
    type: 'freehand',
    x: 0,
    y: 0,
    points: [
      [0, 0],
      [10, 10],
      [20, 5],
      [30, 15],
    ],
    ...overrides,
  })
}

function makeText(overrides: Partial<Shape> = {}): Shape {
  return createShape({
    type: 'text',
    x: 10,
    y: 10,
    width: 100,
    height: 26, // M size * 1.3
    text: 'Hello',
    ...overrides,
  })
}

// ─── generateId ───
describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

// ─── createShape ───
describe('createShape', () => {
  it('fills in defaults for optional fields', () => {
    const s = createShape({ type: 'rectangle', x: 0, y: 0 })
    expect(s.id).toBeTruthy()
    expect(s.opacity).toBe(100)
    expect(s.strokeStyle).toBe('solid')
    expect(s.strokeWidth).toBe(2)
    expect(s.color).toBe('#333333')
    expect(s.fill).toBe('transparent')
    expect(s.rotation).toBe(0)
    expect(s.width).toBe(0)
    expect(s.height).toBe(0)
  })

  it('respects overrides', () => {
    const s = createShape({
      type: 'ellipse',
      x: 5,
      y: 10,
      opacity: 50,
      strokeStyle: 'dashed',
    })
    expect(s.opacity).toBe(50)
    expect(s.strokeStyle).toBe('dashed')
  })
})

// ─── hitTest ───
describe('hitTest', () => {
  describe('rectangle', () => {
    const rect = makeRect()
    it('returns true for a point inside', () => {
      expect(hitTest(rect, 50, 50)).toBe(true)
    })
    it('returns true near the edge (within margin)', () => {
      expect(hitTest(rect, 8, 50)).toBe(true) // 2px outside but within 8px margin
    })
    it('returns false for a point far outside', () => {
      expect(hitTest(rect, 300, 300)).toBe(false)
    })
  })

  describe('ellipse', () => {
    const ellipse = createShape({ type: 'ellipse', x: 0, y: 0, width: 100, height: 60 })
    it('returns true for center', () => {
      expect(hitTest(ellipse, 50, 30)).toBe(true)
    })
    it('returns false far outside', () => {
      expect(hitTest(ellipse, 200, 200)).toBe(false)
    })
  })

  describe('diamond', () => {
    const diamond = makeDiamond()
    it('returns true for center', () => {
      expect(hitTest(diamond, 100, 90)).toBe(true) // center of 50+100/2, 50+80/2
    })
    it('returns false for corner (outside diamond inscribed in rect)', () => {
      expect(hitTest(diamond, 51, 51)).toBe(false) // top-left corner of bounding rect
    })
    it('returns false far outside', () => {
      expect(hitTest(diamond, 300, 300)).toBe(false)
    })
  })

  describe('line / arrow / freehand', () => {
    const line = makeLine()
    it('returns true near a line point', () => {
      expect(hitTest(line, 1, 1)).toBe(true)
    })
    it('returns false far from points', () => {
      expect(hitTest(line, 200, 0)).toBe(false)
    })
  })
})

// ─── getBoundingBox ───
describe('getBoundingBox', () => {
  it('returns correct bounds for a rectangle', () => {
    const box = getBoundingBox(makeRect())
    expect(box).toEqual({ x: 10, y: 10, width: 100, height: 80 })
  })

  it('returns correct bounds for freehand from points', () => {
    const fh = makeFreehand({ x: 10, y: 20 })
    const box = getBoundingBox(fh)
    expect(box.x).toBe(10) // min point x (0) + shape x (10)
    expect(box.y).toBe(20) // min point y (0) + shape y (20)
    expect(box.width).toBe(30) // max x - min x of points
    expect(box.height).toBe(15) // max y - min y of points
  })

  it('returns correct bounds for a diamond', () => {
    const box = getBoundingBox(makeDiamond())
    expect(box).toEqual({ x: 50, y: 50, width: 100, height: 80 })
  })
})

// ─── getSelectionBounds ───
describe('getSelectionBounds', () => {
  it('returns bounds encompassing multiple shapes', () => {
    const shapes = [
      makeRect({ x: 0, y: 0, width: 50, height: 50 }),
      makeRect({ x: 100, y: 100, width: 50, height: 50 }),
    ]
    const bounds = getSelectionBounds(shapes)
    expect(bounds).toEqual({ x: 0, y: 0, width: 150, height: 150 })
  })

  it('returns null for empty array', () => {
    expect(getSelectionBounds([])).toBeNull()
  })
})

// ─── intersectsRect ───
describe('intersectsRect', () => {
  const rect = makeRect({ x: 10, y: 10, width: 100, height: 80 })

  it('returns true when selection overlaps shape', () => {
    expect(intersectsRect(rect, { x: 0, y: 0, width: 50, height: 50 })).toBe(true)
  })

  it('returns false when selection is far away', () => {
    expect(intersectsRect(rect, { x: 200, y: 200, width: 50, height: 50 })).toBe(false)
  })

  it('works for freehand shapes', () => {
    const fh = makeFreehand({ x: 0, y: 0 })
    expect(intersectsRect(fh, { x: -10, y: -10, width: 50, height: 50 })).toBe(true)
    expect(intersectsRect(fh, { x: 200, y: 200, width: 10, height: 10 })).toBe(false)
  })
})

// ─── snapToGrid ───
describe('snapToGrid', () => {
  it('snaps to nearest grid line', () => {
    expect(snapToGrid(23, 20)).toBe(20)
    expect(snapToGrid(31, 20)).toBe(40)
    expect(snapToGrid(10, 20)).toBe(20)
  })

  it('handles negative values', () => {
    expect(snapToGrid(-7, 20) + 0).toBe(0) // -0 + 0 === 0
    expect(snapToGrid(-13, 20)).toBe(-20)
  })
})

// ─── getResizeHandle ───
describe('getResizeHandle', () => {
  const rect = makeRect({ x: 10, y: 10, width: 100, height: 80 })

  it('returns "nw" for top-left corner', () => {
    expect(getResizeHandle(rect, 10, 10)).toBe('nw')
  })

  it('returns "se" for bottom-right corner', () => {
    expect(getResizeHandle(rect, 110, 90)).toBe('se')
  })

  it('returns "ne" for top-right corner', () => {
    expect(getResizeHandle(rect, 110, 10)).toBe('ne')
  })

  it('returns "sw" for bottom-left corner', () => {
    expect(getResizeHandle(rect, 10, 90)).toBe('sw')
  })

  it('returns null when not near any handle', () => {
    expect(getResizeHandle(rect, 50, 50)).toBeNull()
  })
})

// ─── resizeShape ───
describe('resizeShape', () => {
  it('resizes from SE handle (expand)', () => {
    const rect = makeRect({ x: 10, y: 10, width: 100, height: 80 })
    const resized = resizeShape(rect, 'se', 20, 10)
    expect(resized.width).toBe(120)
    expect(resized.height).toBe(90)
    expect(resized.x).toBe(10) // unchanged
    expect(resized.y).toBe(10) // unchanged
  })

  it('resizes from NW handle (moves origin)', () => {
    const rect = makeRect({ x: 10, y: 10, width: 100, height: 80 })
    const resized = resizeShape(rect, 'nw', 10, 10)
    expect(resized.x).toBe(20)
    expect(resized.y).toBe(20)
    expect(resized.width).toBe(90)
    expect(resized.height).toBe(70)
  })

  it('resizes from NE handle', () => {
    const rect = makeRect({ x: 10, y: 10, width: 100, height: 80 })
    const resized = resizeShape(rect, 'ne', 20, -10)
    expect(resized.width).toBe(120)
    expect(resized.y).toBe(0) // moved up
    expect(resized.height).toBe(90) // grew taller
  })

  it('enforces minimum size', () => {
    const rect = makeRect({ x: 10, y: 10, width: 100, height: 80 })
    const resized = resizeShape(rect, 'se', -200, -200)
    expect(resized.width).toBeGreaterThanOrEqual(10)
    expect(resized.height).toBeGreaterThanOrEqual(10)
  })
})

// ─── reorderShapes ───
describe('reorderShapes', () => {
  const a = makeRect({ id: 'a' } as Partial<Shape>)
  const b = makeRect({ id: 'b' } as Partial<Shape>)
  const c = makeRect({ id: 'c' } as Partial<Shape>)

  it('brings to front', () => {
    const result = reorderShapes([a, b, c], ['a'], 'front')
    expect(result.map((s) => s.id)).toEqual(['b', 'c', 'a'])
  })

  it('sends to back', () => {
    const result = reorderShapes([a, b, c], ['c'], 'back')
    expect(result.map((s) => s.id)).toEqual(['c', 'a', 'b'])
  })

  it('brings forward one step', () => {
    const result = reorderShapes([a, b, c], ['a'], 'forward')
    expect(result.map((s) => s.id)).toEqual(['b', 'a', 'c'])
  })

  it('sends backward one step', () => {
    const result = reorderShapes([a, b, c], ['c'], 'backward')
    expect(result.map((s) => s.id)).toEqual(['a', 'c', 'b'])
  })

  it('does not move if already at limit', () => {
    const result = reorderShapes([a, b, c], ['c'], 'front')
    expect(result.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })
})

// ─── duplicateShapes ───
describe('duplicateShapes', () => {
  it('returns copies with new IDs and offset position', () => {
    const shapes = [makeRect({ x: 10, y: 10 })]
    const dupes = duplicateShapes(shapes)
    expect(dupes).toHaveLength(1)
    expect(dupes[0]!.id).not.toBe(shapes[0]!.id)
    expect(dupes[0]!.x).toBe(20) // offset by 10
    expect(dupes[0]!.y).toBe(20)
    expect(dupes[0]!.type).toBe('rectangle')
  })

  it('preserves all shape properties except id and position', () => {
    const shapes = [
      makeRect({ color: '#FF0000', opacity: 75, strokeStyle: 'dashed' as StrokeStyle }),
    ]
    const dupes = duplicateShapes(shapes)
    expect(dupes[0]!.color).toBe('#FF0000')
    expect(dupes[0]!.opacity).toBe(75)
    expect(dupes[0]!.strokeStyle).toBe('dashed')
  })
})

// ─── Text properties ───
describe('text shape properties', () => {
  it('createShape defaults to sans / M / left for text', () => {
    const t = createShape({ type: 'text', x: 0, y: 0 })
    expect(t.fontFamily).toBe('sans')
    expect(t.fontSize).toBe('M')
    expect(t.textAlign).toBe('left')
  })

  it('respects font overrides', () => {
    const t = createShape({
      type: 'text',
      x: 0,
      y: 0,
      fontFamily: 'mono',
      fontSize: 'XL',
      textAlign: 'center',
    })
    expect(t.fontFamily).toBe('mono')
    expect(t.fontSize).toBe('XL')
    expect(t.textAlign).toBe('center')
  })

  it('FONT_SIZE_PX has all sizes', () => {
    expect(FONT_SIZE_PX.S).toBe(16)
    expect(FONT_SIZE_PX.M).toBe(20)
    expect(FONT_SIZE_PX.L).toBe(28)
    expect(FONT_SIZE_PX.XL).toBe(40)
  })

  it('FONT_FAMILY_CSS has all families', () => {
    expect(FONT_FAMILY_CSS.hand).toContain('cursive')
    expect(FONT_FAMILY_CSS.serif).toContain('serif')
    expect(FONT_FAMILY_CSS.mono).toContain('monospace')
    expect(FONT_FAMILY_CSS.sans).toContain('sans-serif')
  })

  it('hitTest works for text shapes', () => {
    const t = makeText()
    expect(hitTest(t, 50, 20)).toBe(true) // inside
    expect(hitTest(t, 300, 300)).toBe(false) // outside
  })

  it('duplicateShapes preserves text properties', () => {
    const shapes = [makeText({ fontFamily: 'hand', fontSize: 'L', textAlign: 'right' })]
    const dupes = duplicateShapes(shapes)
    expect(dupes[0]!.fontFamily).toBe('hand')
    expect(dupes[0]!.fontSize).toBe('L')
    expect(dupes[0]!.textAlign).toBe('right')
    expect(dupes[0]!.text).toBe('Hello')
  })
})
