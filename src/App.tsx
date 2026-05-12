import {
  Box,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileUp,
  ImagePlus,
  Layers,
  Lightbulb,
  Move3D,
  Moon,
  Palette,
  RotateCw,
  Scale3D,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  View,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { AssetPanel } from './components/AssetPanel'
import { Scene } from './components/Scene'
import { Toolbar } from './components/Toolbar'
import { createTextureAsset, type UploadedTextureAsset } from './lib/textureUtils'

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
const lightingPresets = [
  { name: 'Studio', detail: 'Clean top key', icon: Sun, active: true },
  { name: 'Cool Rim', detail: 'Blue edge light', icon: Lightbulb },
  { name: 'Soft Night', detail: 'Low contrast', icon: Moon },
]
const sceneModes = ['Solid', 'Grid', 'Preview']

function App() {
  const [isLightingOpen, setIsLightingOpen] = useState(true)
  const [assets, setAssets] = useState<UploadedTextureAsset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [appliedTextureUrl, setAppliedTextureUrl] = useState<string | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [modelFormat, setModelFormat] = useState<'gltf' | 'stl' | null>(null)
  const [modelName, setModelName] = useState('Procedural preview model')
  const [editorMessage, setEditorMessage] = useState('Upload an image, select it, then click the model to apply it.')
  const assetsRef = useRef<UploadedTextureAsset[]>([])
  const modelUrlRef = useRef<string | null>(null)

  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? null

  useEffect(() => {
    assetsRef.current = assets
  }, [assets])

  useEffect(() => {
    modelUrlRef.current = modelUrl
  }, [modelUrl])

  const handleModelUpload = useCallback((files: FileList | null) => {
    const file = files?.[0]

    if (!file) {
      return
    }

    setModelUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }

      return URL.createObjectURL(file)
    })
    setModelFormat(file.name.toLowerCase().endsWith('.stl') ? 'stl' : 'gltf')
    setModelName(file.name)
    setEditorMessage(`${file.name} loaded. Select an image and click the model surface.`)
  }, [])

  const handleAssetUpload = useCallback((files: FileList | null) => {
    const nextAssets = Array.from(files ?? [])
      .filter((file) => file.type.startsWith('image/'))
      .map(createTextureAsset)

    if (nextAssets.length === 0) {
      setEditorMessage('Please upload PNG, JPG or WebP image assets.')
      return
    }

    setAssets((currentAssets) => [...nextAssets, ...currentAssets])
    setSelectedAssetId(nextAssets[0].id)
    setEditorMessage(`${nextAssets[0].name} selected. Click the model to apply it.`)
  }, [])

  const handleApplyTexture = useCallback(() => {
    if (!selectedAsset) {
      setEditorMessage('Select an uploaded image before applying a texture.')
      return
    }

    setAppliedTextureUrl(selectedAsset.url)
    setEditorMessage(`${selectedAsset.name} applied to ${modelName}.`)
  }, [modelName, selectedAsset])

  const handleModelLoadStatus = useCallback((message: string) => {
    setEditorMessage(message)
  }, [])

  useEffect(() => {
    return () => {
      assetsRef.current.forEach((asset) => URL.revokeObjectURL(asset.url))
      if (modelUrlRef.current) {
        URL.revokeObjectURL(modelUrlRef.current)
      }
    }
  }, [])

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
              <h2>{modelName}</h2>
            </div>
            <label className="secondary-button file-button">
              <input
                type="file"
                accept=".glb,.gltf,.stl,model/gltf-binary,model/gltf+json,model/stl"
                onChange={(event) => handleModelUpload(event.target.files)}
              />
              <FileUp size={16} />
              Choose Model
            </label>
            <span className="supported-formats">Supports GLB, GLTF, STL</span>
          </div>

          <AssetPanel
            assets={assets}
            selectedAssetId={selectedAssetId}
            onAssetUpload={handleAssetUpload}
            onSelectAsset={(assetId) => {
              setSelectedAssetId(assetId)
              const asset = assets.find((item) => item.id === assetId)
              setEditorMessage(asset ? `${asset.name} selected. Click the model to apply it.` : editorMessage)
            }}
          />
        </aside>

        <section className="stage">
          <div className="viewport-status">
            <span className="live-dot" />
            {editorMessage}
          </div>
          <div className="scene-switcher" aria-label="Scene display mode">
            <span>
              <View size={15} />
              Scene
            </span>
            <div>
              {sceneModes.map((mode, index) => (
                <button className={index === 1 ? 'scene-mode active' : 'scene-mode'} type="button" key={mode}>
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <Scene
            modelUrl={modelUrl}
            modelFormat={modelFormat}
            appliedTextureUrl={appliedTextureUrl}
            canApplyTexture={Boolean(selectedAsset)}
            onApplyTexture={handleApplyTexture}
            onModelLoadStatus={handleModelLoadStatus}
          />
          <Toolbar />
          <aside
            className={isLightingOpen ? 'lighting-panel open' : 'lighting-panel collapsed'}
            aria-label="Environment lighting controls"
          >
            <button
              className="lighting-toggle"
              type="button"
              aria-label={isLightingOpen ? 'Collapse lighting controls' : 'Expand lighting controls'}
              onClick={() => setIsLightingOpen((current) => !current)}
            >
              <SlidersHorizontal size={17} />
              <span>Lighting</span>
            </button>
            <div className="lighting-content">
              <div className="lighting-header">
              <div>
                <span className="eyebrow">Environment</span>
                <strong>Lighting</strong>
              </div>
              <SlidersHorizontal size={17} />
              </div>
              <div className="lighting-presets">
                {lightingPresets.map((preset) => {
                  const Icon = preset.icon
                  return (
                    <button
                      className={preset.active ? 'lighting-preset active' : 'lighting-preset'}
                      type="button"
                      key={preset.name}
                    >
                      <Icon size={16} />
                      <span>
                        <strong>{preset.name}</strong>
                        <small>{preset.detail}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="custom-light-placeholder">
                <span>Custom lighting</span>
                <small>Controls reserved for intensity, color and direction.</small>
              </div>
            </div>
          </aside>
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
