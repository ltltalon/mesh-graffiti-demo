export type UploadedTextureAsset = {
  id: string
  name: string
  url: string
  size?: number
  preset?: boolean
  aspectRatio: number
}

export function createTextureAsset(file: File): UploadedTextureAsset {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    url: URL.createObjectURL(file),
    size: file.size,
    aspectRatio: 1,
  }
}

export function readImageAspectRatio(url: string) {
  return new Promise<number>((resolve) => {
    const image = new Image()

    image.onload = () => {
      resolve(image.naturalWidth > 0 && image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 1)
    }
    image.onerror = () => resolve(1)
    image.src = url
  })
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export const presetTextureAssets: UploadedTextureAsset[] = [
  {
    id: 'preset-meshy-white',
    name: 'Meshy white',
    url: '/stickers/meshy-logo-128px-white.png',
    preset: true,
    aspectRatio: 406 / 128,
  },
  {
    id: 'preset-meshy-accent',
    name: 'Meshy accent',
    url: '/stickers/meshy-logo-128px-accent.png',
    preset: true,
    aspectRatio: 406 / 128,
  },
  {
    id: 'preset-meshy-black',
    name: 'Meshy black',
    url: '/stickers/meshy-logo-128px-black.png',
    preset: true,
    aspectRatio: 406 / 128,
  },
  {
    id: 'preset-meshy-mix',
    name: 'Meshy mix',
    url: '/stickers/meshy-logo-128px-mix.png',
    preset: true,
    aspectRatio: 406 / 128,
  },
]
