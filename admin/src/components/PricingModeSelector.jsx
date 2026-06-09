import { PRICING_MODE_OPTIONS } from '../constants/pricingModes'

const PricingModeSelector = ({ value, onChange }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {PRICING_MODE_OPTIONS.map((option) => {
      const isSelected = value === option.value
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-xl border-2 p-3.5 text-left transition-all ${
            isSelected
              ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white'
          }`}
        >
          <p className="text-sm font-bold">{option.label}</p>
          <p className={`mt-1 text-xs ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
            {option.description}
          </p>
        </button>
      )
    })}
  </div>
)

export default PricingModeSelector
