import { useState } from 'react'
import { RESOLUTION_ORDER, RESOLUTION_TIERS, isStandardTier } from '../constants/resolutionTiers'
import { inputClass } from './ui/adminUi'

const AvailableTierSelector = ({
  selected = [],
  onToggle,
  onAddCustom,
  onRemoveCustom,
}) => {
  const [customName, setCustomName] = useState('')
  const [customResolution, setCustomResolution] = useState('')
  const [customError, setCustomError] = useState('')

  const customTiers = selected.filter((tier) => !isStandardTier(tier))

  const handleAddCustom = () => {
    const name = customName.trim()
    const resolution = customResolution.trim()

    if (!name) {
      setCustomError('Enter a name for the custom quality')
      return
    }
    if (selected.includes(name)) {
      setCustomError('This quality already exists')
      return
    }
    if (!resolution) {
      setCustomError('Enter dimensions (e.g. 5120×2880)')
      return
    }

    onAddCustom(name, resolution)
    setCustomName('')
    setCustomResolution('')
    setCustomError('')
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">
        Which qualities are available for this product?
      </p>
      <p className="mb-3 text-xs text-slate-500">
        Select standard tiers or add a custom size. Only selected tiers appear below and on the storefront.
      </p>

      <div className="flex flex-wrap gap-2">
        {RESOLUTION_ORDER.map((tier) => {
          const isSelected = selected.includes(tier)
          return (
            <button
              key={tier}
              type="button"
              onClick={() => onToggle(tier)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {tier}
              <span className={`ml-1.5 font-normal ${isSelected ? 'text-violet-100' : 'text-slate-400'}`}>
                {RESOLUTION_TIERS[tier].resolution}
              </span>
            </button>
          )
        })}
      </div>

      {customTiers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {customTiers.map((tier) => (
            <span
              key={tier}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900"
            >
              {tier}
              <button
                type="button"
                onClick={() => onRemoveCustom(tier)}
                className="rounded-full p-0.5 text-amber-700 hover:bg-amber-200"
                aria-label={`Remove ${tier}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-3">
        <p className="mb-2 text-xs font-semibold text-slate-700">Add custom quality</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className={inputClass}
            placeholder="Name (e.g. 5K, 1080p Pro)"
          />
          <input
            value={customResolution}
            onChange={(e) => setCustomResolution(e.target.value)}
            className={inputClass}
            placeholder="Dimensions (e.g. 5120×2880)"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Add
          </button>
        </div>
        {customError && <p className="mt-1.5 text-[11px] text-red-600">{customError}</p>}
      </div>
    </div>
  )
}

export default AvailableTierSelector
