import { useRef, useState } from 'react'
import { uploadMedia } from '../api/client'
import { inputClass } from './ui/adminUi'

const MediaUpload = ({
  label,
  accept,
  uploadType,
  value,
  filename = '',
  accessUrl = '',
  onChange,
  valueKind = 'url',
  placeholder = 'Or paste URL',
  disabled = false,
  showAccessUrl = false,
}) => {
  const inputRef = useRef(null)
  const progressRef = useRef(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const reportProgress = (percent) => {
    const next = Math.min(99, Math.max(progressRef.current, percent))
    progressRef.current = next
    setUploadProgress(next)
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    progressRef.current = 0
    setUploadProgress(0)
    setError('')

    try {
      const response = await uploadMedia(file, uploadType, reportProgress)
      progressRef.current = 100
      setUploadProgress(100)
      const nextValue = valueKind === 'key' ? response.data.key : response.data.url
      const uploadedFilename = response.data.filename || file.name
      onChange(nextValue, {
        filename: uploadedFilename,
        size: response.data.size || file.size,
        url: response.data.url || '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const isImage = accept?.includes('image')
  const previewUrl = valueKind === 'url' ? value : accessUrl || null
  const isVideoUpload = uploadType.includes('video') || accept?.includes('video')

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
          onClick={() => inputRef.current?.click()}
          disabled={uploading || disabled}
          className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          {uploading ? `Uploading ${uploadProgress}%` : disabled ? 'Select quality first' : 'Upload File'}
        </button>
        {value && !uploading && (
          <span className="text-[11px] font-medium text-emerald-600">
            {filename ? `Saved: ${filename}` : 'Uploaded'}
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
        onChange={(e) => onChange(e.target.value, { filename: '', url: '' })}
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

      {previewUrl && isImage && (
        <img src={previewUrl} alt="" className="mt-2 h-20 w-full rounded-md object-cover" />
      )}

      {previewUrl && !isImage && isVideoUpload && (
        <video src={previewUrl} controls className="mt-2 max-h-40 w-full rounded-md bg-black" />
      )}

      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  )
}

export default MediaUpload
