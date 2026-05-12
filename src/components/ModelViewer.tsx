import { Float } from '@react-three/drei'

export function ModelViewer() {
  return (
    <Float speed={1.3} rotationIntensity={0.25} floatIntensity={0.3}>
      <group rotation={[0.18, -0.55, 0]}>
        <mesh castShadow receiveShadow>
          <torusKnotGeometry args={[1.25, 0.38, 128, 24]} />
          <meshStandardMaterial color="#12372b" roughness={0.34} metalness={0.18} />
        </mesh>
        <mesh position={[0.18, 0.45, 0.82]} rotation={[0.08, -0.42, 0.18]}>
          <planeGeometry args={[0.82, 0.42]} />
          <meshStandardMaterial
            color="#b7ff4a"
            emissive="#00d084"
            emissiveIntensity={0.28}
            roughness={0.22}
            transparent
            opacity={0.92}
          />
        </mesh>
      </group>
    </Float>
  )
}
