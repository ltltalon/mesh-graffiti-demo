import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, OrbitControls } from '@react-three/drei'
import { ModelViewer } from './ModelViewer'

type SceneProps = {
  modelUrl: string | null
  modelFormat: 'gltf' | 'stl' | null
  appliedTextureUrl: string | null
  canApplyTexture: boolean
  onApplyTexture: () => void
  onModelLoadStatus: (message: string) => void
}

export function Scene({
  modelUrl,
  modelFormat,
  appliedTextureUrl,
  canApplyTexture,
  onApplyTexture,
  onModelLoadStatus,
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
        textureUrl={appliedTextureUrl}
        canApplyTexture={canApplyTexture}
        onApplyTexture={onApplyTexture}
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
    </Canvas>
  )
}
