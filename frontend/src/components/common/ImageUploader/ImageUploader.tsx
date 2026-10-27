import React, { useRef, useState } from 'react'
import './ImageUploader.css'

interface ImageUploaderProps {
  value?: string
  onChange?: (url: string) => void
  onUpload?: (file: File) => Promise<void>
  disabled?: boolean
  uploading?: boolean
  error?: string | null
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onUpload,
  disabled = false,
  uploading = false,
  error = null,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = error ?? localError

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLocalError(null)

    if (onUpload) {
      try {
        await onUpload(file)
      } catch {
        setLocalError('Không thể upload ảnh, vui lòng thử lại')
      }
    }
    // Reset so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = () => {
    onChange?.('')
    setLocalError(null)
  }

  return (
    <div className="image-uploader">
      {value ? (
        <div className="image-uploader__preview">
          <img src={value} alt="Product" className="image-uploader__img" />
          {!disabled && (
            <div className="image-uploader__overlay">
              <button
                type="button"
                className="image-uploader__change-btn"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Đang tải...' : 'Thay ảnh'}
              </button>
              <button
                type="button"
                className="image-uploader__remove-btn"
                onClick={handleRemove}
                disabled={uploading}
              >
                Xóa
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="image-uploader__dropzone"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <span>Đang tải lên...</span>
          ) : (
            <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Nhấn để chọn ảnh</span>
              <span className="image-uploader__hint">JPG, PNG, WebP, GIF · Tối đa 5 MB</span>
            </>
          )}
        </button>
      )}

      {displayError && <p className="image-uploader__error">{displayError}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />
    </div>
  )
}

