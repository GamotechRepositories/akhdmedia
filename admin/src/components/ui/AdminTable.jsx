import { forwardRef } from 'react'
import { cardClass, tableClass, tableWideClass } from './adminUi'

const AdminTable = forwardRef(function AdminTable(
  { children, scrollable = true, maxHeight = false, wide = false, className = '' },
  ref,
) {
  const overflowClass = scrollable ? 'admin-scrollbar overflow-x-auto' : ''
  const heightClass = scrollable && maxHeight ? 'max-h-[min(65vh,720px)] overflow-y-auto' : ''

  return (
    <div
      ref={ref}
      className={`${cardClass} ${overflowClass} ${heightClass} ${className}`.trim()}
    >
      <table className={wide ? tableWideClass : tableClass}>{children}</table>
    </div>
  )
})

export default AdminTable
