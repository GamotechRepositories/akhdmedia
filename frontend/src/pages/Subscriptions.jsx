import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { subscriptionAPI } from '../services/subscriptionApi'
import { useAuth } from '../context/AuthContext'
import { openRazorpayCheckout } from '../utils/razorpay'
import PageLoader from '../components/ui/PageLoader'
import { BRAND } from '../config/brand'

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0)

// Single, consistent checkmark icon for all plan features
const FeatureIcon = () => (
  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100 mt-0.5">
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  </div>
)

const Subscriptions = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedInterval, setSelectedInterval] = useState('all') // 'all' | 'monthly' | 'yearly'
  const [processingPlanId, setProcessingPlanId] = useState(null)
  const [activeSubscription, setActiveSubscription] = useState(null)
  const [showActiveDetailsModal, setShowActiveDetailsModal] = useState(false)
  const [cancellingPlanId, setCancellingPlanId] = useState(null)
  const [cancelModalPlan, setCancelModalPlan] = useState(null)
  const [cancelModalSuccess, setCancelModalSuccess] = useState(false)
  const [cancelModalError, setCancelModalError] = useState('')

  const handleOpenCancelModal = (plan) => {
    setCancelModalPlan(plan)
    setCancelModalSuccess(false)
    setCancelModalError('')
  }

  const handleCloseCancelModal = () => {
    if (cancellingPlanId) return
    setCancelModalPlan(null)
    setCancelModalSuccess(false)
    setCancelModalError('')
  }

  const handleConfirmCancelAutoPay = async () => {
    if (!cancelModalPlan) return
    setCancellingPlanId(cancelModalPlan._id)
    setCancelModalError('')
    try {
      await subscriptionAPI.cancelSubscription(cancelModalPlan._id)
      setActiveSubscription((prev) => {
        if (!prev) return null
        const updatedPlans = (prev.plans || []).map((p) =>
          p.planId === cancelModalPlan._id || p.name === cancelModalPlan.name
            ? { ...p, cancelAtPeriodEnd: true }
            : p
        )
        const isAllCancelled =
          updatedPlans.length > 0 ? updatedPlans.every((p) => p.cancelAtPeriodEnd) : true
        return {
          ...prev,
          plans: updatedPlans,
          cancelAtPeriodEnd: isAllCancelled,
        }
      })
      setCancelModalSuccess(true)
    } catch (err) {
      setCancelModalError(
        err.response?.data?.message || err.message || 'Failed to cancel AutoPay. Please try again.'
      )
    } finally {
      setCancellingPlanId(null)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [plansRes, mySubRes] = await Promise.all([
          subscriptionAPI.getPublicPlans(),
          isAuthenticated ? subscriptionAPI.getMySubscription().catch(() => null) : null,
        ])

        setPlans(plansRes.data?.plans || [])
        if (mySubRes?.data?.hasActiveSubscription) {
          setActiveSubscription(mySubRes.data.subscription)
        }
      } catch (err) {
        setError(err.message || 'Failed to load subscription plans')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated])

  const filteredPlans =
    selectedInterval === 'all'
      ? plans
      : plans.filter((p) => (p.interval || 'monthly') === selectedInterval)

  const handleSelectPlan = (plan) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: `/subscriptions/checkout?planId=${plan._id}` },
      })
      return
    }

    // Do not initiate checkout if user already has this active plan
    const isAlreadyActive =
      activeSubscription &&
      (activeSubscription.planName === plan.name ||
       activeSubscription.planName?.includes(plan.name) ||
       activeSubscription.plans?.some((p) => p.name === plan.name || p.id === plan._id))

    if (isAlreadyActive) {
      navigate('/profile')
      return
    }

    // Redirect to dedicated WhatsApp mobile number & policy agreement checkout page
    navigate(`/subscriptions/checkout?planId=${plan._id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50/60 text-gray-900 pb-20">
      {/* Editorial Hero Header */}
      <div className="relative border-b border-gray-200/80 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Editorial <span className="text-blue-600">4K Video Plans</span>
          </h1>

          {/* Clean Segmented Pill: All / Monthly / Yearly */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setSelectedInterval('all')}
                className={`rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  selectedInterval === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedInterval('monthly')}
                className={`rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  selectedInterval === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly Plans
              </button>
              <button
                type="button"
                onClick={() => setSelectedInterval('yearly')}
                className={`rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  selectedInterval === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly Plans
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">


        {/* Error Alert */}
        {error && (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="mt-16 text-center">
            <PageLoader minHeight="200px" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPlans.length === 0 && (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-base font-semibold text-gray-900">No {selectedInterval === 'all' ? '' : selectedInterval} plans available</p>
            <p className="mt-1 text-xs text-gray-500">Please switch billing intervals or check back soon.</p>
          </div>
        )}

        {/* Plans Grid */}
        {!loading && filteredPlans.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:max-w-5xl xl:mx-auto">
            {filteredPlans.map((plan) => {
              const matchingActiveSub =
                activeSubscription?.plans?.find(
                  (p) => p.planId === plan._id || p.name === plan.name
                ) ||
                (activeSubscription &&
                (activeSubscription.planName === plan.name ||
                  activeSubscription.planName?.includes(plan.name))
                  ? activeSubscription
                  : null)

              const isCurrentActive = Boolean(matchingActiveSub)
              const isPlanAutoPayCancelled = Boolean(matchingActiveSub?.cancelAtPeriodEnd)
              const isPopular = plan.isPopular || plan.name.toLowerCase().includes('premium')

              return (
                <div
                  key={plan._id}
                  className={`relative flex flex-col justify-between rounded-3xl bg-white p-6 sm:p-8 transition-all duration-300 ${
                    isPopular
                      ? 'border-2 border-gray-900 shadow-xl ring-1 ring-gray-900/5'
                      : 'border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.badge && (
                    <span className="absolute -top-3.5 left-8 rounded-full bg-gray-900 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    {/* Header: Name, Tagline & Price */}
                    <div className="flex items-start justify-between border-b border-gray-100 pb-6">
                      <div className="pr-4">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                          {plan.name}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500 font-normal leading-relaxed">
                          {plan.tagline || 'Best for creators, press channels & media teams'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {Number(plan.originalPrice) > Number(plan.price) && (
                          <div className="flex items-center justify-end gap-1.5 mb-0.5">
                            <span className="text-xs text-gray-400 line-through font-medium">
                              {formatCurrency(plan.originalPrice)}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              {Math.round(((Number(plan.originalPrice) - Number(plan.price)) / Number(plan.originalPrice)) * 100)}% OFF
                            </span>
                          </div>
                        )}
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                          {formatCurrency(plan.price)}
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          / {plan.interval === 'yearly' ? 'Year' : 'Month'}
                        </span>
                      </div>
                    </div>

                    {/* Video Quota Info */}
                    <div className="mt-6 border-b border-gray-100 pb-5">
                      <p className="text-sm font-bold text-gray-900">
                        Includes {plan.videoQuota} Website Video Downloads
                      </p>
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed font-normal">
                        Download up to {plan.videoQuota} full-resolution editorial videos directly from the website.
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="mt-6 space-y-3.5">
                      {(plan.features || []).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <FeatureIcon text={feature} />
                          <span className="text-xs sm:text-sm font-normal leading-relaxed text-gray-700">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <div className="mt-8 pt-4">
                    {isCurrentActive ? (
                      <div>
                        <div
                          className="w-full rounded-2xl py-3.5 px-4 text-center text-sm font-bold bg-neutral-900 text-white shadow-sm flex items-center justify-center gap-2 select-none"
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span>Active Plan</span>
                        </div>


                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={processingPlanId === plan._id}
                        onClick={() => handleSelectPlan(plan)}
                        className="w-full rounded-2xl py-3.5 px-4 text-center text-sm font-bold border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-900 hover:text-white active:scale-[0.99] transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-60"
                      >
                        {processingPlanId === plan._id ? 'Starting Checkout...' : 'Select Plan'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Enterprise / Support Footer */}
        <div className="mt-14 text-center text-xs text-gray-500">
          Need custom editorial licensing, raw broadcast feeds, or enterprise team access?{' '}
          <Link to="/support" className="font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900">
            Contact our editorial desk
          </Link>
        </div>
      </div>

      {/* Editorial Membership Status Dialog */}
      {showActiveDetailsModal && activeSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl ring-1 ring-black/5">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowActiveDetailsModal(false)}
              className="absolute right-5 top-5 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Brand Header */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                AKHD Media & Co · Membership
              </p>
              <h3 className="mt-1.5 text-xl font-bold tracking-tight text-neutral-900">
                {activeSubscription.planName}
              </h3>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                <span className="text-xs font-medium text-neutral-500">
                  Active Subscription · {formatCurrency(activeSubscription.price)} / {activeSubscription.interval === 'yearly' ? 'year' : 'month'}
                </span>
              </div>
            </div>

            {/* Subscription Details & Metrics (Clean Key-Value UI) */}
            <div className="mt-5 space-y-2.5 text-xs text-neutral-500 border-t border-neutral-100 pt-4">
              <div className="flex items-center justify-between">
                <span>Download quota</span>
                <span className="font-semibold text-neutral-900">
                  {activeSubscription.videoQuotaRemaining} / {activeSubscription.videoQuota} videos
                </span>
              </div>
                <div className="flex items-center justify-between">
                  <span>Used</span>
                  <span className="font-medium text-neutral-800">
                    {activeSubscription.videoQuota - activeSubscription.videoQuotaRemaining}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Days Left</span>
                  <span className="font-medium text-neutral-800">
                    {(() => {
                      const now = new Date()
                      const end = new Date(activeSubscription.endDate)
                      return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Expires</span>
                  <span className="font-medium text-neutral-800">
                    {new Date(activeSubscription.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Billing cycle</span>
                  <span className="font-medium text-neutral-800 capitalize">{activeSubscription.interval}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>AutoPay status</span>
                  <span className={`font-medium ${activeSubscription.cancelAtPeriodEnd ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {activeSubscription.cancelAtPeriodEnd ? 'Cancelled for next cycle' : 'Active renewal'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cycle start</span>
                  <span className="font-medium text-neutral-800">
                    {new Date(activeSubscription.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2.5">
              {Boolean(activeSubscription?.id || activeSubscription?.plans?.[0]?.id || activeSubscription?._id) && (
                <a
                  href={`${import.meta.env.VITE_API_URL || '/api'}/subscriptions/invoice-pdf/${
                    activeSubscription?.id || activeSubscription?.plans?.[0]?.id || activeSubscription?._id
                  }`}
                  download={`subscription-tax-invoice-${
                    activeSubscription?.id || activeSubscription?.plans?.[0]?.id || 'receipt'
                  }.pdf`}
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

              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/categories"
                  onClick={() => setShowActiveDetailsModal(false)}
                  className="rounded-xl border border-neutral-200 bg-white py-2 px-4 text-center text-xs font-semibold text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 transition"
                >
                  Browse Videos
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowActiveDetailsModal(false)
                    navigate('/profile')
                  }}
                  className="rounded-xl border border-neutral-200 bg-white py-2 px-4 text-center text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition"
                >
                  Manage Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Cancel AutoPay Confirmation Modal */}
      {cancelModalPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleCloseCancelModal}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
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

            {cancelModalSuccess ? (
              /* Success confirmation view */
              <div className="py-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  AKHD Media & Co · AutoPay Updated
                </p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
                  AutoPay Cancelled
                </h3>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  AutoPay for <strong className="text-neutral-900">{cancelModalPlan.name}</strong> has been cancelled from next month.
                </p>

                <div className="mt-5 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-4 text-left space-y-2 text-xs text-neutral-600">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>No renewal charges will be deducted from next month.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Your video download quota remains fully active until this cycle expires.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>You can repurchase anytime whenever you want after expiry.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseCancelModal}
                  className="mt-6 w-full rounded-xl bg-neutral-900 py-3 text-xs font-bold text-white hover:bg-black transition cursor-pointer shadow-sm"
                >
                  Understood & Close
                </button>
              </div>
            ) : (
              /* Confirmation view */
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-4 ring-rose-50">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                      AKHD Media & Co · AutoPay
                    </p>
                    <h3 className="text-lg font-bold tracking-tight text-neutral-900">
                      Cancel AutoPay Renewal
                    </h3>
                  </div>
                </div>

                {/* Plan card summary */}
                <div className="mt-4 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5">
                  <p className="text-xs font-bold text-neutral-900">
                    {cancelModalPlan.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    {formatCurrency(cancelModalPlan.price)} / {cancelModalPlan.interval === 'yearly' ? 'Year' : 'Month'}
                  </p>
                </div>

                {/* Key explanation points */}
                <div className="mt-4 space-y-2.5 text-xs text-neutral-600 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-700">
                      ✕
                    </span>
                    <span>
                      Your account will <strong className="text-neutral-900">NOT be charged</strong> from next month.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                      ✓
                    </span>
                    <span>
                      You can continue downloading your remaining video quota until the end of your current cycle.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                      ↺
                    </span>
                    <span>
                      You can repurchase whenever you want after this plan expires.
                    </span>
                  </div>
                </div>

                {cancelModalError && (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    {cancelModalError}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={Boolean(cancellingPlanId)}
                    onClick={handleCloseCancelModal}
                    className="rounded-xl border border-neutral-200 bg-white py-2.5 px-4 text-center text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition cursor-pointer"
                  >
                    Keep AutoPay Active
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(cancellingPlanId)}
                    onClick={handleConfirmCancelAutoPay}
                    className="rounded-xl bg-rose-600 py-2.5 px-4 text-center text-xs font-bold text-white hover:bg-rose-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-sm"
                  >
                    {cancellingPlanId ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Cancelling...</span>
                      </>
                    ) : (
                      <span>Cancel AutoPay</span>
                    )}
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

export default Subscriptions
