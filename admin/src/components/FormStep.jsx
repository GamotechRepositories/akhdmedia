const FormStep = ({ step, title, hint, tone = 'slate', children }) => {
  const tones = {
    slate: 'bg-slate-50',
    sky: 'bg-sky-50/80',
    violet: 'bg-violet-50/70',
    emerald: 'bg-emerald-50/70',
    amber: 'bg-amber-50/70',
  }

  return (
    <section className={`border-b border-slate-200/70 px-5 py-4 ${tones[tone] || tones.slate}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
          {step}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export default FormStep
