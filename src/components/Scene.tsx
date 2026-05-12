import { Canvas } from '@react-three/fiber'
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, OrbitControls } from '@react-three/drei'
import { GLTFExporter } from 'three-stdlib'
import { ModelViewer, type SceneDecal } from './ModelViewer'
import type { DecalSettings, ModelFormat } from '../state/editorStore'

type SceneProps = {
  modelUrl: string | null
  modelFormat: ModelFormat | null
  decals: SceneDecal[]
  selectedAssetId: string | null
  selectedTextureUrl: string | null
  canApplyTexture: boolean
  previewSettings: DecalSettings
  onCreateDecal: (decal: SceneDecal) => void
  onModelLoadStatus: (message: string) => void
  exportRequestId: number
  onExportComplete: (message: string) => void
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
    exporter.parse(
      scene,
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
  onCreateDecal,
  onModelLoadStatus,
  exportRequestId,
  onExportComplete,
}: SceneProps) {
  return (
    <Canvas className="scene-canvas" camera={{ position: [4.2, 3.1, 5.8], fov: 38 }} shadows>
      <color attach="background" args={['#020303']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3.8, 6.2, 4.5]} intensity={2.4} castShadow />
      <directionalLight position={[-3, 2.4, -2.2]} color="#8ea0ba" intensity={0.55} />
      <ModelViewer
        modelUrl={modelUrl}
        modelFormat={modelFormat}
        decals={decals}
        selectedAssetId={selectedAssetId}
        selectedTextureUrl={selectedTextureUrl}
        canApplyTexture={canApplyTexture}
        previewSettings={previewSettings}
        onCreateDecal={onCreateDecal}
        onModelLoadStatus={onModelLoadStatus}
      />
      <Grid
        args={[7.5, 7.5]}
        cellColor="#565d64"
        cellSize={0.5}
        cellThickness={0.72}
        fadeDistance={12}
        fadeStrength={1}
        position={[0, -1.45, 0]}
        sectionColor="#7a828b"
        sectionThickness={1.35}
      />
      <ContactShadows position={[0, -1.42, 0]} opacity={0.42} scale={7} blur={2.8} />
      <Environment preset="studio" environmentIntensity={0.35} />
      <OrbitControls
        enablePan
        minDistance={1.8}
        maxDistance={26}
        target={[0, -0.35, 0]}
        zoomSpeed={0.85}
      />
      <SceneExporter exportRequestId={exportRequestId} onExportComplete={onExportComplete} />
    </Canvas>
  )
}
