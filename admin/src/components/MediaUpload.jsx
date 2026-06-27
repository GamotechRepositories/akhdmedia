import { useRef, useState } from 'react'
import { uploadMedia } from '../api/client'
import { captureVideoPosterFromFile } from '../utils/captureVideoPoster'
import {
  formatFileSize,
  formatUploadEta,
  formatUploadSpeed,
} from '../utils/formatFileSize'
import { inputClass } from './ui/adminUi'

const MediaUpload = ({
  label,
  accept,
  uploadType,
  value,
  filename = '',
  fileSize = 0,
  accessUrl = '',
  onChange,
  valueKind = 'url',
  placeholder = 'Or paste URL',
  disabled = false,
  showAccessUrl = false,
  autoCapturePoster = false,
  onPosterCaptured,
  clipId = '',
  categorySlug = '',
  actorSlug = '',
  previewIndex = 0,
  tier = '',
}) => {
  const inputRef = useRef(null)
  const progressRef = useRef(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('')
  const [uploadEta, setUploadEta] = useState('')
  const [uploadedSize, setUploadedSize] = useState(fileSize || 0)
  const [error, setError] = useState('')

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

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    progressRef.current = 0
    setUploadProgress(0)
    setUploadSpeed('')
    setUploadEta('')
    setError('')

    try {
      const posterCapturePromise = autoCapturePoster
        ? captureVideoPosterFromFile(file).catch(() => null)
        : null
      const response = await uploadMedia(file, uploadType, reportProgress, {
        clipId,
        categorySlug,
        actorSlug,
        previewIndex,
        tier,
      })
      const uploadedBytes = response.data.size || file.size

      progressRef.current = 100
      setUploadProgress(100)
      setUploadedSize(uploadedBytes)

      const withCacheBuster = (url) => {
        if (!url) return ''
        const base = url.split('?')[0]
        return `${base}?v=${Date.now()}`
      }

      const nextValue =
        valueKind === 'key'
          ? response.data.key
          : withCacheBuster(response.data.url || '')
      const uploadedFilename = response.data.filename || file.name
      onChange(nextValue, {
        filename: uploadedFilename,
        size: uploadedBytes,
        url: response.data.url || '',
        posterCapturePromise,
      })
      if (autoCapturePoster && onPosterCaptured && posterCapturePromise) {
        const posterBlob = await posterCapturePromise
        if (posterBlob) {
          await onPosterCaptured(posterBlob)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setUploadSpeed('')
      setUploadEta('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const isImage = accept?.includes('image')
  const previewUrl = valueKind === 'url' ? value : accessUrl || null
  const isVideoUpload = uploadType.includes('video') || accept?.includes('video')
  const displaySize = uploadedSize > 0 ? formatFileSize(uploadedSize) : ''
  const isCategoryUpload = uploadType === 'category-cover'
  const isHeroUpload = uploadType === 'hero-slide'
  const isActorUpload = uploadType === 'actor-image'
  const uploadReady = isHeroUpload
    ? true
    : isActorUpload
      ? Boolean(actorSlug?.trim())
      : isCategoryUpload
        ? Boolean(categorySlug)
        : Boolean(clipId)
  const uploadButtonLabel = uploading
    ? `Uploading ${uploadProgress}%${uploadSpeed && uploadSpeed !== '—' ? ` · ${uploadSpeed}` : ''}`
    : !uploadReady
      ? isCategoryUpload || isActorUpload
        ? 'Enter slug first'
        : 'Preparing Clip ID...'
      : disabled
        ? 'Select quality first'
        : 'Upload File'

  const handleCopyUrl = async () => {
    if (!accessUrl) return
    try {
      await navigator.clipboard.writeText(accessUrl)
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-slate-700">{label}</p>

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
        {value && !uploading && (
          <span className="text-[11px] font-medium text-emerald-600">
            {filename ? `Saved: ${filename}` : 'Uploaded'}
            {displaySize ? ` · ${displaySize}` : ''}
          </span>
        )}
      </div>

      {uploading && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span>Uploading file...</span>
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
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFile}
      />

      <input
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value, { filename: '', url: '', size: 0 })
          setUploadedSize(0)
        }}
        disabled={disabled}
        className={`${inputClass} mt-2 disabled:bg-slate-100 disabled:text-slate-400`}
        placeholder={placeholder}
      />

      {showAccessUrl && accessUrl && (
        <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-sky-800">
            Master File URL
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={accessUrl}
              className={`${inputClass} flex-1 bg-white text-xs text-slate-700`}
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="shrink-0 rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
            >
              Copy
            </button>
          </div>
          <a
            href={accessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-medium text-sky-700 underline"
          >
            Open in new tab
          </a>
        </div>
      )}

      {previewUrl && isImage && !isHeroUpload && (
        <img
          key={previewUrl}
          src={previewUrl}
          alt=""
          className="mt-2 max-h-[28rem] w-full rounded-md bg-slate-100 object-contain"
        />
      )}

      {previewUrl && !isImage && isVideoUpload && (
        <video
          src={previewUrl}
          controls
          className="mt-2 max-h-[28rem] w-full rounded-md bg-black object-contain"
        />
      )}

      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  )
}

export default MediaUpload
