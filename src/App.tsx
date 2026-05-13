import {
  Box,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileUp,
  FileJson,
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
import type { SceneDecal } from './components/ModelViewer'
import { Scene } from './components/Scene'
import { Toolbar } from './components/Toolbar'
import {
  createTextureAsset,
  presetTextureAssets,
  readImageAspectRatio,
  type UploadedTextureAsset,
} from './lib/textureUtils'
import type { DecalSettings, MaterialRegion, MaterialSettings, ModelFormat } from './state/editorStore'

const workflowSteps = [
  { label: 'Import Model', detail: 'Load GLB / OBJ / STL geometry', icon: Box },
  { label: 'Upload Image', detail: 'Add local graphic assets', icon: ImagePlus },
  { label: 'Place on Surface', detail: 'Click the mesh to apply', icon: Move3D },
  { label: 'Adjust', detail: 'Tune offset, scale, rotation', icon: Scale3D },
  { label: 'Export GLB', detail: 'Save textured result', icon: Download },
]

const modelPresets: Array<{ name: string; url: string; format: ModelFormat }> = [
  { name: 'Suitcase', url: '/models/Suitcase.glb', format: 'gltf' },
  { name: 'Mug', url: '/models/Mug.glb', format: 'gltf' },
  { name: 'Refrigirator', url: '/models/Refrigirator.glb', format: 'gltf' },
]

const materialPresets: Array<{ name: string; className: string; settings: MaterialSettings }> = [
  { name: 'Matte paint', className: 'material-1', settings: { color: '#2a3a33', roughness: 0.86, metalness: 0.02, opacity: 1, transparent: false } },
  { name: 'Soft plastic', className: 'material-2', settings: { color: '#38d7b2', roughness: 0.42, metalness: 0.04, opacity: 1, transparent: false } },
  { name: 'Brushed metal', className: 'material-3', settings: { color: '#88958f', roughness: 0.28, metalness: 0.78, opacity: 1, transparent: false } },
  { name: 'Ceramic', className: 'material-4', settings: { color: '#edf8f1', roughness: 0.18, metalness: 0.01, opacity: 1, transparent: false } },
]
const textureSlots = [
  { name: 'Base color map', status: 'Ready for image upload' },
  { name: 'Normal map', status: 'Reserved' },
  { name: 'Roughness map', status: 'Reserved' },
  { name: 'Metalness map', status: 'Reserved' },
]
const palette = ['#00d084', '#b7ff4a', '#2cf3c6', '#ffffff', '#7f8c8d', '#111514']
const lightingPresets = [
  { name: 'Studio', detail: 'Clean top key', icon: Sun },
  { name: 'Cool Rim', detail: 'Blue edge light', icon: Lightbulb },
  { name: 'Soft Night', detail: 'Low contrast', icon: Moon },
]
const sceneModes = ['Solid', 'Grid', 'Preview']
const editorTabs = ['Materials', 'Textures', 'Colors']
const DECAL_SIZE_MIN = 0.08
const DECAL_SIZE_MAX = 0.8
const DECAL_SIZE_DEFAULT = DECAL_SIZE_MIN + (DECAL_SIZE_MAX - DECAL_SIZE_MIN) / 3
const clampDecalSize = (size: number) => Math.min(DECAL_SIZE_MAX, Math.max(DECAL_SIZE_MIN, size))
type HistorySnapshot = {
  decals: SceneDecal[]
  materialSettingsByRegion: Record<string, MaterialSettings>
}

function App() {
  const [isLightingOpen, setIsLightingOpen] = useState(true)
  const [activeCommand, setActiveCommand] = useState('perspective')
  const [cameraView, setCameraView] = useState('perspective')
  const [activeSceneMode, setActiveSceneMode] = useState('Grid')
  const [activeLightingPreset, setActiveLightingPreset] = useState('Studio')
  const [activeEditorTab, setActiveEditorTab] = useState('Materials')
  const [activeTextureSlot, setActiveTextureSlot] = useState(textureSlots[0].name)
  const [assets, setAssets] = useState<UploadedTextureAsset[]>(presetTextureAssets)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>('/models/Suitcase.glb')
  const [modelFormat, setModelFormat] = useState<ModelFormat | null>('gltf')
  const [modelName, setModelName] = useState('Suitcase.glb')
  const [editorMessage, setEditorMessage] = useState('Select a sticker, then click the model to place a decal.')
  const [decals, setDecals] = useState<SceneDecal[]>([])
  const [exportRequestId, setExportRequestId] = useState(0)
  const [materialRegions, setMaterialRegions] = useState<MaterialRegion[]>([])
  const [selectedMaterialRegionId, setSelectedMaterialRegionId] = useState<string | null>(null)
  const [hoveredMaterialRegionId, setHoveredMaterialRegionId] = useState<string | null>(null)
  const [materialSettingsByRegion, setMaterialSettingsByRegion] = useState<Record<string, MaterialSettings>>({})
  const [previewSettings, setPreviewSettings] = useState<DecalSettings>({
    size: DECAL_SIZE_DEFAULT,
    aspectRatio: 1,
    rotation: 0,
    opacity: 1,
  })
  const assetsRef = useRef<UploadedTextureAsset[]>([])
  const modelUrlRef = useRef<string | null>(null)
  const historyRef = useRef<HistorySnapshot[]>([])

  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? null
  const selectedMaterialRegion = materialRegions.find((region) => region.id === selectedMaterialRegionId) ?? null
  const selectedMaterialSettings = selectedMaterialRegion
    ? materialSettingsByRegion[selectedMaterialRegion.id] ?? selectedMaterialRegion.settings
    : null

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
      if (currentUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl)
      }

      return URL.createObjectURL(file)
    })
    const modelExtension = file.name.split('.').pop()?.toLowerCase()
    setModelFormat(modelExtension === 'stl' ? 'stl' : modelExtension === 'obj' ? 'obj' : 'gltf')
    setModelName(file.name)
    setDecals([])
    historyRef.current = []
    setMaterialRegions([])
    setSelectedMaterialRegionId(null)
    setHoveredMaterialRegionId(null)
    setMaterialSettingsByRegion({})
    setEditorMessage(`${file.name} loaded. Select a sticker and click the model surface.`)
  }, [])

  const handlePresetModelSelect = useCallback((preset: { name: string; url: string; format: ModelFormat }) => {
    setModelUrl((currentUrl) => {
      if (currentUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl)
      }

      return preset.url
    })
    setModelFormat(preset.format)
    setModelName(`${preset.name}.glb`)
    setDecals([])
    historyRef.current = []
    setMaterialRegions([])
    setSelectedMaterialRegionId(null)
    setHoveredMaterialRegionId(null)
    setMaterialSettingsByRegion({})
    setEditorMessage(`${preset.name} preset loaded. Select a sticker and click the model surface.`)
  }, [])

  const handleAssetUpload = useCallback(async (files: FileList | null) => {
    const nextAssets = await Promise.all(Array.from(files ?? [])
      .filter((file) => file.type.startsWith('image/'))
      .map(async (file) => {
        const asset = createTextureAsset(file)
        return {
          ...asset,
          aspectRatio: await readImageAspectRatio(asset.url),
        }
      }))

    if (nextAssets.length === 0) {
      setEditorMessage('Please upload PNG, JPG or WebP image assets.')
      return
    }

    setAssets((currentAssets) => [...nextAssets, ...currentAssets])
    setSelectedAssetId(nextAssets[0].id)
    setPreviewSettings((currentSettings) => ({
      ...currentSettings,
      aspectRatio: nextAssets[0].aspectRatio,
    }))
    setEditorMessage(`${nextAssets[0].name} selected. Click the model to place it.`)
  }, [])

  const handleModelLoadStatus = useCallback((message: string) => {
    setEditorMessage(message)
  }, [])

  const handleCreateDecal = useCallback((decal: SceneDecal) => {
    historyRef.current.push({ decals, materialSettingsByRegion })
    setDecals((currentDecals) => [...currentDecals, decal])
    setEditorMessage(`Decal placed on ${decal.targetName}. The controls now affect the next decal preview.`)
  }, [decals, materialSettingsByRegion])

  const updateDecalScale = useCallback((nextSize: number) => {
    setPreviewSettings((currentSettings) => ({ ...currentSettings, size: nextSize }))
  }, [])

  const updateDecalRotation = useCallback((nextRotation: number) => {
    setPreviewSettings((currentSettings) => ({ ...currentSettings, rotation: nextRotation }))
  }, [])

  const updateDecalOpacity = useCallback((nextOpacity: number) => {
    setPreviewSettings((currentSettings) => ({ ...currentSettings, opacity: nextOpacity }))
  }, [])

  const handleModelStructure = useCallback((regions: MaterialRegion[]) => {
    setMaterialRegions(regions)
    setSelectedMaterialRegionId((currentRegionId) => {
      if (currentRegionId && regions.some((region) => region.id === currentRegionId)) {
        return currentRegionId
      }

      return regions[0]?.id ?? null
    })
  }, [])

  const handleMaterialRegionSelect = useCallback((regionId: string) => {
    const region = materialRegions.find((item) => item.id === regionId)

    setSelectedMaterialRegionId(regionId)
    setEditorMessage(region
      ? `${region.meshName} selected for material editing.`
      : 'Material region selected.')
  }, [materialRegions])

  const updateSelectedMaterial = useCallback((partialSettings: Partial<MaterialSettings>) => {
    const region = materialRegions.find((item) => item.id === selectedMaterialRegionId)

    if (!region) {
      return
    }

    historyRef.current.push({ decals, materialSettingsByRegion })
    setMaterialSettingsByRegion((currentSettingsByRegion) => {
      return {
        ...currentSettingsByRegion,
        [region.id]: {
          ...(currentSettingsByRegion[region.id] ?? region.settings),
          ...partialSettings,
        },
      }
    })
  }, [decals, materialRegions, materialSettingsByRegion, selectedMaterialRegionId])

  const applyMaterialPreset = useCallback((settings: MaterialSettings, presetName: string) => {
    updateSelectedMaterial(settings)
    setEditorMessage(selectedMaterialRegion
      ? `${presetName} applied to ${selectedMaterialRegion.meshName}.`
      : 'Select a model region before applying a material.')
  }, [selectedMaterialRegion, updateSelectedMaterial])

  const exportMaterialConfig = useCallback(() => {
    const config = {
      model: modelName,
      generatedAt: new Date().toISOString(),
      regions: materialRegions.map((region) => ({
        id: region.id,
        meshName: region.meshName,
        materialName: region.materialName,
        materialIndex: region.materialIndex,
        editableLevel: region.editableLevel,
        hasGroups: region.hasGroups,
        settings: materialSettingsByRegion[region.id] ?? region.settings,
      })),
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'mesh-graffiti-material-config.json'
    link.click()
    URL.revokeObjectURL(url)
    setEditorMessage('Material configuration JSON exported.')
  }, [materialRegions, materialSettingsByRegion, modelName])

  const handleToolbarCommand = useCallback((command: string) => {
    if (command === 'reset') {
      const previousSnapshot = historyRef.current.pop()

      if (!previousSnapshot) {
        setEditorMessage('Nothing to undo yet.')
        return
      }

      setDecals(previousSnapshot.decals)
      setMaterialSettingsByRegion(previousSnapshot.materialSettingsByRegion)
      setEditorMessage('Previous edit undone.')
      return
    }

    setActiveCommand(command)
    setCameraView(command)
    setEditorMessage(`${command} camera view applied.`)
  }, [])

  useEffect(() => {
    return () => {
      assetsRef.current.forEach((asset) => {
        if (!asset.preset) {
          URL.revokeObjectURL(asset.url)
        }
      })
      if (modelUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(modelUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !selectedAssetId) {
        return
      }

      setSelectedAssetId(null)
      setEditorMessage('Sticker selection cleared. Hover the model to choose a material region.')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAssetId])

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!selectedAssetId || !event.altKey) {
        return
      }

      event.preventDefault()
      const direction = event.deltaY < 0 ? 1 : -1

      setPreviewSettings((currentSettings) => ({
        ...currentSettings,
        size: clampDecalSize(currentSettings.size + direction * 0.04),
      }))
      setEditorMessage('Alt + mouse wheel adjusted the next decal size.')
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [selectedAssetId])

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
            {activeSceneMode}
          </button>
          <button className="primary-button" type="button" onClick={() => setExportRequestId((current) => current + 1)}>
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
                accept=".glb,.gltf,.obj,.stl,model/gltf-binary,model/gltf+json,model/stl"
                onChange={(event) => handleModelUpload(event.target.files)}
              />
              <FileUp size={16} />
              Choose Model
            </label>
            <span className="supported-formats">Supports GLB, GLTF, OBJ, STL</span>
            <div className="preset-models" aria-label="Preset models">
              {modelPresets.map((preset) => (
                <button
                  className={modelUrl === preset.url ? 'preset-model active' : 'preset-model'}
                  type="button"
                  key={preset.name}
                  onClick={() => handlePresetModelSelect(preset)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <AssetPanel
            assets={assets}
            selectedAssetId={selectedAssetId}
            onAssetUpload={handleAssetUpload}
            onSelectAsset={(assetId) => {
              setSelectedAssetId(assetId)
              const asset = assets.find((item) => item.id === assetId)
              if (asset) {
                setPreviewSettings((currentSettings) => ({
                  ...currentSettings,
                  aspectRatio: asset.aspectRatio,
                }))
              }
              setEditorMessage(asset ? `${asset.name} selected. Click the model to place it.` : editorMessage)
            }}
          />
        </aside>

        <section
          className="stage"
          onWheelCapture={(event) => {
            if (!selectedAssetId || !event.altKey) {
              return
            }

            event.preventDefault()
            event.stopPropagation()
          }}
        >
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
              {sceneModes.map((mode) => (
                <button
                  className={mode === activeSceneMode ? 'scene-mode active' : 'scene-mode'}
                  type="button"
                  key={mode}
                  onClick={() => setActiveSceneMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="stage-export-panel" aria-label="Export model">
            <span>
              <Download size={15} />
              Export
            </span>
            <button className="primary-button compact-export" type="button" onClick={() => setExportRequestId((current) => current + 1)}>
              GLB
            </button>
          </div>
          <Scene
            modelUrl={modelUrl}
            modelFormat={modelFormat}
            decals={decals}
            selectedAssetId={selectedAssetId}
            selectedTextureUrl={selectedAsset?.url ?? null}
            canApplyTexture={Boolean(selectedAsset)}
            previewSettings={previewSettings}
            materialSettingsByRegion={materialSettingsByRegion}
            hoveredMaterialRegionId={hoveredMaterialRegionId}
            onCreateDecal={handleCreateDecal}
            onModelStructure={handleModelStructure}
            onMaterialRegionHover={setHoveredMaterialRegionId}
            onMaterialRegionSelect={handleMaterialRegionSelect}
            onModelLoadStatus={handleModelLoadStatus}
            exportRequestId={exportRequestId}
            onExportComplete={setEditorMessage}
            sceneMode={activeSceneMode}
            lightingPreset={activeLightingPreset}
            cameraView={cameraView}
          />
          <Toolbar activeCommand={activeCommand} onCommand={handleToolbarCommand} />
          {selectedAsset && (
            <div className="decal-popover" aria-label="Next decal controls">
              <div className="decal-popover-header">
                <span>
                  Next decal
                  <small>{selectedAsset.name}</small>
                </span>
              </div>
              <label>
                Size
                <input
                  type="range"
                  min={DECAL_SIZE_MIN}
                  max={DECAL_SIZE_MAX}
                  step="0.01"
                  value={previewSettings.size}
                  onChange={(event) => updateDecalScale(Number(event.target.value))}
                />
              </label>
              <label>
                Direction
                <input
                  type="range"
                  min="-3.14"
                  max="3.14"
                  step="0.01"
                  value={previewSettings.rotation}
                  onChange={(event) => updateDecalRotation(Number(event.target.value))}
                />
              </label>
              <label>
                Opacity
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={previewSettings.opacity}
                  onChange={(event) => updateDecalOpacity(Number(event.target.value))}
                />
              </label>
            </div>
          )}
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
                      className={preset.name === activeLightingPreset ? 'lighting-preset active' : 'lighting-preset'}
                      type="button"
                      key={preset.name}
                      onClick={() => setActiveLightingPreset(preset.name)}
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
            {editorTabs.map((tab) => (
              <button
                className={tab === activeEditorTab ? 'tab active' : 'tab'}
                type="button"
                key={tab}
                onClick={() => setActiveEditorTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeEditorTab === 'Materials' && <section className="editor-section">
            <div className="section-title">
              <Palette size={16} />
              Material Library
            </div>
            <div className="library-grid">
              {materialPresets.map((material) => (
                <button
                  className="library-card"
                  type="button"
                  key={material.name}
                  onClick={() => applyMaterialPreset(material.settings, material.name)}
                >
                  <span className={`material-preview ${material.className}`} />
                  <span>{material.name}</span>
                </button>
              ))}
            </div>
          </section>}

          {activeEditorTab === 'Materials' && <section className="editor-section">
            <div className="section-title">
              <Layers size={16} />
              Editable Regions
            </div>
            <div className="region-list">
              {materialRegions.length > 0 ? materialRegions.map((region) => (
                <button
                  className={[
                    'region-card',
                    region.id === selectedMaterialRegionId ? 'active' : '',
                    region.id === hoveredMaterialRegionId ? 'hovered' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  key={region.id}
                  onClick={() => setSelectedMaterialRegionId(region.id)}
                >
                  <span>
                    <strong>{region.meshName}</strong>
                    <small>{region.materialName}</small>
                  </span>
                  <em>{region.hasGroups ? `${region.groupCount} groups` : 'mesh'}</em>
                </button>
              )) : (
                <p className="empty-control-copy">Load a model to inspect editable mesh and material areas.</p>
              )}
            </div>
          </section>}

          {(activeEditorTab === 'Materials' || activeEditorTab === 'Colors') && <section className="editor-section">
            <div className="section-title">
              <Palette size={16} />
              Material Parameters
            </div>
            <div className="region-summary">
              {selectedMaterialRegion ? (
                <>
                  <strong>{selectedMaterialRegion.meshName}</strong>
                  <span>{selectedMaterialRegion.hasGroups ? 'Geometry groups detected. Editing the selected material slot.' : 'No geometry groups. Editing the whole mesh material.'}</span>
                  <small>{selectedMaterialRegion.triangleCount.toLocaleString()} triangles / {selectedMaterialRegion.isMultiMaterial ? 'multi material' : 'single material'}</small>
                </>
              ) : (
                <span>Select an editable region to tune material values.</span>
              )}
            </div>
            <div className="swatch-row">
              {palette.map((color) => (
                <button
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  type="button"
                  aria-label={`Select color ${color}`}
                  onClick={() => updateSelectedMaterial({ color })}
                  key={color}
                />
              ))}
            </div>
            <div className="color-picker">
              <label className="custom-color-control">
                <span>Color</span>
                <input
                  type="color"
                  value={selectedMaterialSettings?.color ?? '#92a0b6'}
                  disabled={!selectedMaterialSettings}
                  onChange={(event) => updateSelectedMaterial({ color: event.target.value })}
                />
              </label>
              <div className="color-sliders">
                <label>
                  Roughness
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedMaterialSettings?.roughness ?? 0.72}
                    disabled={!selectedMaterialSettings}
                    onChange={(event) => updateSelectedMaterial({ roughness: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Metalness
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedMaterialSettings?.metalness ?? 0.02}
                    disabled={!selectedMaterialSettings}
                    onChange={(event) => updateSelectedMaterial({ metalness: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Opacity
                  <input
                    type="range"
                    min="0.18"
                    max="1"
                    step="0.01"
                    value={selectedMaterialSettings?.opacity ?? 1}
                    disabled={!selectedMaterialSettings}
                    onChange={(event) => updateSelectedMaterial({
                      opacity: Number(event.target.value),
                      transparent: Number(event.target.value) < 1,
                    })}
                  />
                </label>
              </div>
            </div>
            <button className="secondary-button config-button" type="button" onClick={exportMaterialConfig}>
              <FileJson size={15} />
              Export Material JSON
            </button>
          </section>}

          {activeEditorTab === 'Textures' && <section className="editor-section">
            <div className="section-title">
              <Layers size={16} />
              Texture Slots
            </div>
            <div className="texture-grid">
              {textureSlots.map((slot, index) => (
                <button
                  className={[
                    'texture-chip',
                    `texture-${index + 1}`,
                    slot.name === activeTextureSlot ? 'active' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  key={slot.name}
                  onClick={() => {
                    setActiveTextureSlot(slot.name)
                    setEditorMessage(`${slot.name} selected. Texture upload is reserved for the next milestone.`)
                  }}
                >
                  <span>{slot.name}</span>
                  <small>{slot.status}</small>
                </button>
              ))}
            </div>
          </section>}

          <section className="editor-section decal-controls">
            <div className="section-title">
              <Move3D size={16} />
              Decal Controls
            </div>
            {selectedAsset ? (
              <>
                <label>
                  Next decal scale
                  <input
                    type="range"
                    min={DECAL_SIZE_MIN}
                    max={DECAL_SIZE_MAX}
                    step="0.01"
                    value={previewSettings.size}
                    onChange={(event) => updateDecalScale(Number(event.target.value))}
                  />
                </label>
                <label>
                  Next decal direction
                  <input
                    type="range"
                    min="-3.14"
                    max="3.14"
                    step="0.01"
                    value={previewSettings.rotation}
                    onChange={(event) => updateDecalRotation(Number(event.target.value))}
                  />
                </label>
                <label>
                  Opacity
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={previewSettings.opacity}
                    onChange={(event) => updateDecalOpacity(Number(event.target.value))}
                  />
                </label>
              </>
            ) : (
              <p className="empty-control-copy">Select a sticker to adjust the next decal size, direction and opacity.</p>
            )}
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
          Decals: {decals.length}
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
