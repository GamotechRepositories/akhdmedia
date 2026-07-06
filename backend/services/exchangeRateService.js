import { getPayPalCurrency } from '../config/paypal.js'

const CACHE_MS = 10 * 60 * 1000

let cache = {
  rate: null,
  fetchedAt: 0,
  source: 'fallback',
}

export const getFallbackUsdInrRate = () => {
  const rate = Number(process.env.PAYPAL_USD_INR_RATE)
  if (!Number.isFinite(rate) || rate <= 0) return 84
  return rate
}

export const fetchLiveUsdInrRate = async () => {
  if (cache.rate && Date.now() - cache.fetchedAt < CACHE_MS) {
    return {
      rate: cache.rate,
      source: cache.source,
      cached: true,
    }
  }

  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
      signal: AbortSignal.timeout(8000),
    })
    const data = await response.json().catch(() => ({}))
    const rate = Number(data?.rates?.INR)

    if (response.ok && Number.isFinite(rate) && rate > 0) {
      cache = { rate, fetchedAt: Date.now(), source: 'live' }
      return { rate, source: 'live', cached: false }
    }

    console.warn('[exchange] Unexpected USD/INR response:', data)
  } catch (error) {
    console.warn('[exchange] Live USD/INR fetch failed:', error.message)
  }

  const fallback = getFallbackUsdInrRate()
  cache = { rate: fallback, fetchedAt: Date.now(), source: 'fallback' }
  return { rate: fallback, source: 'fallback', cached: false }
}

/** INR store totals → PayPal charge amount (USD when configured). */
export const convertInrAmountForPayPal = async (inrAmount) => {
  const currency = getPayPalCurrency()
  const inr = Number(inrAmount)

  if (!Number.isFinite(inr) || inr < 0) {
    return { currency, amount: 0, inrAmount: 0, usdInrRate: 0, rateSource: 'fallback' }
  }

  if (currency === 'INR') {
    const amount = Math.max(1, Math.round(inr * 100) / 100)
    return { currency: 'INR', amount, inrAmount: inr, usdInrRate: 1, rateSource: 'fixed' }
  }

  if (currency === 'USD') {
    const { rate, source } = await fetchLiveUsdInrRate()
    const usd = inr / rate
    const amount = Math.max(0.01, Math.round(usd * 100) / 100)
    return {
      currency: 'USD',
      amount,
      inrAmount: inr,
      usdInrRate: rate,
      rateSource: source,
    }
  }

  return {
    currency,
    amount: Math.round(inr * 100) / 100,
    inrAmount: inr,
    usdInrRate: 1,
    rateSource: 'fixed',
  }
}
