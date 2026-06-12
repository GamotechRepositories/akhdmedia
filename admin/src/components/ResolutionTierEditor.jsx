import { RESOLUTION_ORDER } from '../constants/resolutionTiers'

const tierInputClass =
  'mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10'

const ResolutionTierEditor = ({
  order,
  tiers = {},
  selectedTiers = [],
  onToggleTier,
  showPrice = true,
  uniformPrice,
  onFieldChange,
}) => (
  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {order.map((tier) => {
      const tierData = tiers[tier] || {}
      const isSelected = selectedTiers.includes(tier)

      return (
        <div
          key={tier}
          className={`relative rounded-lg border p-3 text-sm shadow-sm transition-all ${
            isSelected
              ? 'border-violet-300 bg-white/90'
              : 'border-slate-200 bg-slate-50/80 opacity-75'
          }`}
        >
          {onToggleTier && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleTier(tier)}
              title={isSelected ? 'Available to customers' : 'Not sold to customers'}
              aria-label={`Sell ${tier} to customers`}
              className="absolute right-3 top-3 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
          )}

          <p className="mb-2 pr-6 text-xs font-bold uppercase tracking-wide text-slate-900">
            {tier}
            {!RESOLUTION_ORDER.includes(tier) && (
              <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold normal-case text-amber-800">
                custom
              </span>
            )}
          </p>

          {!RESOLUTION_ORDER.includes(tier) && (
            <label className="mb-2 block text-xs">
              <span className="font-medium text-slate-600">Dimensions</span>
              <input
                value={tierData.resolution ?? ''}
                onChange={(e) => onFieldChange(tier, 'resolution', e.target.value)}
                disabled={!isSelected}
                className={tierInputClass}
                placeholder="5120×2880"
              />
            </label>
          )}

          <label className="mb-2 block text-xs">
            <span className="font-medium text-slate-600">File size</span>
            <input
              value={tierData.size ?? ''}
              onChange={(e) => onFieldChange(tier, 'size', e.target.value)}
              disabled={!isSelected}
              className={tierInputClass}
              placeholder="6 MB"
            />
          </label>

          {showPrice ? (
            <label className="block text-xs">
              <span className="font-medium text-slate-600">Price (₹)</span>
              <input
                type="number"
                required={isSelected}
                min="0"
                value={tierData.price ?? ''}
                onChange={(e) => onFieldChange(tier, 'price', e.target.value)}
                disabled={!isSelected}
                className={tierInputClass}
                placeholder="₹"
              />
            </label>
          ) : (
            <p className="text-xs font-semibold text-slate-700">
              ₹{uniformPrice} <span className="font-normal text-slate-500">(all sizes)</span>
            </p>
          )}
        </div>
      )
    })}
  </div>
)

export default ResolutionTierEditor
