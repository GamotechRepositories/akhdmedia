import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchAdminSupportRequests } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import TableLoader from '../components/ui/TableLoader'
import {
  actionViewClass,
  cardClass,
  inputClass,
  tableBodyClass,
  tableEmptyClass,
  tableHeadClass,
  tableRowClass,
  tdClass,
  tdHideSm,
  tdPrimaryClass,
  tdRightClass,
  thClass,
  thHideSm,
  thRightClass,
} from '../components/ui/adminUi'
import { buildPageCacheKey, createPaginatedLoader } from '../utils/paginatedPageCache'

const PAGE_SIZE = 50
const supportLoader = createPaginatedLoader()

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Submitted' },
  { id: 'in_progress', label: 'In review' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
]

const STATUS_LABELS = {
  open: 'Submitted',
  in_progress: 'In review',
  resolved: 'Resolved',
  closed: 'Closed',
}

const statusStyles = {
  open: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
}

const Support = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const tableContainerRef = useRef(null)
  const skipSearchResetRef = useRef(true)
  const restore = location.state?.restore

  const [requests, setRequests] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [openCount, setOpenCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(restore?.searchQuery || '')
  const [debouncedSearch, setDebouncedSearch] = useState(restore?.searchQuery || '')
  const [statusFilter, setStatusFilter] = useState(restore?.statusFilter || 'all')
  const [highlightedId, setHighlightedId] = useState('')
  const [currentPage, setCurrentPage] = useState(restore?.page || 1)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (skipSearchResetRef.current) {
      skipSearchResetRef.current = false
      return
    }
    setCurrentPage(1)
    supportLoader.clear()
  }, [debouncedSearch])

  const loadRequests = useCallback(
    async ({ force = false } = {}) => {
      const cacheKey = buildPageCacheKey('support', currentPage, {
        search: debouncedSearch,
        status: statusFilter,
      })

      setLoading(true)
      setError('')

      try {
        const result = await supportLoader.load({
          cacheKey,
          force,
          fetchPage: async () => {
            const response = await fetchAdminSupportRequests({
              page: currentPage,
              limit: PAGE_SIZE,
              search: debouncedSearch,
              status: statusFilter,
            })
            const payload = response.data?.data || {}
            return {
              items: payload.requests || [],
              totalCount: payload.pagination?.total || 0,
              totalPages: payload.pagination?.totalPages || 1,
              openCount: payload.meta?.openCount ?? 0,
            }
          },
        })

        setRequests(result.items)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
        setOpenCount(result.openCount)
      } catch (err) {
        setError(err.message)
        setRequests([])
        setTotalCount(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    },
    [currentPage, debouncedSearch, statusFilter],
  )

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  useEffect(() => {
    const nextRestore = location.state?.restore
    if (!nextRestore) return

    supportLoader.clear()

    if (nextRestore.searchQuery !== undefined) {
      setSearch(nextRestore.searchQuery)
      setDebouncedSearch(nextRestore.searchQuery)
    }
    if (nextRestore.statusFilter) setStatusFilter(nextRestore.statusFilter)
    if (nextRestore.page) setCurrentPage(nextRestore.page)

    const frame = requestAnimationFrame(() => {
      if (tableContainerRef.current && typeof nextRestore.scrollTop === 'number') {
        tableContainerRef.current.scrollTop = nextRestore.scrollTop
      }

      if (nextRestore.requestId) {
        setHighlightedId(nextRestore.requestId)
        const row = document.getElementById(`support-row-${nextRestore.requestId}`)
        row?.scrollIntoView({ block: 'center', behavior: 'auto' })
        window.setTimeout(() => setHighlightedId(''), 2500)
      }

      navigate('/support', { replace: true, state: {} })
    })

    return () => cancelAnimationFrame(frame)
  }, [location.state, navigate])

  const listStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const listEnd = Math.min(currentPage * PAGE_SIZE, totalCount)

  return (
    <div className="space-y-4">
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ticket, name, email, phone..."
            className={`${inputClass} lg:max-w-md`}
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  supportLoader.clear()
                  setStatusFilter(filter.id)
                  setCurrentPage(1)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === filter.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        {!loading && (
          <p className="mt-2 text-xs text-slate-500">
            {totalCount === 0
              ? 'No support requests match your filters.'
              : `Showing ${listStart}-${listEnd} of ${totalCount} requests`}
            {openCount > 0 ? ` · ${openCount} open` : ''}
          </p>
        )}
      </div>

      <AdminTable ref={tableContainerRef} maxHeight>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Ticket</th>
            <th className={thClass}>Customer</th>
            <th className={thHideSm}>Phone</th>
            <th className={thClass}>Status</th>
            <th className={thRightClass}>Action</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <TableLoader label="Loading support requests..." colSpan={5} className={tableEmptyClass} />
          ) : requests.length === 0 ? (
            <tr>
              <td colSpan={5} className={tableEmptyClass}>
                No support requests found.
              </td>
            </tr>
          ) : (
            requests.map((request) => (
              <tr
                key={request.id}
                id={`support-row-${request.id}`}
                className={`${tableRowClass} ${
                  highlightedId === request.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
                }`}
              >
                <td className={`${tdPrimaryClass} font-mono text-xs`}>{request.ticketNumber}</td>
                <td className={tdClass}>
                  <p className="font-medium text-slate-900">{request.name}</p>
                  <p className="break-all text-xs text-slate-500">{request.email}</p>
                  <p className="text-xs text-slate-500 sm:hidden">{request.phone || '—'}</p>
                </td>
                <td className={tdHideSm}>{request.phone || '—'}</td>
                <td className={tdClass}>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      statusStyles[request.status] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {STATUS_LABELS[request.status] || request.status?.replace('_', ' ') || '—'}
                  </span>
                </td>
                <td className={tdRightClass}>
                  <Link
                    to={`/support/${request.id}`}
                    state={{
                      fromList: {
                        searchQuery: search,
                        statusFilter,
                        page: currentPage,
                        scrollTop: tableContainerRef.current?.scrollTop ?? 0,
                        requestId: request.id,
                      },
                    }}
                    className={actionViewClass}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && totalCount > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not load support requests"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default Support
