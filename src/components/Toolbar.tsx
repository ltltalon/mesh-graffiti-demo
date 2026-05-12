import { Move3D, RotateCw, Scale3D, Undo2 } from 'lucide-react'

const tools = [
  { label: 'Move', icon: Move3D, active: true },
  { label: 'Scale', icon: Scale3D },
  { label: 'Rotate', icon: RotateCw },
  { label: 'Reset', icon: Undo2 },
]

export function Toolbar() {
  return (
    <div className="toolbar" aria-label="Texture transform toolbar">
      <div className="toolbar-group">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <button className={tool.active ? 'tool-button active' : 'tool-button'} type="button" key={tool.label}>
              <Icon size={16} />
              {tool.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
