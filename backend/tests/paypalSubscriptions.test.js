import test from 'node:test'
import assert from 'node:assert/strict'
import UserSubscription from '../models/UserSubscription.js'
import User from '../models/User.js'
import { advancePayPalPeriod, getPayPalFrequency, reconcilePayPalSubscription, processPayPalWebhook, cancelPayPalSubscription } from '../services/paypalSubscriptionService.js'

process.env.PAYPAL_CLIENT_ID = 'test-client'
process.env.PAYPAL_CLIENT_SECRET = 'test-secret'
process.env.PAYPAL_WEBHOOK_ID = 'test-webhook'
process.env.PAYPAL_MODE = 'sandbox'

const fixture = () => ({
  _id: 'local-1', userId: 'user-1', paypalSubscriptionId: 'I-test', paypalPlanId: 'P-test',
  paypalAmount: 10, paypalCurrency: 'USD', paypalFrequency: { unit: 'MONTH', count: 1 },
  videoQuota: 12, videoQuotaRemaining: 12, totalAmount: 840, paymentStatus: 'pending',
})
const mockApi = (t, transactions, overrides = {}) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    let data
    if (url.endsWith('/token')) data = { access_token: 'test' }
    else if (url.includes('verify-webhook-signature')) data = { verification_status: overrides.signature || 'SUCCESS' }
    else if (url.includes('/transactions?')) data = { transactions }
    else if (url.endsWith('/cancel')) return { ok: false, status: 500, json: async () => ({}) }
    else data = { id: 'I-test', custom_id: 'local-1', plan_id: 'P-test', status: 'ACTIVE', ...overrides }
    return { ok: true, status: 200, json: async () => data }
  })
}
const mockStore = (t, state) => {
  t.mock.method(UserSubscription, 'findById', async () => state)
  t.mock.method(UserSubscription, 'findOneAndUpdate', async (query, update) => {
    const paidAt = update.$set.paypalLastPaymentAt
    if (state.paypalLastPaymentAt && state.paypalLastPaymentAt >= paidAt) return null
    Object.assign(state, update.$set)
    return state
  })
  t.mock.method(User, 'findByIdAndUpdate', async () => ({}))
}

test('billing periods clamp month ends and leap years', () => {
  assert.equal(advancePayPalPeriod('2026-01-31T12:00:00Z', { unit: 'MONTH', count: 1 }).toISOString(), '2026-02-28T12:00:00.000Z')
  assert.equal(advancePayPalPeriod('2024-02-29T12:00:00Z', { unit: 'YEAR', count: 1 }).toISOString(), '2025-02-28T12:00:00.000Z')
  assert.deepEqual(getPayPalFrequency({ interval: 'custom', durationDays: 14 }), { unit: 'DAY', count: 14 })
  assert.throws(() => getPayPalFrequency({ interval: 'custom', durationDays: 366 }))
})

test('approval without a completed payment never grants access', async t => {
  const state = fixture()
  mockApi(t, [])
  mockStore(t, state)
  await reconcilePayPalSubscription(state)
  assert.equal(state.paymentStatus, 'pending')
  assert.equal(UserSubscription.findOneAndUpdate.mock.callCount(), 0)
})

test('completed payment activates; replay does not reset consumed quota', async t => {
  const state = fixture()
  mockApi(t, [{ id: 'sale-1', status: 'COMPLETED', time: new Date().toISOString(), amount_with_breakdown: { gross_amount: { value: '10.00', currency_code: 'USD' } } }])
  mockStore(t, state)
  await reconcilePayPalSubscription(state)
  assert.equal(state.status, 'active')
  state.videoQuotaRemaining = 3
  await reconcilePayPalSubscription(state)
  assert.equal(state.videoQuotaRemaining, 3)
  assert.equal(User.findByIdAndUpdate.mock.callCount(), 1)
})

test('wrong currency or amount cannot activate a subscription', async t => {
  const state = fixture()
  mockApi(t, [{ id: 'sale-1', status: 'COMPLETED', time: new Date().toISOString(), amount_with_breakdown: { gross_amount: { value: '10.00', currency_code: 'EUR' } } }])
  mockStore(t, state)
  await reconcilePayPalSubscription(state)
  assert.equal(state.paymentStatus, 'pending')
})

test('a different remote plan is rejected', async t => {
  mockApi(t, [], { plan_id: 'P-other' })
  await assert.rejects(reconcilePayPalSubscription(fixture()), /does not match/)
})

test('missing or invalid webhook signatures are rejected', async t => {
  await assert.rejects(processPayPalWebhook({}, {}), /Missing PayPal signature/)
  mockApi(t, [], { signature: 'FAILURE' })
  const headers = Object.fromEntries(['auth-algo', 'cert-url', 'transmission-id', 'transmission-sig', 'transmission-time'].map(key => [`paypal-${key}`, 'test']))
  await assert.rejects(processPayPalWebhook(headers, {}), /Invalid PayPal signature/)
})

test('provider cancellation errors propagate to the caller', async t => {
  mockApi(t, [])
  await assert.rejects(cancelPayPalSubscription('I-test'), /could not complete/)
})

test('a later paid renewal restores quota; an older delivery cannot roll it back', async t => {
  const state = fixture()
  state.paypalLastPaymentAt = new Date(Date.now() - 28 * 86400000)
  state.videoQuotaRemaining = 0
  const time = new Date().toISOString()
  mockApi(t, [{ id: 'sale-renewal', status: 'COMPLETED', time, amount_with_breakdown: { gross_amount: { value: '10.00', currency_code: 'USD' } } }])
  mockStore(t, state)
  await reconcilePayPalSubscription(state)
  assert.equal(state.videoQuotaRemaining, 12)
  assert.equal(state.paypalLastPaymentId, 'sale-renewal')
  const end = state.endDate
  state.videoQuotaRemaining = 2
  await reconcilePayPalSubscription(state)
  assert.equal(state.videoQuotaRemaining, 2)
  assert.equal(state.endDate, end)
})

test('cancellation preserves the paid access expiry', async t => {
  const state = fixture()
  const time = new Date().toISOString()
  mockApi(t, [{ id: 'sale-1', status: 'COMPLETED', time, amount_with_breakdown: { gross_amount: { value: '10.00', currency_code: 'USD' } } }], { status: 'CANCELLED' })
  mockStore(t, state)
  t.mock.method(UserSubscription, 'updateOne', async (_query, update) => Object.assign(state, update.$set))
  await reconcilePayPalSubscription(state)
  assert.equal(state.cancelAtPeriodEnd, true)
  assert.equal(state.status, 'active')
  assert.ok(state.endDate > new Date())
})
