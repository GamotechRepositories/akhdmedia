import PageLoader from './PageLoader'

export default function TableLoader({ label, colSpan, className = '' }) {
  return (
    <tr>
      <td colSpan={colSpan} className={className}>
        <PageLoader label={label} compact labelClassName="text-sm text-slate-500" />
      </td>
    </tr>
  )
}
