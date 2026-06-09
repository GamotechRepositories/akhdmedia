import { RESOLUTION_ORDER, RESOLUTION_TIERS, getDeliverableCustomerTiers, CUSTOMER_TIER_ORDER } from '../constants/resolutionTiers'
import { inputClass } from './ui/adminUi'

const MasterQualitySelector = ({
  value,
  onChange,
  showGenerated = true,
  disabled = false,
}) => {
  const deliverableTiers = getDeliverableCustomerTiers(value, CUSTOMER_TIER_ORDER)

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4">
      <label className="block text-sm">
        <span className="font-medium text-slate-800">Master file quality *</span>
        <p className="mb-2 mt-1 text-xs text-slate-500">
          Minimum Full HD. Customer options are Full HD and above, up to your master upload.
        </p>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">Select master quality</option>
          {CUSTOMER_TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier} ({RESOLUTION_TIERS[tier].resolution})
            </option>
          ))}
        </select>
      </label>

      {showGenerated && value && deliverableTiers.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sold to customers
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {deliverableTiers.map((tier) => (
              <span
                key={tier}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
              >
                {tier}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterQualitySelector
