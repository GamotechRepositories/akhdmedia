import { useEffect, useState } from 'react'
import {
  UPLOAD_PROVIDERS,
  getStoredUploadProvider,
  setStoredUploadProvider,
} from '../utils/uploadProvider'

const StorageProviderSelect = ({
  value,
  onChange,
  className = '',
  compact = false,
}) => {
  const [provider, setProvider] = useState(() => value || getStoredUploadProvider())

  useEffect(() => {
    if (value && value !== provider) {
      setProvider(value)
    }
  }, [value, provider])

  const handleChange = (next) => {
    const resolved = setStoredUploadProvider(next)
    setProvider(resolved)
    onChange?.(resolved)
  }

  return (
    <div className={className}>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Upload to
      </p>
      <div className={`flex flex-wrap gap-1.5 ${compact ? '' : ''}`}>
        {UPLOAD_PROVIDERS.map((option) => {
          const active = provider === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleChange(option.id)}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title={`Serve via ${option.cdn}`}
            >
              {compact ? option.shortLabel : option.label}
            </button>
          )
        })}
      </div>
      <p className="mt-1 text-[10px] text-slate-400">
        {provider === 'bunny' ? 'cdn-v2.akhdmedia.com' : 'cdn.akhdmedia.com'}
      </p>
    </div>
  )
}

export default StorageProviderSelect
