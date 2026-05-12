import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, OrbitControls } from '@react-three/drei'
import { ModelViewer } from './ModelViewer'

export function Scene() {
  return (
    <Canvas className="scene-canvas" camera={{ position: [3.2, 2.4, 4.2], fov: 42 }} shadows>
      <color attach="background" args={['#050807']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={2.2} castShadow />
      <pointLight position={[-3, 2, -1]} color="#00d084" intensity={2.8} />
      <ModelViewer />
      <Grid
        args={[8, 8]}
        cellColor="#17362b"
        cellSize={0.5}
        fadeDistance={8}
        fadeStrength={1.1}
        position={[0, -1.7, 0]}
        sectionColor="#00d084"
      />
      <ContactShadows position={[0, -1.62, 0]} opacity={0.35} scale={8} blur={2.6} />
      <Environment preset="city" />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={7} />
    </Canvas>
  )
}
