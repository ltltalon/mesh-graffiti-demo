export type UploadedTextureAsset = {
  id: string
  name: string
  url: string
  size: number
}

export function createTextureAsset(file: File): UploadedTextureAsset {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    url: URL.createObjectURL(file),
    size: file.size,
  }
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
