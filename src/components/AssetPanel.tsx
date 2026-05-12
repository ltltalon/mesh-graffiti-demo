import { ImagePlus } from 'lucide-react'
import type { UploadedTextureAsset } from '../lib/textureUtils'
import { formatFileSize } from '../lib/textureUtils'

type AssetPanelProps = {
  assets: UploadedTextureAsset[]
  selectedAssetId: string | null
  onAssetUpload: (files: FileList | null) => void
  onSelectAsset: (assetId: string) => void
}

export function AssetPanel({ assets, selectedAssetId, onAssetUpload, onSelectAsset }: AssetPanelProps) {
  return (
    <section className="asset-panel" aria-label="Asset upload panel">
      <div>
        <span className="eyebrow">Selected Asset</span>
        <h2>Upload image material</h2>
      </div>

      <label className="upload-zone">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(event) => onAssetUpload(event.target.files)}
        />
        <span>
          <ImagePlus size={28} />
          <strong>Drop image here</strong>
          <span>PNG, JPG or WebP from local device</span>
        </span>
      </label>

      <div className="asset-grid">
        {assets.length === 0 && (
          <article className="asset-card empty">
            <div className="asset-thumb empty" />
            <strong>No assets yet</strong>
            <small>Upload an image to start</small>
          </article>
        )}

        {assets.map((asset) => (
          <button
            className={asset.id === selectedAssetId ? 'asset-card selected' : 'asset-card'}
            type="button"
            onClick={() => onSelectAsset(asset.id)}
            key={asset.id}
          >
            <img className="asset-thumb" src={asset.url} alt="" />
            <strong>{asset.name}</strong>
            <small>{formatFileSize(asset.size)}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
