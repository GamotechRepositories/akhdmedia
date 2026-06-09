const StatusBadge = ({ active }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
      active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
    }`}
  >
    {active ? 'Active' : 'Hidden'}
  </span>
)

export default StatusBadge
