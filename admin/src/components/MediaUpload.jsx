import { useRef, useState } from 'react'
import { uploadMedia } from '../api/client'
import { inputClass } from './ui/adminUi'

const MediaUpload = ({
  label,
  accept,
  uploadType,
  value,
  filename = '',
  onChange,
  valueKind = 'url',
  placeholder = 'Or paste URL',
  disabled = false,
}) => {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const response = await uploadMedia(file, uploadType)
      const nextValue = valueKind === 'key' ? response.data.key : response.data.url
      const uploadedFilename = response.data.filename || file.name
      onChange(nextValue, { filename: uploadedFilename, size: response.data.size || file.size })
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const isImage = accept?.includes('image')
  const previewUrl = valueKind === 'url' ? value : null

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
          {uploading ? 'Uploading...' : disabled ? 'Select quality first' : 'Upload File'}
        </button>
        {value && (
          <span className="text-[11px] font-medium text-emerald-600">
            {filename ? `Saved: ${filename}` : 'Uploaded'}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFile}
      />

      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value, { filename: '' })}
        disabled={disabled}
        className={`${inputClass} mt-2 disabled:bg-slate-100 disabled:text-slate-400`}
        placeholder={placeholder}
      />

      {previewUrl && isImage && (
        <img src={previewUrl} alt="" className="mt-2 h-20 w-full rounded-md object-cover" />
      )}

      {previewUrl && !isImage && uploadType.includes('video') && (
        <video src={previewUrl} controls className="mt-2 max-h-32 w-full rounded-md bg-black" />
      )}

      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  )
}

export default MediaUpload
