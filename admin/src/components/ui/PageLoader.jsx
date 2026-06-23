import FourCircleLoader from './FourCircleLoader'

export default function PageLoader({
  label,
  className = '',
  fullScreen = false,
  minHeight = 'min-h-[50vh]',
  labelClassName = 'text-sm text-slate-500',
  compact = false,
}) {
  const wrapperClass = fullScreen
    ? `flex min-h-screen flex-col items-center justify-center gap-3 bg-[#eef2f6] ${className}`.trim()
    : compact
      ? `flex flex-col items-center justify-center gap-3 py-6 ${className}`.trim()
      : `flex flex-col items-center justify-center gap-3 ${minHeight} ${className}`.trim()

  return (
    <div
      className={wrapperClass}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label || 'Loading'}
    >
      <FourCircleLoader />
      {label ? <p className={labelClassName}>{label}</p> : null}
    </div>
  )
}
