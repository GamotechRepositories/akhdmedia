const PageHeader = ({ eyebrow, title, description, action }) => (
  <div className="mb-6 flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
    <div className="min-w-0">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
      )}
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
    </div>
    {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
  </div>
)

export default PageHeader
