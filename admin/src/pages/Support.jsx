import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSupportRequests } from '../api/client'
import PageHeader from '../components/PageHeader'
import { cardClass, inputClass } from '../components/ui/adminUi'

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

const statusStyles = {
  open: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
}

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const Support = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const openCount = requests.filter((request) => request.status === 'open').length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer care"
        title="Support Requests"
        description={`${requests.length} total · ${openCount} open`}
      />

      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ticket, name, email, order..."
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
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className={`${cardClass} overflow-x-auto`}>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No support requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 align-top">
                      <Link to={`/support/${request.id}`} className="font-mono text-xs font-semibold text-slate-900 hover:underline">
                        {request.ticketNumber}
                      </Link>
                      {request.orderNumber && (
                        <p className="mt-1 text-[11px] text-slate-500">Order: {request.orderNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-slate-900">{request.name}</p>
                      <p className="text-xs text-slate-500">{request.email}</p>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">
                      {request.phone || '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-600">
                      {SUBJECT_LABELS[request.subject] || request.subject}
                    </td>
                    <td className="max-w-xs px-4 py-3 align-top">
                      <p className="line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">
                        {request.message || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusStyles[request.status] || 'bg-slate-100 text-slate-600'}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-500">{formatDate(request.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Support
