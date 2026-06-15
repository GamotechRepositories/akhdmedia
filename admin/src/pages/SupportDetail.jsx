import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchSupportRequest, updateSupportRequest } from '../api/client'
import PageHeader from '../components/PageHeader'
import { cardClass, inputClass, primaryBtnClass, secondaryBtnClass } from '../components/ui/adminUi'

const SUBJECT_LABELS = {
  download: 'Download issue',
  license_email: 'License email',
  payment: 'Payment',
  license: 'License',
  other: 'Other',
}

const STATUS_OPTIONS = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
]

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

const SupportDetail = () => {
  const { id } = useParams()
  const [request, setRequest] = useState(null)
  const [status, setStatus] = useState('open')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchSupportRequest(id)
        const nextRequest = response.data.data?.request
        setRequest(nextRequest)
        setStatus(nextRequest?.status || 'open')
        setAdminNotes(nextRequest?.adminNotes || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    setNotice('')
    try {
      const response = await updateSupportRequest(id, { status, adminNotes })
      const nextRequest = response.data.data?.request
      setRequest(nextRequest)
      setNotice('Support request updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading support request...</p>
  }

  if (error && !request) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/support" className={secondaryBtnClass}>
          Back to Support
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          eyebrow="Customer care"
          title={`Ticket ${request.ticketNumber}`}
          description={`Submitted ${formatDate(request.createdAt)}`}
        />
        <Link to="/support" className={secondaryBtnClass}>
          Back to Support
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={`${cardClass} p-5`}>
          <h2 className="text-sm font-semibold text-slate-900">Customer details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{request.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd>
                <a href={`mailto:${request.email}`} className="font-medium text-slate-900 underline">
                  {request.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-medium text-slate-900">{request.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Order number</dt>
              <dd className="font-mono text-xs text-slate-900">{request.orderNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Issue type</dt>
              <dd className="font-medium text-slate-900">
                {SUBJECT_LABELS[request.subject] || request.subject}
              </dd>
            </div>
          </dl>
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="text-sm font-semibold text-slate-900">Admin actions</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adminNotes" className="mb-1.5 block text-sm font-medium text-slate-700">
                Internal notes
              </label>
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                rows={5}
                className={inputClass}
                placeholder="Notes for your team (not sent to customer)"
              />
            </div>

            {notice && <p className="text-sm text-emerald-700">{notice}</p>}
            {error && request && <p className="text-sm text-red-600">{error}</p>}

            <button type="button" onClick={handleSave} disabled={saving} className={primaryBtnClass}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      <div className={`${cardClass} p-5`}>
        <h2 className="text-sm font-semibold text-slate-900">Customer message</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{request.message}</p>
      </div>
    </div>
  )
}

export default SupportDetail
