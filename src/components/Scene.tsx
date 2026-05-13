import { Canvas } from '@react-three/fiber'
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, OrbitControls } from '@react-three/drei'
import { GLTFExporter } from 'three-stdlib'
import { ModelViewer, type SceneDecal } from './ModelViewer'
import type { DecalSettings, MaterialRegion, MaterialSettings, ModelFormat } from '../state/editorStore'

type SceneProps = {
  modelUrl: string | null
  modelFormat: ModelFormat | null
  decals: SceneDecal[]
  selectedAssetId: string | null
  selectedTextureUrl: string | null
  canApplyTexture: boolean
  previewSettings: DecalSettings
  materialSettingsByRegion: Record<string, MaterialSettings>
  hoveredMaterialRegionId: string | null
  onCreateDecal: (decal: SceneDecal) => void
  onModelStructure: (regions: MaterialRegion[]) => void
  onMaterialRegionHover: (regionId: string | null) => void
  onMaterialRegionSelect: (regionId: string) => void
  onModelLoadStatus: (message: string) => void
  exportRequestId: number
  onExportComplete: (message: string) => void
  sceneMode: string
  lightingPreset: string
  cameraView: string
}

function SceneExporter({
  exportRequestId,
  onExportComplete,
}: {
  exportRequestId: number
  onExportComplete: (message: string) => void
}) {
  const { scene } = useThree()

  useEffect(() => {
    if (exportRequestId === 0) {
      return
    }

    const exporter = new GLTFExporter()
    const exportRoot = scene.getObjectByName('mesh-graffiti-export-root')

    if (!exportRoot) {
      onExportComplete('Export failed: no model or decals found.')
      return
    }

    exporter.parse(
      exportRoot,
      (result) => {
        const blob = result instanceof ArrayBuffer
          ? new Blob([result], { type: 'model/gltf-binary' })
          : new Blob([JSON.stringify(result)], { type: 'model/gltf+json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = 'mesh-graffiti-decal-scene.glb'
        link.click()
        URL.revokeObjectURL(url)
        onExportComplete('GLB exported with model and decal meshes.')
      },
      (error) => {
        onExportComplete(`Export failed: ${error instanceof Error ? error.message : 'unknown error'}`)
      },
      { binary: true },
    )
  }, [exportRequestId, onExportComplete, scene])

  return null
}

export function Scene({
  modelUrl,
  modelFormat,
  decals,
  selectedAssetId,
  selectedTextureUrl,
  canApplyTexture,
  previewSettings,
  materialSettingsByRegion,
  hoveredMaterialRegionId,
  onCreateDecal,
  onModelStructure,
  onMaterialRegionHover,
  onMaterialRegionSelect,
  onModelLoadStatus,
  exportRequestId,
  onExportComplete,
  sceneMode,
  lightingPreset,
  cameraView,
}: SceneProps) {
  const lightingIntensity = lightingPreset === 'Cool Rim' ? 0.38 : lightingPreset === 'Soft Night' ? 0.24 : 0.55
  const keyLightIntensity = lightingPreset === 'Cool Rim' ? 1.55 : lightingPreset === 'Soft Night' ? 0.85 : 2.4
  const rimLightIntensity = lightingPreset === 'Cool Rim' ? 1.25 : lightingPreset === 'Soft Night' ? 0.42 : 0.55
  const cameraTarget: [number, number, number] = cameraView === 'two-point perspective' ? [0, -0.1, 0] : [0, -0.35, 0]
  const cameraPosition: [number, number, number] = cameraView === 'two-point perspective'
    ? [5.8, 0.25, 5.8]
    : cameraView === 'orthogonal'
      ? [4.6, 3.2, 5.4]
      : [4.2, 3.1, 5.8]
  const cameraConfig = cameraView === 'orthogonal'
    ? { position: cameraPosition, zoom: 86, near: 0.1, far: 100 }
    : { position: cameraPosition, fov: cameraView === 'two-point perspective' ? 30 : 38, near: 0.1, far: 100 }

  return (
    <Canvas
      className="scene-canvas"
      camera={cameraConfig}
      key={cameraView}
      orthographic={cameraView === 'orthogonal'}
      shadows
    >
      <color attach="background" args={[sceneMode === 'Preview' ? '#07100c' : '#020303']} />
      <ambientLight intensity={lightingIntensity} />
      <directionalLight position={[3.8, 6.2, 4.5]} intensity={keyLightIntensity} castShadow />
      <directionalLight position={[-3, 2.4, -2.2]} color={lightingPreset === 'Cool Rim' ? '#72b6ff' : '#8ea0ba'} intensity={rimLightIntensity} />
      <ModelViewer
        modelUrl={modelUrl}
        modelFormat={modelFormat}
        decals={decals}
        selectedAssetId={selectedAssetId}
        selectedTextureUrl={selectedTextureUrl}
        canApplyTexture={canApplyTexture}
        previewSettings={previewSettings}
        materialSettingsByRegion={materialSettingsByRegion}
        hoveredMaterialRegionId={hoveredMaterialRegionId}
        onCreateDecal={onCreateDecal}
        onModelStructure={onModelStructure}
        onMaterialRegionHover={onMaterialRegionHover}
        onMaterialRegionSelect={onMaterialRegionSelect}
        onModelLoadStatus={onModelLoadStatus}
      />
      {sceneMode !== 'Solid' && (
        <Grid
          args={[7.5, 7.5]}
          cellColor="#565d64"
          cellSize={0.5}
          cellThickness={sceneMode === 'Preview' ? 0.36 : 0.72}
          fadeDistance={12}
          fadeStrength={1}
          position={[0, -1.45, 0]}
          sectionColor="#7a828b"
          sectionThickness={sceneMode === 'Preview' ? 0.85 : 1.35}
        />
      )}
      <ContactShadows position={[0, -1.42, 0]} opacity={sceneMode === 'Solid' ? 0.22 : 0.42} scale={7} blur={2.8} />
      <Environment preset={lightingPreset === 'Soft Night' ? 'night' : 'studio'} environmentIntensity={lightingPreset === 'Soft Night' ? 0.18 : 0.35} />
      <OrbitControls
        enablePan
        minDistance={0.45}
        maxDistance={26}
        target={cameraTarget}
        zoomSpeed={0.85}
      />
      <SceneExporter exportRequestId={exportRequestId} onExportComplete={onExportComplete} />
    </Canvas>
  )
}
