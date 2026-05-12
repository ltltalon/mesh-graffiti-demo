import { ImagePlus } from 'lucide-react'

const placeholderAssets = [
  { name: 'Neon mark', meta: 'PNG decal' },
  { name: 'Pattern tile', meta: 'Texture sample' },
]

export function AssetPanel() {
  return (
    <section className="asset-panel" aria-label="Asset upload panel">
      <div>
        <span className="eyebrow">Selected Asset</span>
        <h2>Upload image material</h2>
      </div>

      <button className="upload-zone" type="button">
        <span>
          <ImagePlus size={28} />
          <strong>Drop image here</strong>
          <span>PNG, JPG or WebP from local device</span>
        </span>
      </button>

      <div className="asset-grid">
        {placeholderAssets.map((asset) => (
          <article className="asset-card" key={asset.name}>
            <div className="asset-thumb" />
            <strong>{asset.name}</strong>
            <small>{asset.meta}</small>
          </article>
        ))}
      </div>
    </section>
  )
}
