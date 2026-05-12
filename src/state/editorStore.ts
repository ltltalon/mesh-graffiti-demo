export type EditorMode = 'move' | 'scale' | 'rotate'

export type EditorState = {
  mode: EditorMode
  selectedAssetId: string | null
  appliedTextureUrl: string | null
  modelUrl: string | null
  modelName: string
  textureOffset: {
    x: number
    y: number
  }
  textureScale: number
  textureRotation: number
}

export const initialEditorState: EditorState = {
  mode: 'move',
  selectedAssetId: null,
  appliedTextureUrl: null,
  modelUrl: null,
  modelName: 'Procedural preview model',
  textureOffset: {
    x: 0,
    y: 0,
  },
  textureScale: 1,
  textureRotation: 0,
}
