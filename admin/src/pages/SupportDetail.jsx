import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchOrders, fetchSupportRequest, replySupportRequest, updateSupportRequest } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import SupportConfirmationEmailPreview from '../components/SupportConfirmationEmailPreview'
import SupportReplyEmailPreview from '../components/SupportReplyEmailPreview'
import { cardClass, inputClass, primaryBtnClass, secondaryBtnClass } from '../components/ui/adminUi'
import PageLoader from '../components/ui/PageLoader'

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

const getEmailHistory = (request) => {
  const replies = Array.isArray(request?.replies) ? request.replies : []
  const hasConfirmation = replies.some((entry) => entry.kind === 'confirmation')

  const items = hasConfirmation
    ? [...replies]
    : [
        ...replies,
        {
          kind: 'confirmation',
          message: '',
          sentAt: request.createdAt,
        },
      ]

  return items.sort(
    (left, right) => new Date(right.sentAt).getTime() - new Date(left.sentAt).getTime(),
  )
}

const EMAIL_KIND_LABELS = {
  confirmation: 'Request received confirmation',
  admin_reply: 'Support team reply',
}

const SupportDetail = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const backState = location.state?.fromList
    ? { restore: location.state.fromList }
    : undefined
  const [request, setRequest] = useState(null)
  const [status, setStatus] = useState('open')
  const [replyMessage, setReplyMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const [error, setError] = useState('')
  const [errorDismissed, setErrorDismissed] = useState(false)
  const [notice, setNotice] = useState('')
  const [showReplySuccess, setShowReplySuccess] = useState(false)
  const [matchedOrder, setMatchedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderModalMessage, setOrderModalMessage] = useState('')

  const findOrderByNumber = (orders, orderNumber = '') => {
    const orderQuery = orderNumber.trim().toLowerCase()
    if (!orderQuery) return null

    return (
      orders.find((order) => {
        const fullNumber = (order.orderNumber || '').toLowerCase()
        const shortNumber = fullNumber.slice(-8)

        return (
          fullNumber === orderQuery ||
          shortNumber === orderQuery ||
          fullNumber.includes(orderQuery) ||
          orderQuery.includes(shortNumber)
        )
      }) || null
    )
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchSupportRequest(id)
        const nextRequest = response.data.data?.request
        setRequest(nextRequest)
        setStatus(nextRequest?.status || 'open')

        if (nextRequest?.orderNumber?.trim()) {
          const ordersResponse = await fetchOrders()
          const orders = ordersResponse.data.data?.orders || []
          setMatchedOrder(findOrderByNumber(orders, nextRequest.orderNumber))
        } else {
          setMatchedOrder(null)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  useEffect(() => {
    setErrorDismissed(false)
  }, [id])

  const handleOpenMatchedOrder = () => {
    const orderNumber = request.orderNumber?.trim()

    if (!orderNumber) {
      setOrderModalMessage('Order ID is empty. The customer did not add an order number in this request.')
      setShowOrderModal(true)
      return
    }

    if (!matchedOrder) {
      setOrderModalMessage('Order ID is wrong or not found. Please verify the order number and try again.')
      setShowOrderModal(true)
      return
    }

    navigate(`/orders/${matchedOrder.id}`)
  }

  const handleSave = async () => {
    setSaving(true)
    setNotice('')
    try {
      const response = await updateSupportRequest(id, { status })
      const nextRequest = response.data.data?.request
      setRequest(nextRequest)
      setNotice('Support request updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSendReply = async () => {
    const trimmedReply = replyMessage.trim()

    if (trimmedReply.length < 5) {
      setError('Reply must be at least 5 characters.')
      return
    }

    setSendingReply(true)
    setNotice('')
    try {
      const response = await replySupportRequest(id, {
        replyMessage: trimmedReply,
        status,
      })
      const nextRequest = response.data.data?.request
      setRequest(nextRequest)
      setStatus(nextRequest?.status || status)
      setReplyMessage('')
      setShowReplySuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSendingReply(false)
    }
  }

  if (loading) {
    return <PageLoader label="Loading support request..." />
  }

  if (error && !request) {
    return (
      <div className="space-y-4">
        <AdminAlertModal
          open={!errorDismissed}
          title="Could not load support request"
          message={error}
          onClose={() => setErrorDismissed(true)}
        />
        <Link to="/support" state={backState} className={secondaryBtnClass}>
          Back to Support
        </Link>
      </div>
    )
  }

  const emailHistory = getEmailHistory(request)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
          <Link to="/support" state={backState} className={secondaryBtnClass}>
            Back to Support
          </Link>
          <Link
            to="/orders"
            state={{
              restore: {
                customerEmail: request.email,
              },
            }}
            className={secondaryBtnClass}
          >
            User orders
          </Link>
          <button type="button" onClick={handleOpenMatchedOrder} className={primaryBtnClass}>
            Open matched order
          </button>
      </div>

      <div className={`${cardClass} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                statusStyles[request.status] || 'bg-slate-100 text-slate-600'
              }`}
            >
              {request.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-slate-500">Submitted {formatDate(request.createdAt)}</p>
        </div>
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
              {request.orderNumber && (
                <Link
                  to="/orders"
                  state={{ restore: { searchQuery: request.orderNumber } }}
                  className="mt-1 inline-block text-xs font-semibold text-slate-900 underline"
                >
                  Search in orders
                </Link>
              )}
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
          <h2 className="text-sm font-semibold text-slate-900">Customer message</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{request.message}</p>
        </div>
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

          {notice && <p className="text-sm text-emerald-700">{notice}</p>}

          <button type="button" onClick={handleSave} disabled={saving} className={primaryBtnClass}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className={`${cardClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Reply to customer</h2>
            <p className="mt-1 text-sm text-slate-500">
              Type your solution or update below. It will be emailed to {request.email} in a professional format.
            </p>
          </div>
          <p className="text-xs font-medium text-slate-500">Ticket {request.ticketNumber}</p>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="replyMessage" className="mb-1.5 block text-sm font-medium text-slate-700">
              Your reply
            </label>
            <textarea
              id="replyMessage"
              value={replyMessage}
              onChange={(event) => setReplyMessage(event.target.value)}
              rows={6}
              className={inputClass}
              placeholder="Explain the solution, next steps, or what the customer should do..."
            />
          </div>

          <button
            type="button"
            onClick={handleSendReply}
            disabled={sendingReply || !replyMessage.trim()}
            className={primaryBtnClass}
          >
            {sendingReply ? 'Sending...' : 'Send reply to customer'}
          </button>
        </div>
      </div>

      <div className={`${cardClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Email history</h2>
            <p className="mt-1 text-sm text-slate-500">
              All emails sent to the customer for this request.
            </p>
          </div>
          <p className="text-xs font-medium text-slate-500">
            {emailHistory.length} {emailHistory.length === 1 ? 'email' : 'emails'}
          </p>
        </div>

        {emailHistory.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No emails sent yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {emailHistory.map((entry, index) => (
              <div key={`${entry.kind}-${entry.sentAt}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {EMAIL_KIND_LABELS[entry.kind] || 'Email'} sent to {request.email}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-slate-500">{formatDate(entry.sentAt)}</p>
                </div>
                {entry.kind === 'confirmation' ? (
                  <SupportConfirmationEmailPreview request={request} />
                ) : (
                  <SupportReplyEmailPreview request={request} replyMessage={entry.message} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-center text-lg font-bold text-slate-900">Order not available</h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">{orderModalMessage}</p>
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              className={`${primaryBtnClass} mt-6 w-full`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <AdminAlertModal
        open={Boolean(error) && Boolean(request)}
        title="Could not continue"
        message={error}
        onClose={() => setError('')}
      />

      <AdminAlertModal
        open={showReplySuccess}
        title="Reply sent successfully"
        message={`Your response has been emailed to ${request.email}.`}
        variant="success"
        onClose={() => setShowReplySuccess(false)}
      />
    </div>
  )
}

export default SupportDetail
