import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ClampToEdgeWrapping,
  Euler,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from 'three'
import { DecalGeometry, GLTFLoader, OBJLoader, STLLoader } from 'three-stdlib'
import type { DecalLayer, DecalSettings, ModelFormat } from '../state/editorStore'

export type SceneDecal = DecalLayer & {
  targetMesh: Mesh
}

type ModelViewerProps = {
  modelUrl: string | null
  modelFormat: ModelFormat | null
  decals: SceneDecal[]
  selectedAssetId: string | null
  selectedTextureUrl: string | null
  canApplyTexture: boolean
  previewSettings: DecalSettings
  onCreateDecal: (decal: SceneDecal) => void
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
        loadedTexture.flipY = true
        loadedTexture.wrapS = ClampToEdgeWrapping
        loadedTexture.wrapT = ClampToEdgeWrapping
        loadedTexture.center.set(0.5, 0.5)
        loadedTexture.offset.set(0, 0)
        loadedTexture.repeat.set(1, 1)
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

function createModelMaterial(color = '#92a0b6') {
  return new MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.02,
  })
}

function applyBaseMeshSetup(object: Object3D) {
  object.traverse((child: Object3D) => {
    if (child instanceof Mesh) {
      child.castShadow = true
      child.receiveShadow = true
      child.material = createModelMaterial()
    }
  })
}

function LoadedModel({ modelUrl, modelFormat }: { modelUrl: string; modelFormat: ModelFormat }) {
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
          const mesh = new Mesh(geometry, createModelMaterial())
          mesh.name = 'Imported STL mesh'
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
    } else if (modelFormat === 'obj') {
      const loader = new OBJLoader()

      loader.load(
        modelUrl,
        (object) => {
          if (!isMounted) {
            return
          }

          applyBaseMeshSetup(object)
          setModel(object)
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
          applyBaseMeshSetup(loadedScene)
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
  }, [modelFormat, modelUrl])

  if (!model) {
    return null
  }

  return <primitive object={model} position={[0, -1.15, 0]} scale={1.5} />
}

function ProceduralPreviewModel() {
  const baseMaterial = useMemo(() => createModelMaterial(), [])
  const darkerMaterial = useMemo(() => createModelMaterial('#8795aa'), [])

  return (
    <group position={[0, -0.48, 0]} rotation={[0.02, -0.32, 0]}>
      <mesh castShadow receiveShadow scale={[1.2, 0.95, 1.02]} material={baseMaterial} name="Preview head">
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, -0.26, 0.95]} scale={[0.52, 0.34, 0.78]} material={baseMaterial} name="Preview snout">
        <sphereGeometry args={[1, 48, 32]} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, -0.48, 1.55]} scale={[0.34, 0.22, 0.2]} material={darkerMaterial} name="Preview nose">
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.46, 0.08, 0.77]} rotation={[0.04, -0.16, 0.05]} scale={[0.2, 0.26, 0.1]} material={darkerMaterial} name="Preview left eye">
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.46, 0.08, 0.77]} rotation={[0.04, 0.16, -0.05]} scale={[0.2, 0.26, 0.1]} material={darkerMaterial} name="Preview right eye">
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.94, -0.08, 0.16]} rotation={[0.1, 0.18, -0.48]} scale={[0.2, 0.62, 0.28]} material={baseMaterial} name="Preview left ear">
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.94, -0.08, 0.16]} rotation={[0.1, -0.18, 0.48]} scale={[0.2, 0.62, 0.28]} material={baseMaterial} name="Preview right ear">
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>
    </group>
  )
}

function DecalMesh({ decal, preview = false }: { decal: SceneDecal; preview?: boolean }) {
  const texture = useImageTexture(decal.textureUrl)
  const geometry = useMemo(() => {
    return new DecalGeometry(
      decal.targetMesh,
      new Vector3(...decal.position),
      new Euler(...decal.rotation),
      new Vector3(...decal.size),
    )
  }, [decal])

  const material = useMemo(() => {
    return new MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: preview ? Math.min(0.72, decal.opacity) : decal.opacity,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      side: FrontSide,
    })
  }, [decal.opacity, preview, texture])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  if (!texture) {
    return null
  }

  return <mesh geometry={geometry} material={material} renderOrder={preview ? 20 : 10} userData={{ isDecal: true }} />
}

function getDecalProjection(event: ThreeEvent<PointerEvent>, rotationOffset = 0) {
  const targetMesh = event.object as Mesh
  const point = event.point.clone()
  const localNormal = event.face?.normal.clone() ?? new Vector3(0, 0, 1)
  const normal = localNormal.transformDirection(targetMesh.matrixWorld).normalize()
  const projector = new Object3D()

  projector.position.copy(point)
  projector.lookAt(point.clone().add(normal))
  projector.rotateZ(rotationOffset)

  return {
    point,
    normal,
    rotation: projector.rotation.clone(),
    targetMesh,
  }
}

function getStableDecalSize(settings: DecalSettings): [number, number, number] {
  const height = settings.size
  const width = settings.size * settings.aspectRatio
  const depth = Math.max(width, height) * 0.42

  return [width, height, depth]
}

function DecalOrientationHelper({ decal }: { decal: SceneDecal }) {
  const rotation = useMemo(() => new Euler(...decal.rotation), [decal.rotation])
  const width = decal.size[0]
  const height = decal.size[1]
  const depth = Math.max(decal.size[2] * 0.1, 0.018)
  const borderThickness = Math.max(Math.min(width, height) * 0.035, 0.008)
  const stemWidth = Math.max(borderThickness * 1.35, 0.012)
  const arrowSize = Math.max(Math.min(width, height) * 0.16, 0.04)
  const zOffset = Math.max(decal.size[2] * 0.06, 0.018)

  return (
    <group position={decal.position} rotation={rotation} renderOrder={30}>
      <mesh position={[0, height / 2, zOffset]}>
        <boxGeometry args={[width, borderThickness, depth]} />
        <meshBasicMaterial color="#b7ff4a" transparent opacity={0.86} depthTest={false} />
      </mesh>
      <mesh position={[0, -height / 2, zOffset]}>
        <boxGeometry args={[width, borderThickness, depth]} />
        <meshBasicMaterial color="#b7ff4a" transparent opacity={0.62} depthTest={false} />
      </mesh>
      <mesh position={[-width / 2, 0, zOffset]}>
        <boxGeometry args={[borderThickness, height, depth]} />
        <meshBasicMaterial color="#b7ff4a" transparent opacity={0.62} depthTest={false} />
      </mesh>
      <mesh position={[width / 2, 0, zOffset]}>
        <boxGeometry args={[borderThickness, height, depth]} />
        <meshBasicMaterial color="#b7ff4a" transparent opacity={0.62} depthTest={false} />
      </mesh>
      <mesh position={[0, height * 0.1, zOffset * 1.4]}>
        <boxGeometry args={[stemWidth, height * 0.78, depth]} />
        <meshBasicMaterial color="#00d084" transparent opacity={0.92} depthTest={false} />
      </mesh>
      <mesh position={[0, height * 0.56, zOffset * 1.55]}>
        <coneGeometry args={[arrowSize, arrowSize * 1.35, 3]} />
        <meshBasicMaterial color="#00f0a8" transparent opacity={0.96} depthTest={false} />
      </mesh>
      <mesh position={[0, 0, zOffset * 1.5]}>
        <circleGeometry args={[Math.max(arrowSize * 0.42, 0.016), 24]} />
        <meshBasicMaterial color="#d9ff72" transparent opacity={0.96} depthTest={false} />
      </mesh>
    </group>
  )
}

export function ModelViewer({
  modelUrl,
  modelFormat,
  decals,
  selectedAssetId,
  selectedTextureUrl,
  canApplyTexture,
  previewSettings,
  onCreateDecal,
  onModelLoadStatus,
}: ModelViewerProps) {
  const [previewDecal, setPreviewDecal] = useState<SceneDecal | null>(null)
  const pointerStartRef = useRef<{ button: number; time: number; x: number; y: number } | null>(null)

  useEffect(() => {
    onModelLoadStatus(modelUrl ? 'Custom model loaded. Select a sticker, then click the model to place a decal.' : 'Using preview model. Import GLB, GLTF, OBJ or STL anytime.')
  }, [modelUrl, onModelLoadStatus])

  useEffect(() => {
    setPreviewDecal(null)
  }, [selectedAssetId, selectedTextureUrl])

  const createDecalFromPointer = (event: ThreeEvent<PointerEvent>, id = 'preview-decal'): SceneDecal | null => {
    if (!canApplyTexture || !selectedAssetId || !selectedTextureUrl || event.object.userData.isDecal) {
      return null
    }

    const { point, normal, rotation, targetMesh } = getDecalProjection(event, previewSettings.rotation)

    return {
      id,
      assetId: selectedAssetId,
      textureUrl: selectedTextureUrl,
      targetName: targetMesh.name || 'Model surface',
      targetMesh,
      position: point.toArray(),
      normal: normal.toArray(),
      rotation: rotation.toArray().slice(0, 3) as [number, number, number],
      size: getStableDecalSize(previewSettings),
      opacity: previewSettings.opacity,
    }
  }

  return (
    <>
      <group name="mesh-graffiti-export-root">
        <group
          onPointerMove={(event) => {
            setPreviewDecal(createDecalFromPointer(event))
          }}
          onPointerLeave={() => setPreviewDecal(null)}
          onPointerDown={(event) => {
            pointerStartRef.current = {
              button: event.nativeEvent.button,
              time: performance.now(),
              x: event.nativeEvent.clientX,
              y: event.nativeEvent.clientY,
            }
          }}
          onPointerUp={(event) => {
            const pointerStart = pointerStartRef.current
            pointerStartRef.current = null

            if (!pointerStart || pointerStart.button !== 0 || event.nativeEvent.button !== 0) {
              return
            }

            const elapsed = performance.now() - pointerStart.time
            const movement = Math.hypot(
              event.nativeEvent.clientX - pointerStart.x,
              event.nativeEvent.clientY - pointerStart.y,
            )

            if (elapsed > 220 || movement > 6) {
              return
            }

            const nextDecal = createDecalFromPointer(event, crypto.randomUUID())

            if (!nextDecal) {
              return
            }

            onCreateDecal(nextDecal)
          }}
        >
          {modelUrl && modelFormat ? <LoadedModel modelUrl={modelUrl} modelFormat={modelFormat} /> : <ProceduralPreviewModel />}
        </group>
        {decals.map((decal) => (
          <DecalMesh decal={decal} key={decal.id} />
        ))}
      </group>
      {previewDecal && (
        <>
          <DecalMesh decal={previewDecal} preview />
          <DecalOrientationHelper decal={previewDecal} />
        </>
      )}
    </>
  )
}
