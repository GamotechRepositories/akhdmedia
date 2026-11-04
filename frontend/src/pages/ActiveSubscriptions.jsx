import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageLoader from '../components/ui/PageLoader'
import { subscriptionAPI } from '../services/subscriptionApi'

const ActiveSubscriptions = () => {
  const navigate = useNavigate()
  const [subData, setSubData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Cancellation modal state
  const [cancelModalPlan, setCancelModalPlan] = useState(null)
  const [cancellingPlanId, setCancellingPlanId] = useState(null)
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const fetchMySubscriptions = async () => {
    try {
      setLoading(true)
      const res = await subscriptionAPI.getMySubscription()
      setSubData(res.data?.subscription || null)
    } catch (err) {
      console.error('Failed to load subscriptions:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load active subscriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMySubscriptions()
  }, [])

  const handleOpenCancelModal = (plan) => {
    setCancelModalPlan(plan)
    setCancelSuccess(false)
    setCancelError('')
  }

  const handleCloseCancelModal = () => {
    if (cancellingPlanId) return
    setCancelModalPlan(null)
    setCancelSuccess(false)
    setCancelError('')
  }

  const handleConfirmCancel = async () => {
    if (!cancelModalPlan) return
    setCancellingPlanId(cancelModalPlan.id || cancelModalPlan.planId)
    setCancelError('')
    try {
      await subscriptionAPI.cancelSubscription(cancelModalPlan.id || cancelModalPlan.planId)
      // Update local state
      setSubData((prev) => {
        if (!prev) return null
        const updatedPlans = (prev.plans || []).map((p) =>
          (p.id === cancelModalPlan.id || p.planId === cancelModalPlan.planId || p.name === cancelModalPlan.name)
            ? { ...p, cancelAtPeriodEnd: true }
            : p,
        )
        const isAllCancelled = updatedPlans.length > 0 ? updatedPlans.every((p) => p.cancelAtPeriodEnd) : true
        return {
          ...prev,
          plans: updatedPlans,
          cancelAtPeriodEnd: isAllCancelled,
        }
      })
      setCancelSuccess(true)
    } catch (err) {
      setCancelError(err.response?.data?.message || err.message || 'Failed to cancel AutoPay. Please try again.')
    } finally {
      setCancellingPlanId(null)
    }
  }

  // Build the list of active plans to display
  const plansList =
    subData?.plans && subData.plans.length > 0
      ? subData.plans
      : subData
      ? [
          {
            id: subData.id,
            planId: subData.planId,
            name: subData.planName,
            interval: subData.interval,
            price: subData.price,
            videoQuota: subData.videoQuota,
            videoQuotaRemaining: subData.videoQuotaRemaining,
            usedQuota: subData.usedQuota || 0,
            startDate: subData.startDate,
            endDate: subData.endDate,
            cancelAtPeriodEnd: subData.cancelAtPeriodEnd,
            status: subData.status,
          },
        ]
      : []

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Navigation Breadcrumb & Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
              <Link to="/profile" className="hover:text-neutral-900 transition flex items-center gap-1">
                <span>←</span>
                <span>Profile</span>
              </Link>
              <span>/</span>
              <span className="text-neutral-900">Active Subscriptions</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Active Subscriptions
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              Manage your active editorial memberships, download tax invoices, track quotas, and manage renewals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/subscriptions"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-neutral-800 shadow-sm hover:bg-neutral-50 hover:border-neutral-400 transition"
            >
              <span>+ Explore All Plans</span>
            </Link>
          </div>
        </div>

        {loading && <PageLoader className="mt-12" minHeight="" />}

        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && plansList.length === 0 && (
          <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-10 sm:p-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900">No Active Subscriptions</h3>
            <p className="mt-1 text-sm text-neutral-500 max-w-md mx-auto">
              You currently do not have any active editorial media subscriptions. Choose a plan to unlock RAW 4K UHD editorial video downloads.
            </p>
            <div className="mt-6">
              <Link
                to="/subscriptions"
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white hover:bg-black transition shadow-sm"
              >
                <span>Browse Subscription Plans</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && plansList.length > 0 && (
          <div className="space-y-6">


            {/* Individual Subscription Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plansList.map((plan, index) => {
                const daysLeft = Math.max(
                  0,
                  Math.ceil((new Date(plan.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                )
                const isAutoPayCancelled = Boolean(plan.cancelAtPeriodEnd)
                const planId = plan.id || plan._id || `plan-${index}`
                const subPrice = Number(plan.price || 0)

                return (
                  <div
                    key={planId}
                    className="flex flex-col justify-between rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-7 shadow-sm transition hover:shadow-md"
                  >
                    <div>
                      {/* Top Plan Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                            AKHD MEDIA &amp; CO
                          </p>
                          <h3 className="mt-1 text-lg font-extrabold text-neutral-900 leading-snug">
                            {plan.name}
                          </h3>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isAutoPayCancelled
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isAutoPayCancelled ? 'Cycle Expiring' : 'Active'}
                        </span>
                      </div>

                      {/* Price & Billing */}
                      <div className="mb-4 pb-3 border-b border-neutral-100 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-neutral-900">
                          {subPrice > 0 ? `₹${subPrice.toLocaleString('en-IN')}` : 'Included Plan'}
                        </span>
                        {subPrice > 0 && (
                          <span className="text-xs text-neutral-500 font-medium">
                            / {plan.interval === 'yearly' ? 'year' : 'month'}
                          </span>
                        )}
                      </div>

                      {/* Quota Row */}
                      <div className="mb-4 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5 text-xs text-neutral-600">
                        <span className="font-semibold uppercase tracking-wider text-[11px] text-neutral-500">
                          Download Quota
                        </span>
                        <span className="font-bold text-neutral-900">
                          {plan.videoQuotaRemaining} of {plan.videoQuota} remaining
                        </span>
                      </div>

                      {/* Key-Value Details */}
                      <div className="space-y-2 rounded-2xl bg-neutral-50/70 p-4 text-xs text-neutral-600">
                        <div className="flex items-center justify-between">
                          <span>Used</span>
                          <span className="font-semibold text-neutral-900">{plan.usedQuota || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Days left</span>
                          <span className="font-semibold text-neutral-900">{daysLeft}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Expires</span>
                          <span className="font-semibold text-neutral-900">
                            {new Date(plan.endDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Billing cycle</span>
                          <span className="font-medium text-neutral-800 capitalize">
                            {plan.interval === 'yearly' ? 'Yearly' : 'Monthly'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>AutoPay status</span>
                          <span className={`font-medium ${isAutoPayCancelled ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {isAutoPayCancelled ? 'Cancelled for next cycle' : 'Active renewal'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Cycle start</span>
                          <span className="font-medium text-neutral-800">
                            {new Date(plan.startDate || Date.now()).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 space-y-2.5">
                      {Boolean(plan.id || plan._id) && (
                        <a
                          href={`${import.meta.env.VITE_API_URL || '/api'}/subscriptions/invoice-pdf/${plan.id || plan._id}`}
                          download={`subscription-tax-invoice-${plan.id || plan._id || 'receipt'}.pdf`}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 px-4 text-center text-xs font-bold text-white hover:bg-black transition active:scale-[0.99] cursor-pointer shadow-sm"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>Download Invoice</span>
                        </a>
                      )}

                      <Link
                        to="/categories"
                        className="block w-full rounded-xl border border-neutral-200 bg-white py-2 px-4 text-center text-xs font-semibold text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 transition"
                      >
                        Browse Videos
                      </Link>

                      {/* Cancel AutoPay link for this specific plan */}
                      <div className="pt-3 text-center border-t border-neutral-100">
                        {!isAutoPayCancelled ? (
                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(plan)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition inline-flex items-center gap-1 cursor-pointer"
                            title="Stop automatic renewal charges for next billing cycle"
                          >
                            <span>✕</span>
                            <span>Cancel AutoPay for this plan</span>
                          </button>
                        ) : (
                          <p className="text-xs text-neutral-500 font-normal">
                            AutoPay cancelled for next cycle · Active until{' '}
                            {new Date(plan.endDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cancel AutoPay Confirmation Modal */}
      {cancelModalPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleCloseCancelModal}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={Boolean(cancellingPlanId)}
              onClick={handleCloseCancelModal}
              className="absolute right-5 top-5 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition disabled:opacity-40"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {cancelSuccess ? (
              <div className="py-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  AKHD Media &amp; Co · AutoPay Updated
                </p>
                <h3 className="mt-2 text-base font-bold text-neutral-900">
                  AutoPay Cancelled for Next Cycle
                </h3>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  Your mandate will <strong>not</strong> be charged for <strong>{cancelModalPlan.name}</strong> on your next cycle. Your remaining{' '}
                  <strong>{cancelModalPlan.videoQuotaRemaining} video downloads</strong> and access remain 100% active until{' '}
                  <strong>
                    {new Date(cancelModalPlan.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </strong>.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleCloseCancelModal}
                    className="w-full rounded-xl bg-neutral-900 py-2.5 px-4 text-xs font-bold text-white hover:bg-black transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                      Manage Subscription
                    </p>
                    <h3 className="text-base font-bold text-neutral-900">
                      Cancel AutoPay Renewal?
                    </h3>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-neutral-50 p-3.5 text-xs text-neutral-600 space-y-2">
                  <p className="font-semibold text-neutral-900">{cancelModalPlan.name}</p>
                  <p>
                    • Your payment method will <strong>not be charged</strong> on your next renewal date.
                  </p>
                  <p>
                    • You keep your remaining <strong>{cancelModalPlan.videoQuotaRemaining} video downloads</strong> until{' '}
                    <strong>
                      {new Date(cancelModalPlan.endDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </strong>.
                  </p>
                </div>

                {cancelError && (
                  <p className="mt-3 text-xs text-rose-600 font-medium">{cancelError}</p>
                )}

                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={Boolean(cancellingPlanId)}
                    onClick={handleCloseCancelModal}
                    className="rounded-xl border border-neutral-200 bg-white py-2 px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    Keep AutoPay
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(cancellingPlanId)}
                    onClick={handleConfirmCancel}
                    className="rounded-xl bg-rose-600 py-2 px-4 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    {cancellingPlanId ? 'Cancelling...' : 'Yes, Cancel AutoPay'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ActiveSubscriptions

