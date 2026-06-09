const PageHeader = ({ eyebrow, title, description, action }) => (
  <div className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
      )}
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)

export default PageHeader
