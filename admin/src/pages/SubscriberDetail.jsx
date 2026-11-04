import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchAdminSubscriber, updateAdminSubscriber } from '../api/client'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/ui/PageLoader'

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

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

const formatDateForInput = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

export default function SubscriberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(ADMIN_PERMISSIONS.SUBSCRIPTIONS_WRITE)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subscriber, setSubscriber] = useState(null)

  // Edit form states
  const [editTotalQuota, setEditTotalQuota] = useState('')
  const [editRemainingQuota, setEditRemainingQuota] = useState('')
  const [editStatus, setEditStatus] = useState('active')
  const [editReason, setEditReason] = useState('')
  const [editAmountPaid, setEditAmountPaid] = useState(0)
  const [editPaymentStatus, setEditPaymentStatus] = useState('paid')
  const [editPaymentProvider, setEditPaymentProvider] = useState('razorpay')
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchAdminSubscriber(id)
      const sub = res.data?.data?.subscriber || res.data?.subscriber
      if (!sub) {
        throw new Error('Subscriber not found')
      }
      setSubscriber(sub)
      setEditTotalQuota(sub.videoQuota ?? 20)
      setEditRemainingQuota(sub.videoQuotaRemaining ?? 20)
      setEditStatus(sub.status || 'active')
      setEditReason(sub.adminReason || '')
      setEditAmountPaid(sub.amountPaid !== undefined && sub.amountPaid !== null ? sub.amountPaid : sub.price || 0)
      setEditPaymentStatus(sub.paymentStatus || 'paid')
      setEditPaymentProvider(sub.paymentProvider || 'razorpay')
      setEditWhatsappNumber(sub.whatsappNumber || sub.userId?.phone || '')
      setEditEndDate(formatDateForInput(sub.endDate))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load subscriber details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    if (!canWrite) return
    setSaving(true)
    setSaveSuccess('')
    try {
      const res = await updateAdminSubscriber(id, {
        videoQuota: Number(editTotalQuota),
        videoQuotaRemaining: Number(editRemainingQuota),
        status: editStatus,
        adminReason: editReason,
        amountPaid: Number(editAmountPaid),
        paymentStatus: editPaymentStatus,
        paymentProvider: editPaymentProvider,
        whatsappNumber: editWhatsappNumber,
        ...(editEndDate ? { endDate: new Date(editEndDate) } : {}),
      })
      const updated = res.data?.data?.subscriber || res.data?.subscriber
      if (updated) {
        setSubscriber((prev) => ({ ...prev, ...updated }))
      }
      setSaveSuccess('Subscriber quota, lifecycle & status updated successfully!')
      setTimeout(() => setSaveSuccess(''), 5000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update subscriber')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLoader message="Loading subscriber details & claim records..." />
  }

  if (error || !subscriber) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/subscriptions')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
        >
          ← Back to Subscriptions
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-bold text-base">Error Loading Subscriber</p>
          <p className="mt-1">{error || 'Subscriber record not found.'}</p>
        </div>
      </div>
    )
  }

  const quotaTotal = subscriber.videoQuota ?? 0
  const quotaRemaining = subscriber.videoQuotaRemaining ?? 0
  const quotaUsed = Math.max(0, quotaTotal - quotaRemaining)

  const now = new Date()
  const end = new Date(subscriber.endDate)
  const diffTime = end - now
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  const isExpired = subscriber.status === 'expired' || diffTime <= 0

  const downloadedVideos = subscriber.downloadedVideos || []
  const totalClaimedValue = downloadedVideos.reduce(
    (sum, v) => sum + (Number(v.originalPrice) || 0),
    0
  )

  const isFree = subscriber.paymentProvider === 'free' || subscriber.amountPaid === 0
  const isPaid = subscriber.paymentStatus === 'paid'

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link to="/subscriptions" className="hover:text-gray-900 font-medium">
            Subscriptions
          </Link>
          <span>/</span>
          <span className="text-gray-400">Subscribers</span>
          <span>/</span>
          <span className="font-semibold text-gray-900 truncate max-w-xs">
            {subscriber.userId?.name || subscriber.userId?.email || 'Details'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/subscriptions')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition"
        >
          ← Back to All Subscribers
        </button>
      </div>

      {/* Header Banner Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-tr from-gray-900 to-gray-700 flex items-center justify-center text-xl font-bold text-white shadow-md">
              {subscriber.userId?.name ? subscriber.userId.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">
                  {subscriber.userId?.name || 'Customer'}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    subscriber.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : subscriber.status === 'on_hold'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : subscriber.status === 'under_review'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : subscriber.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : subscriber.status === 'expired'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                  }`}
                >
                  ● {subscriber.status === 'on_hold'
                    ? 'ON HOLD'
                    : subscriber.status === 'under_review'
                    ? 'UNDER REVIEW'
                    : subscriber.status === 'cancelled'
                    ? 'CANCELLED'
                    : subscriber.status.toUpperCase()}
                </span>
                {subscriber.cancelAtPeriodEnd && (
                  <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                    AutoPay Off
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>✉ {subscriber.userId?.email || '—'}</span>
                {subscriber.userId?.phone && <span>📞 {subscriber.userId.phone}</span>}
                {subscriber.whatsappNumber && (
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    💬 WA: {subscriber.whatsappNumber}
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">
                  ⚡ {subscriber.planSnapshot?.name || subscriber.planId?.name || 'Subscription Plan'}
                </span>
                <span className="text-xs text-gray-400 capitalize">
                  {subscriber.planSnapshot?.interval || 'monthly'} cycle
                </span>
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
            <span className="text-xs text-gray-400">Total Billed / Value</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {formatCurrency(subscriber.amountPaid || subscriber.price || 0)}
            </span>
            <div className="mt-1">
              {isFree ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  ★ Free / Admin Gift
                </span>
              ) : isPaid ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                  ✓ Paid {subscriber.paymentProvider === 'razorpay' ? '(Online)' : subscriber.paymentProvider ? `(${subscriber.paymentProvider})` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                  {subscriber.paymentStatus || 'Pending'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Video Quota */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Video Downloads</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {quotaRemaining} <span className="text-sm font-normal text-gray-400">/ {quotaTotal} left</span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full transition-all ${
                quotaRemaining <= 2 ? 'bg-red-500' : quotaRemaining <= 5 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${quotaTotal > 0 ? (quotaRemaining / quotaTotal) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-gray-500 font-medium">
            {quotaUsed} clips downloaded · {quotaRemaining} quota remaining
          </p>
        </div>

        {/* Card 2: Validity & Expiry */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Remaining</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                isExpired
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : daysLeft <= 5
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {isExpired ? 'Expired' : `${daysLeft} Days Left`}
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-600 font-medium">
            Expires: <span className="text-gray-900 font-semibold">{formatDate(subscriber.endDate)}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Started: {formatDate(subscriber.startDate)}
          </p>
        </div>

        {/* Card 3: Accessed Videos Count */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content Claimed</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {downloadedVideos.length}{' '}
            <span className="text-sm font-normal text-gray-400">
              {downloadedVideos.length === 1 ? 'video' : 'videos'}
            </span>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {downloadedVideos.length > 0
              ? 'Claimed with full master license'
              : 'No clips claimed yet'}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-600 font-medium">
            Daily access enabled
          </p>
        </div>

        {/* Card 4: Original Market Value of Accessed Videos */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Video Value</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(totalClaimedValue)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Original single-clip purchase value
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Covered by active membership
          </p>
        </div>
      </div>

      {/* Main Content Grid: Left Form (Adjust Quota & Status) | Right (Claimed Videos) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Adjust Quota & Status Controls (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Adjust Quota & Status</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Update subscriber download credits, extend validity, or manage lifecycle.
            </p>
          </div>

          {saveSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              ✓ {saveSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            {/* Quota Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Total Plan Quota</label>
                <input
                  type="number"
                  min="1"
                  value={editTotalQuota}
                  onChange={(e) => setEditTotalQuota(e.target.value)}
                  disabled={!canWrite}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Quota Remaining</label>
                <input
                  type="number"
                  min="0"
                  value={editRemainingQuota}
                  onChange={(e) => setEditRemainingQuota(e.target.value)}
                  disabled={!canWrite}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none font-bold text-blue-600"
                  required
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700">Customer WhatsApp Number</label>
              <input
                type="text"
                value={editWhatsappNumber}
                onChange={(e) => setEditWhatsappNumber(e.target.value)}
                placeholder="+91..."
                disabled={!canWrite}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none font-semibold text-emerald-900"
              />
              <p className="mt-0.5 text-[11px] text-gray-400">
                Used for dedicated daily editorial updates delivery group.
              </p>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700">Extend / Change Expiry Date</label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                disabled={!canWrite}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
              <p className="mt-0.5 text-[11px] text-gray-400">
                Current expiry: {formatDate(subscriber.endDate)}
              </p>
            </div>

            {/* Amount Paid & Payment Details */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 space-y-3">
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Payment Record</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600">Amount Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editAmountPaid}
                    onChange={(e) => setEditAmountPaid(e.target.value)}
                    disabled={!canWrite}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-gray-900 focus:outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600">Payment Status</label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    disabled={!canWrite}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-gray-900 focus:outline-none"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending / Unpaid</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600">Payment Provider</label>
                <select
                  value={editPaymentProvider}
                  onChange={(e) => {
                    setEditPaymentProvider(e.target.value)
                    if (e.target.value === 'free') {
                      setEditAmountPaid(0)
                      setEditPaymentStatus('paid')
                    }
                  }}
                  disabled={!canWrite}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-gray-900 focus:outline-none"
                >
                  <option value="free">Free / Complimentary (₹0)</option>
                  <option value="admin_manual">Admin Manual (Cash / Offline / Direct)</option>
                  <option value="razorpay">Online (Razorpay)</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700">Lifecycle Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                disabled={!canWrite}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm focus:border-gray-900 focus:outline-none font-semibold"
              >
                <option value="active">Active (Full Access)</option>
                <option value="on_hold">On Hold (Pause & Protect Days)</option>
                <option value="under_review">Under Review (Lock Downloads, Days Count)</option>
                <option value="cancelled">Cancelled (Terminate Access)</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Status Notices */}
            {['on_hold', 'under_review', 'cancelled'].includes(editStatus) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 space-y-1">
                <span className="font-bold">Mode Notice:</span>
                <p className="font-medium text-[11px]">
                  {editStatus === 'on_hold' &&
                    'On Hold Mode: Downloads are paused. The duration spent on hold is protected and will be automatically credited to the expiry date when resumed.'}
                  {editStatus === 'under_review' &&
                    'Under Review Mode: Downloads are locked for investigation. Validity days continue to count down normally (no extra days added).'}
                  {editStatus === 'cancelled' &&
                    'Cancelled Mode: Subscription is terminated immediately and video downloads are revoked.'}
                </p>
              </div>
            )}

            {/* Admin Reason */}
            <div>
              <label className="block text-xs font-semibold text-gray-700">Admin Reason / Internal Note</label>
              <textarea
                rows={2}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Reason for modifying quota, hold, or access notes..."
                disabled={!canWrite}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-gray-900 focus:outline-none"
              />
            </div>

            {canWrite && (
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-gray-900 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition shadow-sm"
              >
                {saving ? 'Saving Changes...' : 'Save & Update Subscriber'}
              </button>
            )}
          </form>
        </div>

        {/* Right Column: Claimed / Accessed Videos (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Accessed Videos Under This Plan ({downloadedVideos.length})
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Clips downloaded using this subscription's quota with original rates.
              </p>
            </div>
            {downloadedVideos.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                Total Value: {formatCurrency(totalClaimedValue)}
              </span>
            )}
          </div>

          {downloadedVideos.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xl text-gray-400">
                🎬
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">No Videos Claimed Yet</p>
              <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                When this customer claims or downloads master footage from their {quotaTotal} quota credits, each clip and its original price will be listed here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {downloadedVideos.map((video, idx) => (
                <div key={video._id || idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200 relative">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                          🎬 No Preview
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 text-[9px] font-bold text-white uppercase">
                        {video.imageSize ? video.imageSize.slice(0, 6) : '4K'}
                      </span>
                    </div>

                    {/* Clip Info */}
                    <div>
                      <p className="text-sm font-bold text-gray-900 line-clamp-1">
                        {video.name || 'Editorial Video Clip'}
                      </p>
                      {video.clipId && (
                        <p className="text-[11px] font-mono font-medium text-gray-500">
                          ID: {video.clipId}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                          {video.imageSize || '4K-UHD RAW Master'}
                        </span>
                        {video.licenseNumber && (
                          <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-semibold text-blue-700 border border-blue-100" title="License Number">
                            Lic: {video.licenseNumber}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-gray-400">
                        Claimed on: {formatDate(video.claimedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Price & Order */}
                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-50">
                    <div>
                      <span className="text-[11px] text-gray-400 block">Original Price</span>
                      <span className="text-base font-bold text-gray-900">
                        {formatCurrency(video.originalPrice)}
                      </span>
                    </div>
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 mt-1">
                      Included with Plan (₹0)
                    </span>
                    {video.orderNumber && (
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        Ref: {video.orderNumber}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

