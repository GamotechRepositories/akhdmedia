import { cardClass, paginationBtnClass } from './adminUi'

const AdminPagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'entries',
}) => {
  if (totalItems <= 0) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className={`${cardClass} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4`}>
      <p className="text-xs text-slate-600 sm:text-sm">
        Showing {start}–{end} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={paginationBtnClass}
        >
          Previous
        </button>
        <span className="px-1 text-xs font-medium text-slate-700 sm:text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={paginationBtnClass}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default AdminPagination
