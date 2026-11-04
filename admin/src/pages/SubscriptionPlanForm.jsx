import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  createAdminSubscriptionPlan,
  fetchAdminSubscriptionPlan,
  updateAdminSubscriptionPlan,
} from '../api/client'

const PRESET_EDITORIAL_FEATURES = [
  'Approx. 800 - 1000 4K-UHD videos every month.',
  'Daily updates with latest content & getting videos on daily basis.',
  'Spotting & paparazzi videos and other activities.',
  'AirPort spotting Videos.',
  'Red carpet, Event, press conferences.',
  'Includes 20 website video downloads directly from this website.',
  'No copyright issue Editorial use only (News, TV, Digital Media & social media).',
  '24/7 Support.',
  'Cancel subscription anytime.',
  'A separate WhatsApp group will be created for you. You will get the original RAW footage in the document via WhatsApp.',
]

const PRESET_STANDARD_FEATURES = [
  'Full HD & 4K access to standard catalogue',
  'Commercial and editorial digital media use',
  'Includes 5 website video downloads each month',
  'Priority customer support',
  'Regular new arrivals & daily content drops',
  'Instant high-speed download links',
]

const SubscriptionPlanForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    interval: 'monthly',
    durationDays: 30,
    price: 25000,
    gstPercentage: 18,
    originalPrice: 0,
    currency: 'INR',
    videoQuota: 20,
    badge: '',
    isPopular: false,
    isActive: true,
    sortOrder: 0,
    features: [...PRESET_EDITORIAL_FEATURES],
  })

  const [newFeatureText, setNewFeatureText] = useState('')

  useEffect(() => {
    if (!isEdit) return

    const loadPlan = async () => {
      try {
        const res = await fetchAdminSubscriptionPlan(id)
        const plan = res.data?.data?.plan
        if (plan) {
          setFormData({
            name: plan.name || '',
            tagline: plan.tagline || '',
            description: plan.description || '',
            interval: plan.interval || 'monthly',
            durationDays: plan.durationDays ?? (plan.interval === 'yearly' ? 365 : 30),
            price: plan.price ?? 0,
            gstPercentage: plan.gstPercentage !== undefined ? plan.gstPercentage : 18,
            originalPrice: plan.originalPrice ?? 0,
            currency: plan.currency || 'INR',
            videoQuota: plan.videoQuota ?? 20,
            badge: plan.badge || '',
            isPopular: Boolean(plan.isPopular),
            isActive: plan.isActive !== undefined ? Boolean(plan.isActive) : true,
            sortOrder: plan.sortOrder ?? 0,
            features: Array.isArray(plan.features) ? plan.features : [],
          })
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load plan details')
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [id, isEdit])

  const handleIntervalChange = (interval) => {
    setFormData((prev) => ({
      ...prev,
      interval,
      durationDays: interval === 'yearly' ? 365 : 30,
    }))
  }

  const handleAddFeature = () => {
    const trimmed = newFeatureText.trim()
    if (!trimmed) return
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, trimmed],
    }))
    setNewFeatureText('')
  }

  const handleRemoveFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const handleFeatureTextChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.features]
      updated[index] = value
      return { ...prev, features: updated }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        gstPercentage: Number(formData.gstPercentage ?? 0),
        originalPrice: Number(formData.originalPrice || 0),
        durationDays: Number(formData.durationDays),
        videoQuota: Number(formData.videoQuota),
        sortOrder: Number(formData.sortOrder || 0),
        features: formData.features.map((f) => f.trim()).filter(Boolean),
      }

      if (isEdit) {
        await updateAdminSubscriptionPlan(id, payload)
      } else {
        await createAdminSubscriptionPlan(payload)
      }

      navigate('/subscriptions')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subscription plan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-500">Loading plan details...</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link to="/subscriptions" className="hover:underline">
              Subscriptions
            </Link>
            <span>/</span>
            <span>{isEdit ? 'Edit Plan' : 'New Plan'}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {isEdit ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
          </h1>
        </div>
        <Link
          to="/subscriptions"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Basic Information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Plan Information</h2>
          <p className="mt-0.5 text-xs text-gray-500">Title, subtitle, and branding for this plan.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700">Plan Title *</label>
              <input
                type="text"
                placeholder="e.g. Monthly Plan, Premium Editorial 4K Video Plan, Enterprise Plan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Subtitle / Tagline</label>
              <input
                type="text"
                placeholder="e.g. Best for individual creators & media teams"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Badge (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Most Popular, Best Value, 4K Exclusive"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700">Plan Description</label>
              <textarea
                rows={2}
                placeholder="Get access to Raw 4K-UHD editorial videos from celebrity events, red carpets, paparazzi, airport spotting, press conferences and more."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Pricing & Video Quota Limit */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Pricing & Quota Configuration</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Set subscription interval, price, and how many videos the customer gets per billing cycle.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Billing Interval *</label>
              <div className="mt-2 flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="interval"
                    value="monthly"
                    checked={formData.interval === 'monthly'}
                    onChange={() => handleIntervalChange('monthly')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900">Monthly</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="interval"
                    value="yearly"
                    checked={formData.interval === 'yearly'}
                    onChange={() => handleIntervalChange('yearly')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900">Yearly</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Duration in Days</label>
              <input
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                required
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
              <p className="mt-0.5 text-[11px] text-gray-400">Default 30 days for monthly, 365 for yearly.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Price / Subtotal (₹ INR) *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm font-semibold text-gray-900 focus:border-gray-900 focus:outline-none"
              />
              <p className="mt-0.5 text-[11px] text-gray-400">Base price before GST (e.g. 499 or 25000).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">GST Rate (%) *</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.gstPercentage}
                  onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-sm font-semibold text-gray-900 focus:border-gray-900 focus:outline-none"
                />
                <span className="shrink-0 text-sm font-bold text-gray-500">%</span>
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {[0, 5, 12, 18, 28].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setFormData({ ...formData, gstPercentage: rate })}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border transition ${
                      Number(formData.gstPercentage) === rate
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Original Price (₹ Strike-through)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm text-gray-500 focus:border-gray-900 focus:outline-none"
              />
              <p className="mt-0.5 text-[11px] text-gray-400">Leave 0 if no discount to show.</p>
            </div>

            {/* Live Pricing Breakdown Preview */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Customer Checkout Preview
              </span>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    ₹{Number(formData.price || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST ({formData.gstPercentage || 0}%)</span>
                  <span className="font-semibold text-gray-900">
                    ₹{Math.round(((Number(formData.price || 0) * Number(formData.gstPercentage || 0)) / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 text-xs font-bold text-gray-900">
                  <span>Total Payable</span>
                  <span className="text-blue-700 font-extrabold">
                    ₹{(
                      Number(formData.price || 0) +
                      Math.round(((Number(formData.price || 0) * Number(formData.gstPercentage || 0)) / 100))
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Crucial requirement: Video download quota */}
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50/60 p-4 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-900">
                🎯 Video Download Quota (Limit) *
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={formData.videoQuota}
                  onChange={(e) => setFormData({ ...formData, videoQuota: e.target.value })}
                  required
                  className="w-32 rounded-xl border border-blue-300 bg-white p-2.5 text-lg font-bold text-gray-900 focus:border-blue-600 focus:outline-none"
                />
                <span className="text-sm font-semibold text-blue-950">
                  Videos included from this website per billing period
                </span>
              </div>
              <p className="mt-2 text-xs text-blue-800">
                ⚠️ <strong>Quota Rule:</strong> Once a subscriber downloads this many videos (e.g. 20 videos),
                their quota is exhausted for the month. They cannot download more without renewing the plan or
                purchasing individual licenses.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Features Checklist */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Plan Features & Bullet Points</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                These features will appear on the pricing cards and website.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, features: [...PRESET_EDITORIAL_FEATURES] })}
                className="rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                + Load 4K Editorial Preset
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, features: [...PRESET_STANDARD_FEATURES] })}
                className="rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                + Load Standard Preset
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {formData.features.map((feat, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={feat}
                  onChange={(e) => handleFeatureTextChange(index, e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-gray-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(index)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Remove feature"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Type a new feature bullet point..."
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddFeature()
                  }
                }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-gray-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="shrink-0 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
              >
                + Add Feature
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Settings */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Visibility & Display Settings</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-gray-700">Active / Published</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-gray-700">Featured / Popular</span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/subscriptions"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? 'Saving Plan...' : isEdit ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SubscriptionPlanForm

