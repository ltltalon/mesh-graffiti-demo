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
    id: 'preset-cover-001',
    name: 'Cover 001',
    url: '/stickers/001.jpg',
    preset: true,
    aspectRatio: 1,
  },
  {
    id: 'preset-cover-002',
    name: 'Cover 002',
    url: '/stickers/002.jpg',
    preset: true,
    aspectRatio: 902 / 900,
  },
  {
    id: 'preset-cover-003',
    name: 'Cover 003',
    url: '/stickers/003.jpg',
    preset: true,
    aspectRatio: 1,
  },
  {
    id: 'preset-cover-004',
    name: 'Cover 004',
    url: '/stickers/004.jpg',
    preset: true,
    aspectRatio: 1,
  },
  {
    id: 'preset-cover-005',
    name: 'Cover 005',
    url: '/stickers/005.jpg',
    preset: true,
    aspectRatio: 1,
  },
  {
    id: 'preset-cover-006',
    name: 'Cover 006',
    url: '/stickers/006.jpg',
    preset: true,
    aspectRatio: 1,
  },
  {
    id: 'preset-cover-007',
    name: 'Cover 007',
    url: '/stickers/007.jpg',
    preset: true,
    aspectRatio: 1,
  },
  {
    id: 'preset-cover-008',
    name: 'Cover 008',
    url: '/stickers/008.jpg',
    preset: true,
    aspectRatio: 600 / 596,
  },
  {
    id: 'preset-cover-009',
    name: 'Cover 009',
    url: '/stickers/009.jpg',
    preset: true,
    aspectRatio: 498 / 500,
  },
  {
    id: 'preset-cover-010',
    name: 'Cover 010',
    url: '/stickers/010.jpg',
    preset: true,
    aspectRatio: 1,
  },
  {
    id: 'preset-cover-011',
    name: 'Cover 011',
    url: '/stickers/011.jpg',
    preset: true,
    aspectRatio: 1,
  },
  {
    id: 'preset-cover-012',
    name: 'Cover 012',
    url: '/stickers/012.jpg',
    preset: true,
    aspectRatio: 1,
  },
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
