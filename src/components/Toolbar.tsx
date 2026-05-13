import { Box, RotateCw, Undo2, View } from 'lucide-react'

const viewTools = [
  { label: 'perspective', icon: View },
  { label: 'two-point perspective', icon: RotateCw },
  { label: 'orthogonal', icon: Box },
]

type ToolbarProps = {
  activeCommand: string
  onCommand: (command: string) => void
}

export function Toolbar({ activeCommand, onCommand }: ToolbarProps) {
  return (
    <div className="toolbar" aria-label="Camera and undo toolbar">
      <div className="toolbar-group">
        {viewTools.map((tool) => {
          const Icon = tool.icon
          const isActive = tool.label === activeCommand

          return (
            <button
              className={isActive ? 'tool-button active' : 'tool-button'}
              type="button"
              key={tool.label}
              title={tool.label}
              onClick={() => onCommand(tool.label)}
            >
              <Icon size={16} />
              {tool.label}
            </button>
          )
        })}
      </div>
      <button
        className="tool-button reset-command"
        type="button"
        title="reset"
        onClick={() => onCommand('reset')}
      >
        <Undo2 size={16} />
        reset
      </button>
    </div>
  )
}
