const STATUS_META = {
  idle: {
    label: 'Not uploaded',
    className: 'bg-slate-100 text-slate-600',
  },
  pending: {
    label: 'Queued',
    className: 'bg-amber-100 text-amber-800',
  },
  processing: {
    label: 'Processing',
    className: 'bg-sky-100 text-sky-800',
  },
  ready: {
    label: 'Ready',
    className: 'bg-emerald-100 text-emerald-800',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800',
  },
}

const TranscodeStatusPanel = ({
  status = 'idle',
  error = '',
  selectedTiers = [],
  deliveryFiles = {},
  onRetry,
  retrying = false,
}) => {
  const meta = STATUS_META[status] || STATUS_META.idle
  const generatedTiers = selectedTiers.filter(
    (tier) => deliveryFiles?.[tier]?.videoKey,
  )

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Transcode Status
          </p>
          <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
            {meta.label}
          </span>
        </div>

        {status === 'failed' && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {retrying ? 'Retrying...' : 'Retry Transcode'}
          </button>
        )}
      </div>

      {(status === 'pending' || status === 'processing') && (
        <p className="mt-3 text-sm text-slate-600">
          Generating delivery files for selected tiers. This may take a few minutes for large masters.
        </p>
      )}

      {status === 'ready' && generatedTiers.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Generated Tiers
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {generatedTiers.map((tier) => (
              <span
                key={tier}
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
              >
                {tier}
                {deliveryFiles[tier]?.videoFilename
                  ? ` · ${deliveryFiles[tier].videoFilename}`
                  : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {error}
        </p>
      )}
    </div>
  )
}

export default TranscodeStatusPanel
