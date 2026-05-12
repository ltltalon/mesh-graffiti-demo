import {
  Box,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileUp,
  ImagePlus,
  Layers,
  Move3D,
  Palette,
  RotateCw,
  Scale3D,
  Sparkles,
  Upload,
} from 'lucide-react'
import './App.css'
import { AssetPanel } from './components/AssetPanel'
import { Scene } from './components/Scene'
import { Toolbar } from './components/Toolbar'

const workflowSteps = [
  { label: 'Import Model', detail: 'Load GLB / GLTF geometry', icon: Box },
  { label: 'Upload Image', detail: 'Add local graphic assets', icon: ImagePlus },
  { label: 'Place on Surface', detail: 'Click the mesh to apply', icon: Move3D },
  { label: 'Adjust', detail: 'Tune offset, scale, rotation', icon: Scale3D },
  { label: 'Export GLB', detail: 'Save textured result', icon: Download },
]

const materials = ['Matte paint', 'Soft plastic', 'Brushed metal', 'Ceramic']
const textures = ['Carbon fiber', 'Fine fabric', 'Micro dots', 'Rough stone']
const palette = ['#00d084', '#b7ff4a', '#2cf3c6', '#ffffff', '#7f8c8d', '#111514']

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="eyebrow">React Three Fiber Demo</span>
            <h1>Mesh Graffiti Studio</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button">
            <Eye size={16} />
            Preview
          </button>
          <button className="primary-button" type="button">
            <Download size={16} />
            Export GLB
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside className="panel left-panel">
          <div className="panel-heading">
            <span>Workflow</span>
            <button className="icon-button" type="button" aria-label="Collapse workflow">
              <ChevronDown size={16} />
            </button>
          </div>

          <ol className="workflow-list">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <li className={index === 1 ? 'workflow-item active' : 'workflow-item'} key={step.label}>
                  <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="step-icon">
                    <Icon size={17} />
                  </span>
                  <span>
                    <strong>{step.label}</strong>
                    <small>{step.detail}</small>
                  </span>
                  {index === 0 && <CheckCircle2 className="step-done" size={16} />}
                </li>
              )
            })}
          </ol>

          <div className="import-card">
            <div>
              <span className="eyebrow">Model Source</span>
              <h2>Import your base mesh</h2>
            </div>
            <button className="secondary-button" type="button">
              <FileUp size={16} />
              Choose Model
            </button>
          </div>

          <AssetPanel />
        </aside>

        <section className="stage">
          <div className="viewport-status">
            <span className="live-dot" />
            Ready for texture placement
          </div>
          <Scene />
          <Toolbar />
        </section>

        <aside className="panel right-panel">
          <div className="panel-heading">
            <span>Surface Editor</span>
            <button className="icon-button" type="button" aria-label="Open material library">
              <Layers size={16} />
            </button>
          </div>

          <div className="tabs">
            <button className="tab active" type="button">Materials</button>
            <button className="tab" type="button">Textures</button>
            <button className="tab" type="button">Colors</button>
          </div>

          <section className="editor-section">
            <div className="section-title">
              <Palette size={16} />
              Material Library
            </div>
            <div className="library-grid">
              {materials.map((material, index) => (
                <button className="library-card" type="button" key={material}>
                  <span className={`material-preview material-${index + 1}`} />
                  <span>{material}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="editor-section">
            <div className="section-title">
              <Layers size={16} />
              Texture Library
            </div>
            <div className="texture-grid">
              {textures.map((texture, index) => (
                <button className={`texture-chip texture-${index + 1}`} type="button" key={texture}>
                  {texture}
                </button>
              ))}
            </div>
          </section>

          <section className="editor-section">
            <div className="section-title">
              <Palette size={16} />
              Popular Colors
            </div>
            <div className="swatch-row">
              {palette.map((color) => (
                <button
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  type="button"
                  aria-label={`Select color ${color}`}
                  key={color}
                />
              ))}
            </div>
            <div className="color-picker">
              <div className="wheel" />
              <div className="color-sliders">
                <label>
                  Offset X
                  <input type="range" min="-100" max="100" defaultValue="12" />
                </label>
                <label>
                  Offset Y
                  <input type="range" min="-100" max="100" defaultValue="-8" />
                </label>
                <label>
                  Rotate
                  <input type="range" min="0" max="360" defaultValue="24" />
                </label>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <footer className="statusbar">
        <span>
          <Upload size={14} />
          Local assets only
        </span>
        <span>
          <RotateCw size={14} />
          Transform mode: texture
        </span>
        <span>
          <CheckCircle2 size={14} />
          First scaffold ready
        </span>
      </footer>
    </main>
  )
}

export default App
