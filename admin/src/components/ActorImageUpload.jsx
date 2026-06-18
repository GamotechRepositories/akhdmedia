import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { uploadMedia } from '../api/client'
import { getCroppedImageBlob } from '../utils/cropImage'
import {
  formatFileSize,
  formatUploadEta,
  formatUploadSpeed,
} from '../utils/formatFileSize'
import { inputClass, secondaryBtnClass } from './ui/adminUi'

const ActorImageUpload = ({
  value = '',
  onChange,
  actorSlug = '',
  disabled = false,
}) => {
  const inputRef = useRef(null)
  const progressRef = useRef(0)
  const cropSourceRef = useRef('')

  const [imageSrc, setImageSrc] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('')
  const [uploadEta, setUploadEta] = useState('')
  const [uploadedSize, setUploadedSize] = useState(0)
  const [error, setError] = useState('')

  const uploadReady = Boolean(actorSlug?.trim())

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
      setError('Choose a photo and adjust it inside the circle first.')
      return
    }

    if (!uploadReady) {
      setError('Enter actor name/slug before saving the photo.')
      return
    }

    setUploading(true)
    progressRef.current = 0
    setUploadProgress(0)
    setUploadSpeed('')
    setUploadEta('')
    setError('')

    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels)
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' })
      const response = await uploadMedia(file, 'actor-image', reportProgress, { actorSlug })
      const uploadedUrl = response.data.url || ''
      const uploadedBytes = response.data.size || file.size

      progressRef.current = 100
      setUploadProgress(100)
      setUploadedSize(uploadedBytes)

      onChange(uploadedUrl)
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

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-slate-700">Actor image</p>
      <p className="mb-3 text-[11px] text-slate-500">
        Upload a photo, then drag and zoom to fit the face inside the circle — same as the
        homepage profile look.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = ''
            inputRef.current?.click()
          }}
          disabled={uploading || disabled || !uploadReady}
          className={secondaryBtnClass}
        >
          {!uploadReady ? 'Enter slug first' : imageSrc ? 'Choose another photo' : 'Choose photo'}
        </button>

        {value && !uploading && !imageSrc ? (
          <span className="text-[11px] font-medium text-emerald-600">
            Photo saved{uploadedSize > 0 ? ` · ${formatFileSize(uploadedSize)}` : ''}
          </span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {imageSrc ? (
        <div className="mt-4 space-y-4">
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
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
              {uploading ? `Saving ${uploadProgress}%` : 'Save cropped photo'}
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
            <span>Uploading cropped photo...</span>
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

      <label className="mt-4 block text-xs font-medium text-slate-700">
        Or paste image URL
        <input
          value={value || ''}
          onChange={(event) => {
            onChange(event.target.value)
            setUploadedSize(0)
          }}
          disabled={disabled || uploading}
          className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-400`}
          placeholder="https://..."
        />
      </label>

      {value ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Homepage preview
          </p>
          <div className="relative h-28 w-28 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-200 sm:h-32 sm:w-32">
            <img
              key={value}
              src={value}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}
    </div>
  )
}

export default ActorImageUpload
