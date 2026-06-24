import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { uploadCroppedPreviewToS3 } from '../api/client'
import { getCroppedImageBlob } from '../utils/cropImage'
import {
  formatFileSize,
  formatUploadEta,
  formatUploadSpeed,
} from '../utils/formatFileSize'
import { inputClass } from './ui/adminUi'

const ASPECT_OPTIONS = [
  { id: '16:9', label: '16:9 Wide', value: 16 / 9 },
  { id: '4:3', label: '4:3', value: 4 / 3 },
  { id: '3:4', label: '3:4 Tall', value: 3 / 4 },
  { id: '1:1', label: '1:1 Square', value: 1 },
]

const PreviewImageUpload = ({
  label,
  value = '',
  onChange,
  clipId = '',
  previewIndex = 1,
  disabled = false,
  placeholder = 'Or paste image URL',
}) => {
  const inputRef = useRef(null)
  const progressRef = useRef(0)
  const cropSourceRef = useRef('')

  const [imageSrc, setImageSrc] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(16 / 9)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('')
  const [uploadEta, setUploadEta] = useState('')
  const [uploadedSize, setUploadedSize] = useState(0)
  const [error, setError] = useState('')

  const uploadReady = Boolean(clipId?.trim())

  useEffect(
    () => () => {
      if (cropSourceRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(cropSourceRef.current)
      }
    },
    [],
  )

  const clearCropSource = () => {
    if (cropSourceRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(cropSourceRef.current)
    }
    cropSourceRef.current = ''
    setImageSrc('')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const openCropperWithFile = (file) => {
    if (!file) return
    clearCropSource()
    const objectUrl = URL.createObjectURL(file)
    cropSourceRef.current = objectUrl
    setImageSrc(objectUrl)
    setError('')
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    openCropperWithFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleAspectChange = (nextAspect) => {
    setAspect(nextAspect)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const reportProgress = (progress) => {
    const payload =
      typeof progress === 'number'
        ? { percent: progress, loaded: 0, total: 0, speedBps: 0 }
        : progress

    const next = Math.min(99, Math.max(progressRef.current, payload.percent || 0))
    progressRef.current = next
    setUploadProgress(next)
    setUploadSpeed(formatUploadSpeed(payload.speedBps))
    setUploadEta(formatUploadEta(payload.loaded, payload.total, payload.speedBps))
  }

  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError('Choose an image and adjust the crop area first.')
      return
    }

    if (!uploadReady) {
      setError('Wait for Clip ID before uploading to S3.')
      return
    }

    setUploading(true)
    progressRef.current = 0
    setUploadProgress(0)
    setUploadSpeed('')
    setUploadEta('')
    setError('')

    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, {
        maxWidth: 1920,
        maxHeight: 1920,
      })
      const file = new File([blob], `preview-${previewIndex}.jpg`, { type: 'image/jpeg' })

      const response = await uploadCroppedPreviewToS3(file, reportProgress, {
        clipId,
        previewIndex,
      })

      const payload = response.data
      const uploadedUrl = payload.url || ''

      if (!uploadedUrl) {
        throw new Error('S3 upload finished but no public URL was returned')
      }

      const withCacheBuster = (url) => {
        const base = url.split('?')[0]
        return `${base}?v=${Date.now()}`
      }

      progressRef.current = 100
      setUploadProgress(100)
      setUploadedSize(payload.size || file.size)

      onChange(withCacheBuster(uploadedUrl), {
        filename: payload.filename || file.name,
        size: payload.size || file.size,
        url: uploadedUrl,
        key: payload.key || '',
      })
      clearCropSource()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setUploadSpeed('')
      setUploadEta('')
    }
  }

  const handleCancelCrop = () => {
    clearCropSource()
    setError('')
  }

  const uploadButtonLabel = uploading
    ? `Uploading to S3 ${uploadProgress}%`
    : !uploadReady
      ? 'Preparing Clip ID...'
      : imageSrc
        ? 'Choose another image'
        : 'Choose image to crop'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-slate-700">{label}</p>
      <p className="mb-3 text-[11px] text-slate-500">
        Select an image, crop it, then upload the cropped file directly to S3.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = ''
            inputRef.current?.click()
          }}
          disabled={uploading || disabled || !uploadReady}
          className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          {uploadButtonLabel}
        </button>

        {value && !uploading && !imageSrc ? (
          <span className="text-[11px] font-medium text-emerald-600">
            Saved on S3{uploadedSize > 0 ? ` · ${formatFileSize(uploadedSize)}` : ''}
          </span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {imageSrc ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {ASPECT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleAspectChange(option.value)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                  aspect === option.value
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape="rect"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <label className="block text-xs font-medium text-slate-700">
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-2 w-full accent-slate-900"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={uploading || !croppedAreaPixels}
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {uploading ? `Uploading to S3 ${uploadProgress}%` : 'Crop & upload to S3'}
            </button>
            <button
              type="button"
              onClick={handleCancelCrop}
              disabled={uploading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {uploading ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span>Uploading cropped image to S3...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-200 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>{uploadSpeed}</span>
            <span>{uploadEta}</span>
          </div>
        </div>
      ) : null}

      <input
        value={value || ''}
        onChange={(event) => {
          onChange(event.target.value, { filename: '', url: '', size: 0 })
          setUploadedSize(0)
        }}
        disabled={disabled || uploading}
        className={`${inputClass} mt-2 disabled:bg-slate-100 disabled:text-slate-400`}
        placeholder={placeholder}
      />

      {value && !imageSrc ? (
        <img
          key={value}
          src={value}
          alt=""
          className="mt-2 max-h-48 w-full rounded-md bg-slate-100 object-contain"
        />
      ) : null}

      {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}
    </div>
  )
}

export default PreviewImageUpload
