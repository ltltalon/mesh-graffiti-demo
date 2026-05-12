import { useEffect, useMemo, useState } from 'react'
import {
  ClampToEdgeWrapping,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three'
import { GLTFLoader, STLLoader } from 'three-stdlib'

type ModelViewerProps = {
  modelUrl: string | null
  modelFormat: 'gltf' | 'stl' | null
  textureUrl: string | null
  canApplyTexture: boolean
  onApplyTexture: () => void
  onModelLoadStatus: (message: string) => void
}

function useImageTexture(textureUrl: string | null) {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    if (!textureUrl) {
      setTexture(null)
      return undefined
    }

    let isMounted = true
    const loader = new TextureLoader()

    loader.load(
      textureUrl,
      (loadedTexture) => {
        if (!isMounted) {
          loadedTexture.dispose()
          return
        }

        loadedTexture.colorSpace = SRGBColorSpace
        loadedTexture.flipY = false
        loadedTexture.wrapS = ClampToEdgeWrapping
        loadedTexture.wrapT = ClampToEdgeWrapping
        loadedTexture.needsUpdate = true
        setTexture(loadedTexture)
      },
      undefined,
      () => {
        if (isMounted) {
          setTexture(null)
        }
      },
    )

    return () => {
      isMounted = false
      setTexture((currentTexture) => {
        currentTexture?.dispose()
        return null
      })
    }
  }, [textureUrl])

  return texture
}

function createModelMaterial(texture: Texture | null, color = '#92a0b6') {
  return new MeshStandardMaterial({
    color,
    map: texture,
    roughness: 0.72,
    metalness: 0.02,
  })
}

function LoadedModel({
  modelUrl,
  modelFormat,
  texture,
}: {
  modelUrl: string
  modelFormat: 'gltf' | 'stl'
  texture: Texture | null
}) {
  const [model, setModel] = useState<Group | null>(null)

  useEffect(() => {
    let isMounted = true

    if (modelFormat === 'stl') {
      const loader = new STLLoader()

      loader.load(
        modelUrl,
        (geometry) => {
          if (!isMounted) {
            return
          }

          geometry.center()
          geometry.computeVertexNormals()

          const loadedGroup = new Group()
          const mesh = new Mesh(geometry, createModelMaterial(texture))
          mesh.castShadow = true
          mesh.receiveShadow = true
          loadedGroup.add(mesh)
          setModel(loadedGroup)
        },
        undefined,
        () => {
          if (isMounted) {
            setModel(null)
          }
        },
      )
    } else {
      const loader = new GLTFLoader()

      loader.load(
        modelUrl,
        (gltf) => {
          if (!isMounted) {
            return
          }

          const loadedScene = gltf.scene.clone(true)
          loadedScene.traverse((child: Object3D) => {
            if (child instanceof Mesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })
          setModel(loadedScene)
        },
        undefined,
        () => {
          if (isMounted) {
            setModel(null)
          }
        },
      )
    }

    return () => {
      isMounted = false
      setModel(null)
    }
  }, [modelFormat, modelUrl, texture])

  useEffect(() => {
    model?.traverse((child: Object3D) => {
      if (child instanceof Mesh) {
        child.material = createModelMaterial(texture)
      }
    })
  }, [model, texture])

  if (!model) {
    return null
  }

  return <primitive object={model} position={[0, -1.15, 0]} scale={1.5} />
}

function ProceduralPreviewModel({ texture }: { texture: Texture | null }) {
  const baseMaterial = useMemo(() => createModelMaterial(texture), [texture])
  const darkerMaterial = useMemo(() => createModelMaterial(texture, '#8795aa'), [texture])

  return (
    <group position={[0, -0.48, 0]} rotation={[0.02, -0.32, 0]}>
      <mesh castShadow receiveShadow scale={[1.2, 0.95, 1.02]} material={baseMaterial}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, -0.26, 0.95]} scale={[0.52, 0.34, 0.78]} material={baseMaterial}>
        <sphereGeometry args={[1, 48, 32]} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, -0.48, 1.55]} scale={[0.34, 0.22, 0.2]} material={darkerMaterial}>
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.46, 0.08, 0.77]} rotation={[0.04, -0.16, 0.05]} scale={[0.2, 0.26, 0.1]} material={darkerMaterial}>
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.46, 0.08, 0.77]} rotation={[0.04, 0.16, -0.05]} scale={[0.2, 0.26, 0.1]} material={darkerMaterial}>
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.94, -0.08, 0.16]} rotation={[0.1, 0.18, -0.48]} scale={[0.2, 0.62, 0.28]} material={baseMaterial}>
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.94, -0.08, 0.16]} rotation={[0.1, -0.18, 0.48]} scale={[0.2, 0.62, 0.28]} material={baseMaterial}>
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.56, 0.72, 0.1]} rotation={[0.2, 0.25, 0.58]} scale={[0.16, 0.36, 0.22]} material={baseMaterial}>
        <coneGeometry args={[1, 1, 32]} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.56, 0.72, 0.1]} rotation={[0.2, -0.25, -0.58]} scale={[0.16, 0.36, 0.22]} material={baseMaterial}>
        <coneGeometry args={[1, 1, 32]} />
      </mesh>
    </group>
  )
}

export function ModelViewer({
  modelUrl,
  modelFormat,
  textureUrl,
  canApplyTexture,
  onApplyTexture,
  onModelLoadStatus,
}: ModelViewerProps) {
  const texture = useImageTexture(textureUrl)

  useEffect(() => {
    onModelLoadStatus(modelUrl ? 'Custom model loaded. Click the model to apply selected texture.' : 'Using preview model. Import GLB, GLTF or STL anytime.')
  }, [modelUrl, onModelLoadStatus])

  return (
    <group
      onPointerDown={(event) => {
        event.stopPropagation()
        if (canApplyTexture) {
          onApplyTexture()
        }
      }}
    >
      {modelUrl && modelFormat ? (
        <LoadedModel modelUrl={modelUrl} modelFormat={modelFormat} texture={texture} />
      ) : (
        <ProceduralPreviewModel texture={texture} />
      )}
    </group>
  )
}
