const AdminPageHeader = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{eyebrow}</p>
      ) : null}
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
    {action ? <div className="shrink-0 sm:ml-4">{action}</div> : null}
  </div>
)

export default AdminPageHeader
