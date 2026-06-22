import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import FormStep from '../components/FormStep'
import {
  compactFormClass,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '../components/ui/adminUi'
import {
  createPromoCode,
  fetchPromoCode,
  updatePromoCode,
} from '../api/client'

const emptyForm = () => ({
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxUses: '',
  maxUsesPerUser: '',
  expiresAt: '',
  isActive: true,
})

const toDateInputValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const formatPreviewDate = (value) => {
  if (!value) return 'No expiry'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No expiry'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const PromoPreview = ({ form }) => {
  const discountLabel = useMemo(() => {
    if (!form.discountValue) return '—'
    return form.discountType === 'percentage'
      ? `${form.discountValue}% off`
      : `${formatCurrency(form.discountValue)} off`
  }, [form.discountType, form.discountValue])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Live preview</p>
      <p className="mt-1 text-sm text-slate-500">How this offer appears to customers on cart.</p>

      <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Promo code</p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wide text-slate-900">
              {form.code.trim() || 'YOURCODE'}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              form.isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {form.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="mt-4 rounded-lg bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-xs text-slate-500">Customer saves</p>
          <p className="text-xl font-bold text-emerald-700">{discountLabel}</p>
        </div>

        <dl className="mt-4 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between gap-3">
            <dt>Minimum order</dt>
            <dd className="font-medium text-slate-800">
              {form.minOrderAmount ? formatCurrency(form.minOrderAmount) : 'Any amount'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Total usage limit</dt>
            <dd className="font-medium text-slate-800">
              {form.maxUses ? `${form.maxUses} times` : 'Unlimited'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Per customer</dt>
            <dd className="font-medium text-slate-800">
              {form.maxUsesPerUser ? `${form.maxUsesPerUser} time${Number(form.maxUsesPerUser) === 1 ? '' : 's'}` : 'Unlimited'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Expires</dt>
            <dd className="font-medium text-slate-800">{formatPreviewDate(form.expiresAt)}</dd>
          </div>
        </dl>

        {form.description ? (
          <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">
            {form.description}
          </p>
        ) : null}
      </div>
    </div>
  )
}

const PromoCodeForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return

    const loadPromoCode = async () => {
      try {
        const response = await fetchPromoCode(id)
        const promo = response.data.data.promoCode
        setForm({
          code: promo.code,
          description: promo.description || '',
          discountType: promo.discountType,
          discountValue: String(promo.discountValue),
          minOrderAmount: promo.minOrderAmount ? String(promo.minOrderAmount) : '',
          maxUses: promo.maxUses != null ? String(promo.maxUses) : '',
          maxUsesPerUser: promo.maxUsesPerUser != null ? String(promo.maxUsesPerUser) : '',
          expiresAt: toDateInputValue(promo.expiresAt),
          isActive: promo.isActive,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPromoCode()
  }, [id, isEdit])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      code: form.code,
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: form.minOrderAmount === '' ? 0 : Number(form.minOrderAmount),
      maxUses: form.maxUses === '' ? null : Number(form.maxUses),
      maxUsesPerUser: form.maxUsesPerUser === '' ? null : Number(form.maxUsesPerUser),
      expiresAt: form.expiresAt || null,
      isActive: form.isActive,
    }

    try {
      if (isEdit) {
        await updatePromoCode(id, payload)
      } else {
        await createPromoCode(payload)
      }
      navigate('/promo-codes')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading promo code...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Promo Codes</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Edit Promo Code' : 'Add Promo Code'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create discount codes customers can apply on the cart page before checkout.
          </p>
        </div>
        <Link to="/promo-codes" className={secondaryBtnClass}>
          Back to list
        </Link>
      </div>

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not save promo code"
        message={error}
        onClose={() => setError('')}
      />

      <form onSubmit={handleSubmit} className={compactFormClass}>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <FormStep
              step="1"
              title="Code details"
              hint="The code customers will type at checkout."
              tone="emerald"
            >
              <div className="grid gap-4">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Promo code</span>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(event) => updateField('code', event.target.value.toUpperCase())}
                    className={`${inputClass} font-mono uppercase tracking-wider`}
                    placeholder="SUMMER25"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Use letters and numbers only. Codes are saved in uppercase.
                  </p>
                </label>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Internal note</span>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    className={inputClass}
                    placeholder="Optional — visible only in admin, e.g. Diwali campaign"
                  />
                </label>
              </div>
            </FormStep>

            <FormStep
              step="2"
              title="Discount"
              hint="How much the customer saves on their order total."
              tone="sky"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Discount type</span>
                  <select
                    value={form.discountType}
                    onChange={(event) => updateField('discountType', event.target.value)}
                    className={inputClass}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed amount (₹)</option>
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Discount value</span>
                  <div className="relative mt-1">
                    {form.discountType === 'fixed' ? (
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                        ₹
                      </span>
                    ) : null}
                    <input
                      type="number"
                      min="0"
                      step={form.discountType === 'percentage' ? '1' : '1'}
                      max={form.discountType === 'percentage' ? '100' : undefined}
                      value={form.discountValue}
                      onChange={(event) => updateField('discountValue', event.target.value)}
                      className={`${inputClass} no-number-spinner mt-0 ${form.discountType === 'fixed' ? 'pl-8' : ''}`}
                      placeholder={form.discountType === 'percentage' ? '10' : '500'}
                      required
                    />
                    {form.discountType === 'percentage' ? (
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-slate-400">
                        %
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {form.discountType === 'percentage'
                      ? 'Percentage is applied to the license subtotal before GST.'
                      : 'Fixed amount is deducted from the license subtotal before GST.'}
                  </p>
                </label>
              </div>
            </FormStep>

            <FormStep
              step="3"
              title="Limits & availability"
              hint="Control when and how often this code can be used."
              tone="amber"
            >
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Minimum order (₹)</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.minOrderAmount}
                      onChange={(event) => updateField('minOrderAmount', event.target.value)}
                      className={`${inputClass} no-number-spinner`}
                      placeholder="0"
                    />
                    <p className="mt-1 text-xs text-slate-500">Minimum license subtotal before GST. Leave empty or 0 for no minimum.</p>
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Max uses (total)</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.maxUses}
                      onChange={(event) => updateField('maxUses', event.target.value)}
                      className={`${inputClass} no-number-spinner`}
                      placeholder="Unlimited"
                    />
                    <p className="mt-1 text-xs text-slate-500">Total redemptions allowed across all customers.</p>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Max uses per customer</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.maxUsesPerUser}
                      onChange={(event) => updateField('maxUsesPerUser', event.target.value)}
                      className={`${inputClass} no-number-spinner`}
                      placeholder="Unlimited"
                    />
                    <p className="mt-1 text-xs text-slate-500">How many times one logged-in customer can use this code.</p>
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Expiry date</span>
                    <input
                      type="date"
                      value={form.expiresAt}
                      onChange={(event) => updateField('expiresAt', event.target.value)}
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-slate-500">Leave blank if the code should not expire.</p>
                  </label>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white/80 p-4 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                    checked={form.isActive}
                    onChange={(event) => updateField('isActive', event.target.checked)}
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">Active promo code</span>
                    <span className="mt-1 block text-slate-500">
                      Inactive codes stay saved in admin but customers cannot apply them on the cart.
                    </span>
                  </span>
                </label>
              </div>
            </FormStep>
          </div>

          <aside className="border-t border-slate-200 bg-slate-50/80 p-5 lg:border-l lg:border-t-0">
            <div className="lg:sticky lg:top-24">
              <PromoPreview form={form} />
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-100 px-5 py-4">
          <Link to="/promo-codes" className={secondaryBtnClass}>
            Cancel
          </Link>
          <button type="submit" disabled={saving} className={`${primaryBtnClass} disabled:opacity-60`}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create promo code'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PromoCodeForm
