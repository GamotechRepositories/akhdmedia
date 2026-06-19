import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchSupportRequests } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import { cardClass, inputClass } from '../components/ui/adminUi'

const PAGE_SIZE = 50

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
]

const SUBJECT_LABELS = {
  download: 'Download issue',
  license_email: 'License email',
  payment: 'Payment',
  license: 'License',
  other: 'Other',
}

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In progress',
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
  const restore = location.state?.restore

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(restore?.searchQuery || '')
  const [statusFilter, setStatusFilter] = useState(restore?.statusFilter || 'all')
  const [highlightedId, setHighlightedId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchSupportRequests()
        setRequests(response.data.data?.requests || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    const nextRestore = location.state?.restore
    if (!nextRestore || loading) return

    if (nextRestore.searchQuery !== undefined) setSearch(nextRestore.searchQuery)
    if (nextRestore.statusFilter) setStatusFilter(nextRestore.statusFilter)

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
  }, [loading, location.state, navigate])

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return requests.filter((request) => {
      if (statusFilter !== 'all' && request.status !== statusFilter) return false
      if (!query) return true

      const haystack = [
        request.ticketNumber,
        request.name,
        request.email,
        request.phone,
        request.orderNumber,
        request.message,
        SUBJECT_LABELS[request.subject],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [requests, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE))
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredRequests.slice(start, start + PAGE_SIZE)
  }, [filteredRequests, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const openCount = requests.filter((request) => request.status === 'open').length

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
                onClick={() => setStatusFilter(filter.id)}
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
      </div>

      {loading && <p className="text-sm text-slate-500">Loading support requests...</p>}

      {!loading && !error && (
        <div ref={tableContainerRef} className={`${cardClass} max-h-[70vh] overflow-x-auto overflow-y-auto`}>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No support requests found.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((request) => (
                  <tr
                    key={request.id}
                    id={`support-row-${request.id}`}
                    className={`hover:bg-slate-50/80 ${
                      highlightedId === request.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                      {request.ticketNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{request.name}</p>
                      <p className="text-xs text-slate-500">{request.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{request.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          statusStyles[request.status] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {STATUS_LABELS[request.status] || request.status?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/support/${request.id}`}
                        state={{
                          fromList: {
                            searchQuery: search,
                            statusFilter,
                            scrollTop: tableContainerRef.current?.scrollTop ?? 0,
                            requestId: request.id,
                          },
                        }}
                        className="inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        View request
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && filteredRequests.length > 0 && (
        <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <p className="text-sm text-slate-600">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredRequests.length)} of{' '}
            {filteredRequests.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
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
