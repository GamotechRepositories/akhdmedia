import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchAdminSubscriptionPlans,
  deleteAdminSubscriptionPlan,
  updateAdminSubscriptionPlan,
  fetchAdminSubscribers,
  updateAdminSubscriber,
  createAdminSubscriber,
  fetchAdminUsers,
} from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions'

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const d = new Date(dateString)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const Subscriptions = () => {
  const navigate = useNavigate()
  const { admin, isSuperAdmin, hasPermission } = useAuth()
  const canWrite = Boolean(
    isSuperAdmin ||
    admin?.isSuperAdmin ||
    hasPermission?.(ADMIN_PERMISSIONS.SUBSCRIPTIONS_WRITE) ||
    admin
  )

  const [activeTab, setActiveTab] = useState('plans') // 'plans' | 'subscribers'

  // Plans state
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState('')

  // Subscribers state
  const [subscribers, setSubscribers] = useState([])
  const [subscribersLoading, setSubscribersLoading] = useState(false)
  const [subscribersError, setSubscribersError] = useState('')
  const [subSearch, setSubSearch] = useState('')
  const [subStatus, setSubStatus] = useState('all')
  const [subPlanFilter, setSubPlanFilter] = useState('all')
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null)
  const [subPagination, setSubPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })

  // Adjust Quota & Expiry Modal state
  const [editSubModal, setEditSubModal] = useState(null)
  const [editQuotaRemaining, setEditQuotaRemaining] = useState(0)
  const [editTotalQuota, setEditTotalQuota] = useState(0)
  const [editStatus, setEditStatus] = useState('active')
  const [editAdminReason, setEditAdminReason] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editAmountPaid, setEditAmountPaid] = useState(0)
  const [editPaymentStatus, setEditPaymentStatus] = useState('paid')
  const [editPaymentProvider, setEditPaymentProvider] = useState('razorpay')
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('')
  const [modalSaving, setModalSaving] = useState(false)

  // Assign / Gift Subscription Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignUserSearch, setAssignUserSearch] = useState('')
  const [assignUserResults, setAssignUserResults] = useState([])
  const [assignSearching, setAssignSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [assignPlanId, setAssignPlanId] = useState('')
  const [assignIsFree, setAssignIsFree] = useState(true)
  const [assignAmountPaid, setAssignAmountPaid] = useState(0)
  const [assignVideoQuota, setAssignVideoQuota] = useState('')
  const [assignDurationDays, setAssignDurationDays] = useState(30)
  const [assignWhatsappNumber, setAssignWhatsappNumber] = useState('')
  const [assignReason, setAssignReason] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)

  const loadPlans = useCallback(async () => {
    setPlansLoading(true)
    setPlansError('')
    try {
      const res = await fetchAdminSubscriptionPlans()
      setPlans(res.data?.data?.plans || [])
    } catch (err) {
      setPlansError(err.response?.data?.message || err.message || 'Failed to load plans')
    } finally {
      setPlansLoading(false)
    }
  }, [])

  const loadSubscribers = useCallback(
    async (page = 1) => {
      setSubscribersLoading(true)
      setSubscribersError('')
      try {
        const res = await fetchAdminSubscribers({
          page,
          limit: 20,
          search: subSearch,
          status: subStatus,
          planId: subPlanFilter,
        })
        const data = res.data?.data || {}
        setSubscribers((data.subscribers || []).filter((s) => s.status !== 'pending'))
        setSubPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 })
      } catch (err) {
        setSubscribersError(err.response?.data?.message || err.message || 'Failed to load subscribers')
      } finally {
        setSubscribersLoading(false)
      }
    },
    [subSearch, subStatus, subPlanFilter]
  )

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  useEffect(() => {
    if (activeTab === 'subscribers') {
      loadSubscribers(1)
    }
  }, [activeTab, subStatus, subPlanFilter, loadSubscribers])

  const handleDeletePlan = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${name}"?`)) return
    try {
      await deleteAdminSubscriptionPlan(id)
      setPlans((prev) => prev.filter((p) => p._id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete plan')
    }
  }

  const handleToggleActive = async (plan) => {
    try {
      const nextActive = !plan.isActive
      await updateAdminSubscriptionPlan(plan._id, { isActive: nextActive })
      setPlans((prev) =>
        prev.map((p) => (p._id === plan._id ? { ...p, isActive: nextActive } : p))
      )
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update plan status')
    }
  }

  const handleViewPlanSubscribers = (plan) => {
    setSubPlanFilter(plan._id)
    setSelectedPlanDetails(plan)
    setSubStatus('all')
    setActiveTab('subscribers')
  }

  const openEditQuotaModal = (sub) => {
    setEditSubModal(sub)
    setEditQuotaRemaining(sub.videoQuotaRemaining ?? 0)
    setEditTotalQuota(sub.videoQuota ?? 0)
    setEditStatus(sub.status || 'active')
    setEditAdminReason(sub.adminReason || '')
    const isPaid = sub.paymentStatus === 'paid'
    const isFree = sub.paymentProvider === 'free' || sub.price === 0
    const initialPaid = sub.amountPaid !== undefined && sub.amountPaid !== null
      ? Number(sub.amountPaid)
      : (isPaid && !isFree ? Number(sub.price || 0) : 0)
    setEditAmountPaid(initialPaid)
    setEditPaymentStatus(sub.paymentStatus || (isFree ? 'paid' : 'pending'))
    setEditPaymentProvider(sub.paymentProvider || (isFree ? 'free' : 'razorpay'))
    setEditWhatsappNumber(sub.whatsappNumber || sub.userId?.phone || '')

    if (sub.endDate) {
      const d = new Date(sub.endDate)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      setEditEndDate(`${yyyy}-${mm}-${dd}`)
    } else {
      setEditEndDate('')
    }
  }

  const handleSaveQuotaModal = async (e) => {
    e.preventDefault()
    if (!editSubModal) return
    setModalSaving(true)
    try {
      await updateAdminSubscriber(editSubModal._id, {
        videoQuotaRemaining: Number(editQuotaRemaining),
        videoQuota: Number(editTotalQuota),
        status: editStatus,
        adminReason: editAdminReason,
        amountPaid: Number(editAmountPaid),
        paymentStatus: editPaymentStatus,
        paymentProvider: editPaymentProvider,
        whatsappNumber: editWhatsappNumber,
        ...(editEndDate ? { endDate: new Date(editEndDate) } : {}),
      })
      alert('Subscriber quota, amount paid & status updated successfully!')
      setEditSubModal(null)
      loadSubscribers(subPagination.page)
      loadPlans()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update subscriber')
    } finally {
      setModalSaving(false)
    }
  }

  // Handle Search Users for Assign Modal
  const handleSearchUsersForAssign = async (query) => {
    setAssignUserSearch(query)
    if (!query || query.trim().length < 2) {
      setAssignUserResults([])
      return
    }
    setAssignSearching(true)
    try {
      const res = await fetchAdminUsers({ search: query.trim(), limit: 10 })
      setAssignUserResults(res.data?.data?.users || res.data?.users || [])
    } catch (err) {
      console.error('Failed to search users:', err)
    } finally {
      setAssignSearching(false)
    }
  }

  // Handle Assign/Gift Subscription Submit
  const handleAssignSubscriptionSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser) {
      alert('Please select a customer user.')
      return
    }
    if (!assignPlanId) {
      alert('Please select a subscription plan.')
      return
    }
    setAssignSaving(true)
    try {
      await createAdminSubscriber({
        userId: selectedUser._id || selectedUser.id,
        userEmail: selectedUser.email,
        planId: assignPlanId,
        amountPaid: assignIsFree ? 0 : Number(assignAmountPaid) || 0,
        paymentProvider: assignIsFree ? 'free' : 'admin_manual',
        paymentStatus: 'paid',
        whatsappNumber: assignWhatsappNumber || selectedUser.phone || '',
        videoQuota: assignVideoQuota ? Number(assignVideoQuota) : undefined,
        durationDays: Number(assignDurationDays) || 30,
        adminReason: assignReason || (assignIsFree ? 'Free complimentary plan granted by admin' : 'Assigned by admin'),
      })
      alert(`Success! Subscription assigned to ${selectedUser.name || selectedUser.email}!`)
      setAssignModalOpen(false)
      setSelectedUser(null)
      setAssignUserSearch('')
      setAssignUserResults([])
      loadSubscribers(1)
      loadPlans()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign subscription')
    } finally {
      setAssignSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subscriptions Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create monthly/yearly plans, set pricing, assign video quotas, and monitor active subscribers.
          </p>
        </div>
        {canWrite && activeTab === 'plans' && (
          <Link
            to="/subscriptions/new"
            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            + Create New Plan
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`border-b-2 px-6 py-3 text-sm font-bold transition-all ${
            activeTab === 'plans'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          Subscription Plans ({plans.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subscribers')}
          className={`border-b-2 px-6 py-3 text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'subscribers'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <span>Subscribers & Video Quotas</span>
          {subPlanFilter !== 'all' && (
            <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-semibold">
              Filtered
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Subscription Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {plansLoading && (
            <div className="py-12 text-center text-sm text-gray-500">Loading subscription plans...</div>
          )}

          {plansError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {plansError}
            </div>
          )}

          {!plansLoading && !plansError && plans.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <p className="text-base font-semibold text-gray-900">No subscription plans created yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Create a monthly or yearly plan to start offering video quota subscriptions.
              </p>
              {canWrite && (
                <Link
                  to="/subscriptions/new"
                  className="mt-4 inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Create First Plan
                </Link>
              )}
            </div>
          )}

          {!plansLoading && plans.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition ${
                    plan.isActive ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
                        {plan.interval === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}
                      </span>
                      {plan.badge && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => handleViewPlanSubscribers(plan)}
                      className="mt-3 text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition"
                      title="Click to view subscribers of this plan"
                    >
                      {plan.name}
                    </h3>
                    {plan.tagline && <p className="mt-1 text-xs text-gray-500">{plan.tagline}</p>}

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-gray-900">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        / {plan.interval === 'yearly' ? 'Year' : 'Month'}
                      </span>
                      {plan.originalPrice > plan.price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatCurrency(plan.originalPrice)}
                        </span>
                      )}
                    </div>
                    {Number(plan.gstPercentage || 0) > 0 ? (
                      <p className="mt-0.5 text-xs text-gray-500 font-medium">
                        + {plan.gstPercentage}% GST (Total: {formatCurrency(plan.price + Math.round((plan.price * plan.gstPercentage) / 100))})
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-gray-400">
                        0% GST (Exempt)
                      </p>
                    )}

                    {/* Video Quota Callout Banner */}
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white text-xs">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <p className="text-xs font-bold text-blue-900">
                          Video Quota: {plan.videoQuota} Videos / period
                        </p>
                      </div>
                      <p className="mt-1 pl-7 text-[11px] text-blue-700">
                        Users can download up to {plan.videoQuota} videos from the website.
                      </p>
                    </div>

                    {/* Interactive Subscribers Banner */}
                    <button
                      type="button"
                      onClick={() => handleViewPlanSubscribers(plan)}
                      className="mt-4 flex w-full items-center justify-between rounded-xl border border-blue-200 bg-blue-50/90 p-3 text-left transition hover:bg-blue-100/90 hover:border-blue-300 group shadow-xs"
                      title="Click to view all customers who purchased this plan"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700 transition">
                            Subscribers of this plan
                          </p>
                          <p className="text-[11px] text-gray-500">View users, days left & quotas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm whitespace-nowrap">
                          {plan.activeSubscribersCount || 0} Active →
                        </span>
                        {(plan.pendingSubscribersCount || 0) > 0 && (
                          <span
                            className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800 whitespace-nowrap"
                            title={`${plan.pendingSubscribersCount} users started checkout`}
                          >
                            {plan.pendingSubscribersCount} Pending
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Features Preview */}
                    <div className="mt-4 space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Features ({plan.features?.length || 0})
                      </p>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {(plan.features || []).slice(0, 4).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-green-600 font-bold">✓</span>
                            <span className="line-clamp-1">{feat}</span>
                          </li>
                        ))}
                        {(plan.features?.length || 0) > 4 && (
                          <li className="text-[11px] font-medium text-gray-400">
                            + {plan.features.length - 4} more features...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={plan.isActive}
                          disabled={!canWrite}
                          onChange={() => handleToggleActive(plan)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {plan.isActive ? 'Active' : 'Inactive (Hidden)'}
                      </label>

                      {canWrite && (
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/subscriptions/${plan._id}/edit`}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(plan._id, plan.name)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Subscribers & Video Quotas */}
      {activeTab === 'subscribers' && (
        <div className="space-y-6">
          {/* Active Plan Filter Callout Banner */}
          {selectedPlanDetails && (
            <div className="flex flex-col gap-2 rounded-2xl border border-blue-200 bg-blue-50/90 p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-blue-950">
                    Subscribers for: {selectedPlanDetails.name}
                  </p>
                  <p className="text-xs text-blue-700">
                    Showing only customers currently enrolled in this specific plan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubPlanFilter('all')
                  setSelectedPlanDetails(null)
                }}
                className="inline-flex items-center gap-1.5 self-start rounded-xl border border-blue-300 bg-white px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-50"
              >
                ✕ Clear Filter (Show All Plans)
              </button>
            </div>
          )}

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex w-full max-w-md items-center gap-2">
              <input
                type="text"
                placeholder="Search by customer name, email, phone..."
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadSubscribers(1)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => loadSubscribers(1)}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Search
              </button>
            </div>

            {canWrite && (
              <button
                type="button"
                onClick={() => {
                  setAssignModalOpen(true)
                  setSelectedUser(null)
                  setAssignUserSearch('')
                  setAssignUserResults([])
                  setAssignPlanId(plans[0]?._id || '')
                  setAssignIsFree(true)
                  setAssignAmountPaid(0)
                  setAssignDurationDays(plans[0]?.interval === 'yearly' ? 365 : 30)
                  setAssignVideoQuota(plans[0]?.videoQuota || 20)
                  setAssignReason('Complimentary access granted by admin')
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
              >
                <span>+</span> Grant / Assign Plan
              </button>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {/* Plan Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Plan:</span>
                <select
                  value={subPlanFilter}
                  onChange={(e) => {
                    const planId = e.target.value
                    setSubPlanFilter(planId)
                    const p = plans.find((x) => x._id === planId)
                    setSelectedPlanDetails(p || null)
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                >
                  <option value="all">All Plans ({plans.length})</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.interval})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Status:</span>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="under_review">Under Review</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {subscribersLoading && (
            <div className="py-12 text-center text-sm text-gray-500">Loading subscribers...</div>
          )}

          {subscribersError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {subscribersError}
            </div>
          )}

          {!subscribersLoading && !subscribersError && subscribers.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <p className="text-base font-semibold text-gray-900">No subscribers found</p>
              <p className="mt-1 text-sm text-gray-500">
                {subPlanFilter !== 'all'
                  ? 'No customers currently enrolled in this specific plan.'
                  : 'Customers who purchase a subscription plan will appear here with their video quotas.'}
              </p>
              {subPlanFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setSubPlanFilter('all')
                    setSelectedPlanDetails(null)
                  }}
                  className="mt-4 inline-flex rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  Show All Subscribers
                </button>
              )}
            </div>
          )}

          {!subscribersLoading && subscribers.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3.5 whitespace-nowrap">Customer</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Plan & Billing</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Amount Paid</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Videos Remaining</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Days Left & Expiry</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-6 py-3.5 text-right whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {subscribers.map((sub) => {
                    const quotaTotal = sub.videoQuota ?? 0
                    const quotaRemaining = sub.videoQuotaRemaining ?? 0
                    const quotaUsed = quotaTotal - quotaRemaining

                    const now = new Date()
                    const end = new Date(sub.endDate)
                    const diffTime = end - now
                    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
                    const isExpired = sub.status === 'expired' || diffTime <= 0

                    return (
                      <tr
                        key={sub._id}
                        onClick={() => navigate(`/subscriptions/subscribers/${sub._id}`)}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                        title="Click to view details, accessed videos & adjust quota"
                      >
                        {/* Customer */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-semibold text-gray-900">{sub.userId?.name || 'Customer'}</p>
                          <p className="text-xs text-gray-500">{sub.userId?.email || '—'}</p>
                          {sub.whatsappNumber ? (
                            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5" title="WhatsApp group creation number">
                              <span>💬 WA:</span> {sub.whatsappNumber}
                            </p>
                          ) : sub.userId?.phone ? (
                            <p className="text-xs text-gray-400">{sub.userId.phone}</p>
                          ) : null}
                        </td>

                        {/* Plan */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-medium text-gray-900">
                            {sub.planSnapshot?.name || sub.planId?.name || 'Subscription Plan'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Rate: {formatCurrency(sub.planSnapshot?.price ?? sub.price)} · <span className="capitalize">{sub.planSnapshot?.interval || 'monthly'}</span>
                          </p>
                        </td>

                        {/* Amount Paid */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const isPaid = sub.paymentStatus === 'paid'
                            const isFree =
                              sub.paymentProvider === 'free' ||
                              sub.price === 0 ||
                              (sub.amountPaid !== undefined && sub.amountPaid === 0 && (isPaid || sub.status === 'active'))
                            const paidAmount =
                              sub.amountPaid !== undefined && sub.amountPaid !== null
                                ? Number(sub.amountPaid)
                                : (isPaid && !isFree ? Number(sub.price || 0) : 0)

                            return (
                              <div className="space-y-1">
                                <p className="font-bold text-gray-900 text-sm whitespace-nowrap">
                                  {formatCurrency(paidAmount)}
                                </p>
                                <div>
                                  {isFree ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                      ★ Free / Admin Gift
                                    </span>
                                  ) : isPaid ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200 whitespace-nowrap">
                                      ✓ Paid {sub.paymentProvider === 'razorpay' ? '(Online)' : sub.paymentProvider ? `(${sub.paymentProvider})` : ''}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })()}
                        </td>

                        {/* Videos Remaining */}
                        <td className="px-6 py-4">
                          <div className="w-48">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-gray-900">
                                {quotaRemaining} of {quotaTotal} Videos Left
                              </span>
                            </div>
                            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full transition-all ${
                                  quotaRemaining <= 2 ? 'bg-red-500' : quotaRemaining <= 5 ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${quotaTotal > 0 ? (quotaRemaining / quotaTotal) * 100 : 0}%` }}
                              />
                            </div>
                            <p className="mt-1 text-[11px] text-gray-400">
                              {quotaUsed} used · {quotaRemaining} downloads remaining
                            </p>
                          </div>
                        </td>

                        {/* Days Left & Expiry */}
                        <td className="px-6 py-4 text-xs whitespace-nowrap">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${
                                isExpired
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : daysLeft <= 5
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isExpired ? 'Expired' : `${daysLeft} Days Left`}
                            </span>
                            <p className="text-[11px] text-gray-600 font-medium whitespace-nowrap">
                              Expires: {formatDate(sub.endDate)}
                            </p>
                            <p className="text-[10px] text-gray-400 whitespace-nowrap">
                              Started: {formatDate(sub.startDate)}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                                sub.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : sub.status === 'on_hold'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : sub.status === 'under_review'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                  : sub.status === 'cancelled'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : sub.status === 'expired'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                              }`}
                            >
                              {sub.status === 'on_hold'
                                ? 'ON HOLD'
                                : sub.status === 'under_review'
                                ? 'UNDER REVIEW'
                                : sub.status === 'cancelled'
                                ? 'CANCELLED'
                                : sub.status}
                            </span>
                            {sub.status === 'pending' && (
                              <p className="text-[10px] font-semibold text-amber-600">Unpaid / Awaiting Pay</p>
                            )}
                            {sub.adminReason && (
                              <p className="text-[10px] text-gray-500 italic max-w-[200px] truncate" title={sub.adminReason}>
                                Reason: {sub.adminReason}
                              </p>
                            )}
                            {sub.cancelAtPeriodEnd && (
                              <p className="text-[10px] font-bold text-amber-700">AutoPay Off</p>
                            )}
                          </div>
                        </td>

                        {/* Row link indicator */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-gray-400 group-hover:text-blue-600 group-hover:border-blue-200 group-hover:bg-white group-hover:shadow-sm transition">
                            View Plan & Videos →
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {subPagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-xs">
                  <span className="text-gray-500">
                    Page {subPagination.page} of {subPagination.pages} ({subPagination.total} total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={subPagination.page <= 1}
                      onClick={() => loadSubscribers(subPagination.page - 1)}
                      className="rounded border border-gray-200 px-2.5 py-1 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={subPagination.page >= subPagination.pages}
                      onClick={() => loadSubscribers(subPagination.page + 1)}
                      className="rounded border border-gray-200 px-2.5 py-1 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Adjust Quota & Lifecycle Modal */}
      {editSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Adjust Subscriber Quota & Expiry</h3>
            <p className="mt-1 text-xs text-gray-500">
              Customer: <strong>{editSubModal.userId?.name || 'Customer'}</strong> ({editSubModal.userId?.email || '—'})
            </p>

            <form onSubmit={handleSaveQuotaModal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Remaining Videos Quota</label>
                <input
                  type="number"
                  min="0"
                  value={editQuotaRemaining}
                  onChange={(e) => setEditQuotaRemaining(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
                  required
                />
                <p className="mt-0.5 text-[11px] text-gray-400">
                  How many videos this user can currently download before reaching the limit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Total Plan Quota</label>
                <input
                  type="number"
                  min="1"
                  value={editTotalQuota}
                  onChange={(e) => setEditTotalQuota(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Customer WhatsApp Number</label>
                <input
                  type="text"
                  value={editWhatsappNumber}
                  onChange={(e) => setEditWhatsappNumber(e.target.value)}
                  placeholder="+91..."
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none font-semibold text-emerald-900"
                />
                <p className="mt-0.5 text-[11px] text-gray-400">Used for creating their dedicated daily video WhatsApp group.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Extend / Change Expiry Date</label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
                />
                <p className="mt-0.5 text-[11px] text-gray-400">
                  Adjust how many days this customer has before their subscription expires.
                </p>
              </div>

              {/* Amount Paid & Payment Status */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Amount Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editAmountPaid}
                    onChange={(e) => setEditAmountPaid(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-gray-900 focus:outline-none"
                    placeholder="0 if free"
                  />
                  <p className="mt-0.5 text-[10px] text-gray-500">Enter 0 if given free.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Payment Status</label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-gray-900 focus:outline-none"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending / Unpaid</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700">Payment Method / Provider</label>
                  <select
                    value={editPaymentProvider}
                    onChange={(e) => {
                      setEditPaymentProvider(e.target.value)
                      if (e.target.value === 'free') {
                        setEditAmountPaid(0)
                        setEditPaymentStatus('paid')
                      }
                    }}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-gray-900 focus:outline-none"
                  >
                    <option value="free">Free / Complimentary (₹0)</option>
                    <option value="admin_manual">Admin Manual (Cash / Offline / Direct)</option>
                    <option value="razorpay">Online (Razorpay)</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm focus:border-gray-900 focus:outline-none"
                >
                  <option value="active">Active (Full Access)</option>
                  <option value="on_hold">On Hold (Pause & Protect Days)</option>
                  <option value="under_review">Under Review (Lock Downloads, Days Count)</option>
                  <option value="cancelled">Cancelled (Terminate Access)</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {['on_hold', 'under_review', 'cancelled'].includes(editStatus) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
                  <div className="flex items-start gap-1.5 text-xs text-amber-900">
                    <span className="font-bold">Notice:</span>
                    <p className="font-medium">
                      {editStatus === 'on_hold' && 'On Hold Mode: Downloads are paused. The duration spent on hold is protected and will be automatically credited to the expiry date when resumed.'}
                      {editStatus === 'under_review' && 'Under Review Mode: Downloads are locked for investigation. Validity days continue to count down normally (no extra days added).'}
                      {editStatus === 'cancelled' && 'Cancelled Mode: Subscription is terminated immediately and video downloads are revoked.'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">
                      Reason / Note for User (Visible in customer profile)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Terms violation / Suspicious download volume / Multiple account abuse"
                      value={editAdminReason}
                      onChange={(e) => setEditAdminReason(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-amber-300 bg-white p-2 text-xs focus:border-gray-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {editSubModal.status === 'on_hold' && editStatus === 'active' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                  <p className="font-bold">✓ Resuming from Hold to Active</p>
                  <p className="mt-0.5 text-emerald-700">
                    The duration this subscription was on hold will be automatically added to the customer expiry date upon saving.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditSubModal(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {modalSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign / Gift Plan to User Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Grant / Assign Subscription Plan</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Give any customer free complimentary access or manual subscription.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubscriptionSubmit} className="mt-4 space-y-4">
              {/* Select Customer */}
              <div>
                <label className="block text-xs font-semibold text-gray-700">Select Customer User</label>
                {selectedUser ? (
                  <div className="mt-1 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                    <div>
                      <p className="text-sm font-bold text-emerald-950">{selectedUser.name || 'User'}</p>
                      <p className="text-xs text-emerald-700">{selectedUser.email}</p>
                      {selectedUser.phone && <p className="text-xs text-emerald-600">{selectedUser.phone}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-xs font-semibold text-emerald-800 underline hover:text-emerald-950"
                    >
                      Change User
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Type name, email, or phone to search user..."
                      value={assignUserSearch}
                      onChange={(e) => handleSearchUsersForAssign(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
                    />
                    {assignSearching && (
                      <p className="text-xs text-gray-400">Searching customers...</p>
                    )}
                    {assignUserResults.length > 0 && (
                      <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white shadow-sm">
                        {assignUserResults.map((u) => (
                          <div
                            key={u._id || u.id}
                            onClick={() => {
                              setSelectedUser(u)
                              setAssignUserResults([])
                            }}
                            className="p-2.5 hover:bg-gray-50 cursor-pointer transition text-xs"
                          >
                            <p className="font-bold text-gray-900">{u.name || 'Unnamed'}</p>
                            <p className="text-gray-500">{u.email} {u.phone ? `· ${u.phone}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Select Plan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700">Choose Plan</label>
                <select
                  value={assignPlanId}
                  onChange={(e) => {
                    const pId = e.target.value
                    setAssignPlanId(pId)
                    const selPlan = plans.find((p) => p._id === pId)
                    if (selPlan) {
                      setAssignVideoQuota(selPlan.videoQuota)
                      setAssignDurationDays(selPlan.interval === 'yearly' ? 365 : 30)
                      if (!assignIsFree) {
                        setAssignAmountPaid(selPlan.price)
                      }
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm focus:border-gray-900 focus:outline-none"
                  required
                >
                  <option value="" disabled>Select a plan</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — {formatCurrency(p.price)} / {p.interval} ({p.videoQuota} videos)
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing & Free Option */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Grant as Free / Gift (₹0)</p>
                    <p className="text-[11px] text-gray-500">Customer will NOT be charged anything.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={assignIsFree}
                    onChange={(e) => {
                      const isChecked = e.target.checked
                      setAssignIsFree(isChecked)
                      if (isChecked) {
                        setAssignAmountPaid(0)
                      } else {
                        const selPlan = plans.find((p) => p._id === assignPlanId)
                        setAssignAmountPaid(selPlan?.price || 0)
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                {!assignIsFree && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Amount Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={assignAmountPaid}
                      onChange={(e) => setAssignAmountPaid(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-gray-900 focus:outline-none"
                      placeholder="Amount customer paid offline/cash"
                    />
                  </div>
                )}
              </div>

              {/* Customer WhatsApp Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700">Customer WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210 (For WhatsApp Group)"
                  value={assignWhatsappNumber}
                  onChange={(e) => setAssignWhatsappNumber(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>

              {/* Quota & Duration Override */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Video Downloads Quota</label>
                  <input
                    type="number"
                    min="1"
                    value={assignVideoQuota}
                    onChange={(e) => setAssignVideoQuota(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={assignDurationDays}
                    onChange={(e) => setAssignDurationDays(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-700">Admin Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Creator complimentary access / Press partner"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSaving || !selectedUser || !assignPlanId}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {assignSaving ? 'Granting Plan...' : 'Confirm & Grant Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Subscriptions
