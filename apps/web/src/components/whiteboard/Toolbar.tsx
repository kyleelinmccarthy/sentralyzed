'use client'

import type {
  ToolType,
  StrokeStyle,
  FontFamily,
  FontSize,
  TextAlign,
  ReorderDirection,
} from '@/lib/whiteboard/engine'
import { FONT_FAMILY_LABELS, FONT_FAMILY_CSS, FONT_SIZES } from '@/lib/whiteboard/engine'

interface ToolbarProps {
  activeTool: ToolType
  color: string
  strokeWidth: number
  fill: string
  strokeStyle: StrokeStyle
  opacity: number
  textColor: string
  fontFamily: FontFamily
  fontSize: FontSize
  textAlign: TextAlign
  laserColor: string
  onToolChange: (tool: ToolType) => void
  onColorChange: (color: string) => void
  onStrokeWidthChange: (width: number) => void
  onFillChange: (fill: string) => void
  onStrokeStyleChange: (style: StrokeStyle) => void
  onOpacityChange: (opacity: number) => void
  onTextColorChange: (color: string) => void
  onFontFamilyChange: (family: FontFamily) => void
  onFontSizeChange: (size: FontSize) => void
  onTextAlignChange: (align: TextAlign) => void
  onLaserColorChange: (color: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  zoom: number
  onZoomChange: (zoom: number) => void
  onPanReset: () => void
  hasSelection: boolean
  hasTextSelection: boolean
  onReorder: (direction: ReorderDirection) => void
  selectedFrameLabel?: string
  onFrameLabelChange: (label: string) => void
  onImageInsert: () => void
}

// ─── SVG Icons ───

const SelectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
    <path d="M3 1 L3 14 L6.5 10.5 L9.5 15 L11.5 14 L8.5 9 L13 9 Z" />
  </svg>
)

const HandIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 1.5v8M5.5 4v6.5M3 6v4.5a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V4.5" />
    <path d="M10.5 3v7.5" />
    <path d="M13 5.5v5" />
  </svg>
)

const EraserIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 2 L14 5 L7 12 L2 12 L2 9 Z" />
    <line x1="2" y1="14" x2="14" y2="14" />
    <line x1="8.5" y1="4.5" x2="11.5" y2="7.5" />
  </svg>
)

const ImageIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
    <circle cx="5" cy="6" r="1.5" />
    <path d="M14.5 10.5 L10.5 7 L6.5 11 L4.5 9.5 L1.5 12" />
  </svg>
)

const LaserIcon = ({ color }: { color: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="8" r="3" fill={color} opacity="0.8" />
    <circle cx="8" cy="8" r="5" stroke={color} opacity="0.4" />
    <circle cx="8" cy="8" r="7" stroke={color} opacity="0.2" />
  </svg>
)

// ─── Tool definitions split into groups ───

const navigationTools: {
  type: ToolType
  label: string
  icon: React.ReactNode
  shortcut: string
}[] = [
  { type: 'select', label: 'Select (Alt+drag: lasso)', icon: <SelectIcon />, shortcut: 'V' },
  { type: 'hand', label: 'Hand (Pan)', icon: <HandIcon />, shortcut: 'H' },
]

const shapeTools: { type: ToolType; label: string; icon: string; shortcut: string }[] = [
  { type: 'rectangle', label: 'Rectangle', icon: '▭', shortcut: 'R' },
  { type: 'diamond', label: 'Diamond', icon: '◇', shortcut: 'D' },
  { type: 'ellipse', label: 'Ellipse', icon: '◯', shortcut: 'O' },
  { type: 'line', label: 'Line', icon: '╱', shortcut: 'L' },
  { type: 'arrow', label: 'Arrow', icon: '→', shortcut: 'A' },
]

const paletteColors = [
  '#2D2D2D',
  '#5C6BC0',
  '#FF7043',
  '#26A69A',
  '#3B82F6',
  '#F59E0B',
  '#E53935',
  '#7B1FA2',
  '#64748B',
  '#FFFFFF',
]

const laserColors = [
  { color: '#FF4444', label: 'Red' },
  { color: '#FF8800', label: 'Orange' },
  { color: '#FFDD00', label: 'Yellow' },
  { color: '#44FF44', label: 'Green' },
  { color: '#4488FF', label: 'Blue' },
  { color: '#AA44FF', label: 'Purple' },
  { color: '#FF44FF', label: 'Pink' },
  { color: '#FFFFFF', label: 'White' },
]

const strokeStyles: { value: StrokeStyle; label: string; preview: string }[] = [
  { value: 'solid', label: 'Solid', preview: '—' },
  { value: 'dashed', label: 'Dashed', preview: '- -' },
  { value: 'dotted', label: 'Dotted', preview: '···' },
]

const fontFamilyOptions = Object.keys(FONT_FAMILY_LABELS) as FontFamily[]

const AlignLeftIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <line x1="1" y1="2" x2="13" y2="2" />
    <line x1="1" y1="5.5" x2="9" y2="5.5" />
    <line x1="1" y1="9" x2="11" y2="9" />
    <line x1="1" y1="12.5" x2="7" y2="12.5" />
  </svg>
)

const AlignCenterIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <line x1="1" y1="2" x2="13" y2="2" />
    <line x1="3" y1="5.5" x2="11" y2="5.5" />
    <line x1="2" y1="9" x2="12" y2="9" />
    <line x1="4" y1="12.5" x2="10" y2="12.5" />
  </svg>
)

const AlignRightIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <line x1="1" y1="2" x2="13" y2="2" />
    <line x1="5" y1="5.5" x2="13" y2="5.5" />
    <line x1="3" y1="9" x2="13" y2="9" />
    <line x1="7" y1="12.5" x2="13" y2="12.5" />
  </svg>
)

const textAligns: { value: TextAlign; icon: React.ReactNode; label: string }[] = [
  { value: 'left', icon: <AlignLeftIcon />, label: 'Align left' },
  { value: 'center', icon: <AlignCenterIcon />, label: 'Align center' },
  { value: 'right', icon: <AlignRightIcon />, label: 'Align right' },
]

function Divider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />
}

function ColorPicker({
  label,
  colors,
  value,
  onChange,
  allowTransparent,
}: {
  label: string
  colors: string[]
  value: string
  onChange: (color: string) => void
  allowTransparent?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-french-gray">{label}</span>
      {allowTransparent && (
        <button
          onClick={() => onChange('transparent')}
          className={`w-5 h-5 rounded-full border-2 ${value === 'transparent' ? 'border-indigo' : 'border-gray-200'}`}
          style={{
            backgroundImage:
              'linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%)',
            backgroundSize: '6px 6px',
            backgroundPosition: '0 0, 3px 3px',
          }}
          title="No fill"
        />
      )}
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-5 h-5 rounded-full border-2 ${value === c ? 'border-indigo' : 'border-gray-200'}`}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
      <label
        className="relative w-5 h-5 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer"
        title="Custom color"
      >
        <input
          type="color"
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <span
          className="block w-full h-full"
          style={{
            background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
          }}
        />
      </label>
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  title,
  children,
  className = '',
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-1.5 py-1 text-xs rounded transition-colors
        ${active ? 'bg-indigo/10 text-indigo font-medium' : 'text-french-gray hover:bg-gray-100'} ${className}`}
    >
      {children}
    </button>
  )
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors
        ${active ? 'bg-indigo text-white' : 'hover:bg-gray-100 text-jet'}`}
    >
      {children}
    </button>
  )
}

export function Toolbar(props: ToolbarProps) {
  const isTextTool = props.activeTool === 'text'
  const isLaserTool = props.activeTool === 'laser'

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
      {/* Row 1: Navigation + Shapes + Stroke properties + Undo/Redo + Zoom */}
      <div className="bg-white rounded-[12px] shadow-lg flex items-center gap-1 p-2">
        {/* Navigation tools: Select, Hand */}
        {navigationTools.map((tool) => (
          <ToolButton
            key={tool.type}
            active={props.activeTool === tool.type}
            onClick={() => props.onToolChange(tool.type)}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
          </ToolButton>
        ))}

        <Divider />

        {/* Shape tools */}
        {shapeTools.map((tool) => (
          <ToolButton
            key={tool.type}
            active={props.activeTool === tool.type}
            onClick={() => props.onToolChange(tool.type)}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
          </ToolButton>
        ))}

        <Divider />

        {/* Stroke color */}
        <ColorPicker
          label="Stroke"
          colors={paletteColors}
          value={props.color}
          onChange={props.onColorChange}
        />

        {/* Stroke width */}
        <select
          value={props.strokeWidth}
          onChange={(e) => props.onStrokeWidthChange(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded px-1 py-1 ml-1"
          title="Stroke width"
        >
          <option value={1}>1px</option>
          <option value={2}>2px</option>
          <option value={4}>4px</option>
          <option value={8}>8px</option>
        </select>

        {/* Stroke style */}
        <div className="flex items-center gap-0.5 ml-0.5">
          {strokeStyles.map((s) => (
            <ToggleButton
              key={s.value}
              active={props.strokeStyle === s.value}
              onClick={() => props.onStrokeStyleChange(s.value)}
              title={s.label}
            >
              {s.preview}
            </ToggleButton>
          ))}
        </div>

        <Divider />

        {/* Fill color */}
        <ColorPicker
          label="Fill"
          colors={paletteColors}
          value={props.fill}
          onChange={props.onFillChange}
          allowTransparent
        />

        <Divider />

        {/* Opacity */}
        <div className="flex items-center gap-1" title={`Opacity: ${props.opacity}%`}>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={props.opacity}
            onChange={(e) => props.onOpacityChange(Number(e.target.value))}
            className="w-16 h-1 accent-indigo"
          />
          <span className="text-[10px] text-french-gray w-6">{props.opacity}%</span>
        </div>

        <Divider />

        {/* Undo/Redo */}
        <button
          onClick={props.onUndo}
          disabled={!props.canUndo}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm disabled:opacity-30 hover:bg-gray-100"
          title="Undo (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          onClick={props.onRedo}
          disabled={!props.canRedo}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm disabled:opacity-30 hover:bg-gray-100"
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪
        </button>

        <Divider />

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

      {/* Row 2: Drawing & creation tools */}
      <div className="bg-white rounded-[12px] shadow-lg flex items-center gap-1 p-2">
        <ToolButton
          active={props.activeTool === 'freehand'}
          onClick={() => props.onToolChange('freehand')}
          title="Draw (P)"
        >
          ✎
        </ToolButton>
        <ToolButton
          active={props.activeTool === 'eraser'}
          onClick={() => props.onToolChange('eraser')}
          title="Eraser (E)"
        >
          <EraserIcon />
        </ToolButton>

        <Divider />

        <ToolButton
          active={props.activeTool === 'text'}
          onClick={() => props.onToolChange('text')}
          title="Text (T)"
        >
          T
        </ToolButton>
        <ToolButton active={false} onClick={props.onImageInsert} title="Image (I)">
          <ImageIcon />
        </ToolButton>
        <ToolButton
          active={props.activeTool === 'frame'}
          onClick={() => props.onToolChange('frame')}
          title="Frame (F)"
        >
          ⬚
        </ToolButton>
        <ToolButton
          active={props.activeTool === 'embed'}
          onClick={() => props.onToolChange('embed')}
          title="Embed (W)"
        >
          🔗
        </ToolButton>

        <Divider />

        {/* Laser pointer with color options */}
        <ToolButton
          active={isLaserTool}
          onClick={() => props.onToolChange('laser')}
          title="Laser (K)"
        >
          <LaserIcon color={props.laserColor} />
        </ToolButton>
        {isLaserTool && (
          <div className="flex items-center gap-0.5 ml-0.5">
            {laserColors.map((lc) => (
              <button
                key={lc.color}
                onClick={() => props.onLaserColorChange(lc.color)}
                className={`w-4 h-4 rounded-full border-2 transition-transform ${props.laserColor === lc.color ? 'border-indigo scale-110' : 'border-gray-300'}`}
                style={{
                  backgroundColor: lc.color,
                  boxShadow: props.laserColor === lc.color ? `0 0 6px ${lc.color}` : 'none',
                }}
                title={lc.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Text options (shown when text tool is active or text shape is selected) */}
      {(isTextTool || props.hasTextSelection) && (
        <div className="bg-white rounded-lg shadow-lg flex items-center gap-2 px-3 py-1.5">
          {/* Text color */}
          <ColorPicker
            label="Color"
            colors={paletteColors}
            value={props.textColor}
            onChange={props.onTextColorChange}
          />

          <Divider />

          {/* Font family */}
          <span className="text-[10px] text-french-gray">Font</span>
          <select
            value={props.fontFamily}
            onChange={(e) => props.onFontFamilyChange(e.target.value as FontFamily)}
            className="text-xs border border-gray-200 rounded px-1 py-1"
            style={{ fontFamily: FONT_FAMILY_CSS[props.fontFamily] }}
            title="Font family"
          >
            {fontFamilyOptions.map((f) => (
              <option key={f} value={f} style={{ fontFamily: FONT_FAMILY_CSS[f] }}>
                {FONT_FAMILY_LABELS[f]}
              </option>
            ))}
          </select>

          <Divider />

          {/* Font size */}
          <span className="text-[10px] text-french-gray">Size</span>
          <select
            value={props.fontSize}
            onChange={(e) => props.onFontSizeChange(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded px-1 py-1 w-14"
            title="Font size"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <Divider />

          {/* Text align */}
          <div className="flex items-center gap-0.5">
            {textAligns.map((a) => (
              <ToggleButton
                key={a.value}
                active={props.textAlign === a.value}
                onClick={() => props.onTextAlignChange(a.value)}
                title={a.label}
              >
                {a.icon}
              </ToggleButton>
            ))}
          </div>
        </div>
      )}

      {/* Frame label (shown when a frame is selected) */}
      {props.selectedFrameLabel !== undefined && (
        <div className="bg-white rounded-lg shadow-lg flex items-center gap-2 px-3 py-1.5">
          <span className="text-[10px] text-french-gray">Label</span>
          <input
            type="text"
            value={props.selectedFrameLabel}
            onChange={(e) => props.onFrameLabelChange(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 w-32"
            placeholder="Frame name"
          />
        </div>
      )}

      {/* Layer controls (shown when shapes are selected) */}
      {props.hasSelection && (
        <div className="bg-white rounded-lg shadow-lg flex items-center gap-1 px-2 py-1">
          <span className="text-[10px] text-french-gray mr-1">Layers</span>
          <button
            onClick={() => props.onReorder('back')}
            className="w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-100"
            title="Send to back"
          >
            ⇊
          </button>
          <button
            onClick={() => props.onReorder('backward')}
            className="w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-100"
            title="Send backward"
          >
            ↓
          </button>
          <button
            onClick={() => props.onReorder('forward')}
            className="w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-100"
            title="Bring forward"
          >
            ↑
          </button>
          <button
            onClick={() => props.onReorder('front')}
            className="w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-100"
            title="Bring to front"
          >
            ⇈
          </button>
        </div>
      )}
    </div>
  )
}
