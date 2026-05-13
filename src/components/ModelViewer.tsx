import type { ThreeEvent } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ClampToEdgeWrapping,
  Color,
  Euler,
  FrontSide,
  Group,
  Material,
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
import type {
  DecalLayer,
  DecalSettings,
  MaterialRegion,
  MaterialSettings,
  ModelFormat,
} from '../state/editorStore'

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
  materialSettingsByRegion: Record<string, MaterialSettings>
  hoveredMaterialRegionId: string | null
  onCreateDecal: (decal: SceneDecal) => void
  onModelStructure: (regions: MaterialRegion[]) => void
  onMaterialRegionHover: (regionId: string | null) => void
  onMaterialRegionSelect: (regionId: string) => void
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
      if (Array.isArray(child.material)) {
        child.material = child.material.map((material) => material.clone())
      } else if (child.material) {
        child.material = child.material.clone()
      } else {
        child.material = createModelMaterial()
      }
    }
  })
}

function materialToSettings(material: Material | Material[] | undefined): MaterialSettings {
  const sourceMaterial = Array.isArray(material) ? material[0] : material
  const standardMaterial = sourceMaterial instanceof MeshStandardMaterial ? sourceMaterial : null

  return {
    color: standardMaterial?.color.getHexString() ? `#${standardMaterial.color.getHexString()}` : '#92a0b6',
    roughness: standardMaterial?.roughness ?? 0.72,
    metalness: standardMaterial?.metalness ?? 0.02,
    opacity: sourceMaterial?.opacity ?? 1,
    transparent: Boolean(sourceMaterial?.transparent),
  }
}

function createEditableMaterial(settings: MaterialSettings, name?: string) {
  return new MeshStandardMaterial({
    name,
    color: new Color(settings.color),
    roughness: settings.roughness,
    metalness: settings.metalness,
    opacity: settings.opacity,
    transparent: settings.transparent || settings.opacity < 1,
  })
}

function getMaterialName(material: Material | undefined, fallback: string) {
  return material?.name?.trim() || fallback
}

type MaterialRegionIndex = {
  regions: MaterialRegion[]
  meshMap: Map<string, Mesh>
  regionMeshMap: Map<string, Mesh>
}

function collectMaterialRegions(model: Object3D): MaterialRegionIndex {
  const regions: MaterialRegion[] = []
  const meshMap = new Map<string, Mesh>()
  const regionMeshMap = new Map<string, Mesh>()

  model.traverse((child: Object3D) => {
    if (!(child instanceof Mesh)) {
      return
    }

    meshMap.set(child.uuid, child)

    const materials = Array.isArray(child.material) ? child.material : [child.material]
    const groups: Array<{ start: number; count: number; materialIndex?: number }> = child.geometry.groups ?? []
    const triangleCount = child.geometry.index
      ? Math.floor(child.geometry.index.count / 3)
      : Math.floor((child.geometry.attributes.position?.count ?? 0) / 3)

    if (groups.length > 0) {
      const materialIndexes = [...new Set(groups.map((group) => group.materialIndex ?? 0))]

      materialIndexes.forEach((materialIndex) => {
        const material = materials[materialIndex] ?? materials[0]
        const regionId = `${child.uuid}:${materialIndex}`

        regionMeshMap.set(regionId, child)
        regions.push({
          id: regionId,
          meshName: child.name || 'Unnamed mesh',
          materialName: getMaterialName(material, `Material ${materialIndex + 1}`),
          materialIndex,
          hasGroups: true,
          groupCount: groups.filter((group) => (group.materialIndex ?? 0) === materialIndex).length,
          triangleCount,
          isMultiMaterial: materials.length > 1,
          editableLevel: 'material-group',
          settings: materialToSettings(material),
        })
      })

      return
    }

    const material = materials[0]
    regionMeshMap.set(child.uuid, child)
    regions.push({
      id: child.uuid,
      meshName: child.name || 'Unnamed mesh',
      materialName: getMaterialName(material, 'Mesh material'),
      materialIndex: null,
      hasGroups: false,
      groupCount: 0,
      triangleCount,
      isMultiMaterial: materials.length > 1,
      editableLevel: 'mesh',
      settings: materialToSettings(material),
    })
  })

  return { regions, meshMap, regionMeshMap }
}

function LoadedModel({
  modelUrl,
  modelFormat,
  onModelReady,
}: {
  modelUrl: string
  modelFormat: ModelFormat
  onModelReady: (model: Group | null) => void
}) {
  const [model, setModel] = useState<Group | null>(null)

  const updateModel = useCallback((nextModel: Group | null) => {
    setModel(nextModel)
    onModelReady(nextModel)
  }, [onModelReady])

  useEffect(() => {
    let isMounted = true
    updateModel(null)

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
          updateModel(loadedGroup)
        },
        undefined,
        () => {
          if (isMounted) {
            updateModel(null)
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
          updateModel(object)
        },
        undefined,
        () => {
          if (isMounted) {
            updateModel(null)
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
          updateModel(loadedScene)
        },
        undefined,
        () => {
          if (isMounted) {
            updateModel(null)
          }
        },
      )
    }

    return () => {
      isMounted = false
      onModelReady(null)
    }
  }, [modelFormat, modelUrl, onModelReady, updateModel])

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
    const nextGeometry = new DecalGeometry(
      decal.targetMesh,
      new Vector3(...decal.position),
      new Euler(...decal.rotation),
      new Vector3(...decal.size),
    )
    const positionAttribute = nextGeometry.getAttribute('position')
    const normalAttribute = nextGeometry.getAttribute('normal')
    const liftDistance = preview ? 0.0015 : 0.003

    if (positionAttribute && normalAttribute) {
      for (let index = 0; index < positionAttribute.count; index += 1) {
        positionAttribute.setXYZ(
          index,
          positionAttribute.getX(index) + normalAttribute.getX(index) * liftDistance,
          positionAttribute.getY(index) + normalAttribute.getY(index) * liftDistance,
          positionAttribute.getZ(index) + normalAttribute.getZ(index) * liftDistance,
        )
      }
      positionAttribute.needsUpdate = true
    }

    return nextGeometry
  }, [decal, preview])

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

function getRegionIdFromPointer(event: ThreeEvent<PointerEvent>) {
  const targetMesh = event.object as Mesh
  const faceMaterialIndex = (event.face as { materialIndex?: number } | undefined)?.materialIndex

  if (targetMesh.geometry.groups.length > 0 && typeof faceMaterialIndex === 'number') {
    return `${targetMesh.uuid}:${faceMaterialIndex}`
  }

  return targetMesh.uuid
}

function getStableDecalSize(settings: DecalSettings): [number, number, number] {
  const height = settings.size
  const width = settings.size * settings.aspectRatio
  const depth = Math.max(width, height) * 0.42

  return [width, height, depth]
}

function MaterialRegionHighlight({ mesh }: { mesh: Mesh }) {
  const geometry = useMemo(() => {
    const nextGeometry = mesh.geometry.clone()

    nextGeometry.applyMatrix4(mesh.matrixWorld)
    const positionAttribute = nextGeometry.getAttribute('position')
    const normalAttribute = nextGeometry.getAttribute('normal')
    const liftDistance = 0.006

    if (positionAttribute && normalAttribute) {
      for (let index = 0; index < positionAttribute.count; index += 1) {
        positionAttribute.setXYZ(
          index,
          positionAttribute.getX(index) + normalAttribute.getX(index) * liftDistance,
          positionAttribute.getY(index) + normalAttribute.getY(index) * liftDistance,
          positionAttribute.getZ(index) + normalAttribute.getZ(index) * liftDistance,
        )
      }
      positionAttribute.needsUpdate = true
    }

    return nextGeometry
  }, [mesh])

  const material = useMemo(() => {
    return new MeshBasicMaterial({
      color: '#b7ff4a',
      transparent: true,
      opacity: 0.16,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return <mesh geometry={geometry} material={material} renderOrder={8} />
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
  materialSettingsByRegion,
  hoveredMaterialRegionId,
  onCreateDecal,
  onModelStructure,
  onMaterialRegionHover,
  onMaterialRegionSelect,
  onModelLoadStatus,
}: ModelViewerProps) {
  const [previewDecal, setPreviewDecal] = useState<SceneDecal | null>(null)
  const [loadedModel, setLoadedModel] = useState<Group | null>(null)
  const pointerStartRef = useRef<{ button: number; time: number; x: number; y: number } | null>(null)
  const materialMeshesRef = useRef<Map<string, Mesh>>(new Map())
  const materialRegionMeshesRef = useRef<Map<string, Mesh>>(new Map())
  const hoveredMaterialMesh = hoveredMaterialRegionId ? materialRegionMeshesRef.current.get(hoveredMaterialRegionId) : null

  useEffect(() => {
    onModelLoadStatus(modelUrl ? 'Custom model loaded. Select a sticker, then click the model to place a decal.' : 'Using preview model. Import GLB, GLTF, OBJ or STL anytime.')
  }, [modelUrl, onModelLoadStatus])

  useEffect(() => {
    setPreviewDecal(null)
  }, [selectedAssetId, selectedTextureUrl])

  useEffect(() => {
    if (!loadedModel) {
      materialMeshesRef.current = new Map()
      materialRegionMeshesRef.current = new Map()
      onModelStructure([])
      return
    }

    const { regions, meshMap, regionMeshMap } = collectMaterialRegions(loadedModel)

    materialMeshesRef.current = meshMap
    materialRegionMeshesRef.current = regionMeshMap
    onModelStructure(regions)
  }, [loadedModel, onModelStructure])

  useEffect(() => {
    Object.entries(materialSettingsByRegion).forEach(([regionId, settings]) => {
      const [meshUuid, materialIndexValue] = regionId.split(':')
      const mesh = materialMeshesRef.current.get(meshUuid)

      if (!mesh) {
        return
      }

      const nextMaterial = createEditableMaterial(settings, `Edited ${mesh.name || 'material'}`)

      if (materialIndexValue !== undefined) {
        const materialIndex = Number(materialIndexValue)
        const currentMaterials = Array.isArray(mesh.material) ? [...mesh.material] : [mesh.material]

        currentMaterials[materialIndex] = nextMaterial
        mesh.material = currentMaterials
      } else {
        mesh.material = nextMaterial
      }

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => {
          material.needsUpdate = true
        })
      } else {
        mesh.material.needsUpdate = true
      }
    })
  }, [materialSettingsByRegion])

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
            if (event.object.userData.isDecal) {
              return
            }

            if (canApplyTexture) {
              onMaterialRegionHover(null)
              setPreviewDecal(createDecalFromPointer(event))
              return
            }

            setPreviewDecal(null)
            onMaterialRegionHover(getRegionIdFromPointer(event))
          }}
          onPointerLeave={() => {
            setPreviewDecal(null)
            onMaterialRegionHover(null)
          }}
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

            if (!canApplyTexture) {
              onMaterialRegionSelect(getRegionIdFromPointer(event))
              return
            }

            const nextDecal = createDecalFromPointer(event, crypto.randomUUID())
            if (!nextDecal) {
              return
            }

            onCreateDecal(nextDecal)
          }}
        >
          {modelUrl && modelFormat ? (
            <LoadedModel
              modelUrl={modelUrl}
              modelFormat={modelFormat}
              onModelReady={setLoadedModel}
            />
          ) : (
            <ProceduralPreviewModel />
          )}
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
      {!canApplyTexture && hoveredMaterialMesh && <MaterialRegionHighlight mesh={hoveredMaterialMesh} />}
    </>
  )
}
