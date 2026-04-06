'use client'

import type {
  ToolType,
  StrokeStyle,
  FontFamily,
  FontSize,
  TextAlign,
  ReorderDirection,
} from '@/lib/whiteboard/engine'

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
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  zoom: number
  onZoomChange: (zoom: number) => void
  onPanReset: () => void
  hasSelection: boolean
  onReorder: (direction: ReorderDirection) => void
  selectedFrameLabel?: string
  onFrameLabelChange: (label: string) => void
}

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

const tools: { type: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { type: 'select', label: 'Select (Alt+drag: lasso)', icon: '↖', shortcut: 'V' },
  { type: 'hand', label: 'Hand (Pan)', icon: '✋', shortcut: 'H' },
  { type: 'rectangle', label: 'Rectangle', icon: '▭', shortcut: 'R' },
  { type: 'diamond', label: 'Diamond', icon: '◇', shortcut: 'D' },
  { type: 'ellipse', label: 'Ellipse', icon: '◯', shortcut: 'O' },
  { type: 'line', label: 'Line', icon: '╱', shortcut: 'L' },
  { type: 'arrow', label: 'Arrow', icon: '→', shortcut: 'A' },
  { type: 'freehand', label: 'Draw', icon: '✎', shortcut: 'P' },
  { type: 'text', label: 'Text', icon: 'T', shortcut: 'T' },
  { type: 'image', label: 'Image', icon: <ImageIcon />, shortcut: 'I' },
  { type: 'frame', label: 'Frame', icon: '⬚', shortcut: 'F' },
  { type: 'embed', label: 'Embed', icon: '🔗', shortcut: 'W' },
  { type: 'laser', label: 'Laser', icon: '🔴', shortcut: 'K' },
  { type: 'eraser', label: 'Eraser', icon: '⌫', shortcut: 'E' },
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

const strokeStyles: { value: StrokeStyle; label: string; preview: string }[] = [
  { value: 'solid', label: 'Solid', preview: '—' },
  { value: 'dashed', label: 'Dashed', preview: '- -' },
  { value: 'dotted', label: 'Dotted', preview: '···' },
]

const fontFamilies: { value: FontFamily; label: string; icon: string }[] = [
  { value: 'hand', label: 'Handwritten', icon: '✏' },
  { value: 'serif', label: 'Serif', icon: 'A' },
  { value: 'mono', label: 'Code', icon: '</>' },
  { value: 'sans', label: 'Sans-serif', icon: 'A' },
]

const fontSizes: FontSize[] = ['S', 'M', 'L', 'XL']

const textAligns: { value: TextAlign; icon: string; label: string }[] = [
  { value: 'left', icon: '≡', label: 'Align left' },
  { value: 'center', icon: '≡', label: 'Align center' },
  { value: 'right', icon: '≡', label: 'Align right' },
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

export function Toolbar(props: ToolbarProps) {
  const isTextTool = props.activeTool === 'text'

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
      {/* Main toolbar row */}
      <div className="bg-white rounded-[12px] shadow-lg flex items-center gap-1 p-2">
        {/* Tools */}
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => props.onToolChange(tool.type)}
            title={`${tool.label} (${tool.shortcut})`}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors
              ${props.activeTool === tool.type ? 'bg-indigo text-white' : 'hover:bg-gray-100 text-jet'}`}
          >
            {tool.icon}
          </button>
        ))}

        <Divider />

        {/* Stroke color */}
        <ColorPicker
          label="Stroke"
          colors={paletteColors}
          value={props.color}
          onChange={props.onColorChange}
        />

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

        {/* Stroke width */}
        <select
          value={props.strokeWidth}
          onChange={(e) => props.onStrokeWidthChange(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded px-1 py-1"
          title="Stroke width"
        >
          <option value={1}>1px</option>
          <option value={2}>2px</option>
          <option value={4}>4px</option>
          <option value={8}>8px</option>
        </select>

        {/* Stroke style */}
        <div className="flex items-center gap-0.5">
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

      {/* Text options (shown when text tool is active) */}
      {isTextTool && (
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
          <div className="flex items-center gap-0.5">
            {fontFamilies.map((f) => (
              <ToggleButton
                key={f.value}
                active={props.fontFamily === f.value}
                onClick={() => props.onFontFamilyChange(f.value)}
                title={f.label}
                className={
                  f.value === 'hand' ? 'italic' : f.value === 'mono' ? 'font-mono text-[10px]' : ''
                }
              >
                {f.icon}
              </ToggleButton>
            ))}
          </div>

          <Divider />

          {/* Font size */}
          <span className="text-[10px] text-french-gray">Size</span>
          <div className="flex items-center gap-0.5">
            {fontSizes.map((s) => (
              <ToggleButton
                key={s}
                active={props.fontSize === s}
                onClick={() => props.onFontSizeChange(s)}
                title={`Font size: ${s}`}
              >
                {s}
              </ToggleButton>
            ))}
          </div>

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
                <span className="block w-4 leading-[3px] text-[6px]" style={{ textAlign: a.value }}>
                  {'——\n'}
                  {a.value === 'left' ? '—' : a.value === 'center' ? ' —' : '  ——'}
                </span>
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
