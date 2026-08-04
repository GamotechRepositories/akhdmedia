import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { cartAPI } from '../services/commerceApi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export const IOS_APP_BILLING_KEY = 'akhd_ios_app_billing'
export const IOS_APP_HANDOFF_KEY = 'akhd_ios_app_handoff'

const parseCartItems = (raw) => {
  if (!raw || typeof raw !== 'string') return []

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [productId = '', quantityRaw = '1', imageSizeRaw = ''] = entry.split(':')
      const quantity = Math.max(1, Number.parseInt(quantityRaw, 10) || 1)
      const imageSize = imageSizeRaw === 'standard' ? '' : imageSizeRaw.trim()
      return {
        productId: productId.trim(),
        quantity,
        imageSize,
      }
    })
    .filter((item) => item.productId)
}

const isAuthError = (error) => {
  const status = error?.response?.status || error?.statusCode
  const message = String(error?.response?.data?.message || error?.message || '').toLowerCase()
  return status === 401 || message.includes('authentication required') || message.includes('unauthorized')
}

const FromIosApp = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { loadCart } = useCart()
  const [error, setError] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (authLoading || startedRef.current) return
    startedRef.current = true

    const syncFromIos = async () => {
      const items = parseCartItems(searchParams.get('cartItems') || '')
      if (!items.length) {
        setError('No cart items were found from the app. Please return to the app and try again.')
        return
      }

      const billing = {
        name: (searchParams.get('name') || '').trim(),
        email: (searchParams.get('email') || '').trim(),
        phone: (searchParams.get('phone') || '').trim(),
        purchaseReasons: searchParams.get('purchaseReason')
          ? [searchParams.get('purchaseReason')]
          : [],
        purchaseReasonOther: (searchParams.get('purchaseReasonOther') || '').trim(),
      }

      const resumePath = `/from-app?${searchParams.toString()}`

      try {
        sessionStorage.setItem(IOS_APP_BILLING_KEY, JSON.stringify(billing))
        sessionStorage.setItem(
          IOS_APP_HANDOFF_KEY,
          JSON.stringify({ cartItems: searchParams.get('cartItems') || '', billing }),
        )
      } catch {
        // sessionStorage may be unavailable; continue with in-memory params.
      }

      if (!user) {
        setNeedsLogin(true)
        navigate('/login', {
          replace: true,
          state: {
            from: resumePath,
            loginMessage: 'Login is required to continue checkout from the app.',
          },
        })
        return
      }

      try {
        await cartAPI.clearCart().catch(() => {})

        for (const item of items) {
          await cartAPI.addToCart(item.productId, item.quantity, item.imageSize)
        }

        await loadCart()
        try {
          sessionStorage.removeItem(IOS_APP_HANDOFF_KEY)
        } catch {
          // ignore
        }
        navigate('/checkout', { replace: true })
      } catch (syncError) {
        console.error('Failed to sync iOS cart to website:', syncError)

        if (isAuthError(syncError)) {
          setNeedsLogin(true)
          navigate('/login', {
            replace: true,
            state: {
              from: resumePath,
              loginMessage: 'Login is required to continue checkout from the app.',
            },
          })
          return
        }

        setError(
          isAuthError(syncError)
            ? 'Login is required'
            : syncError?.response?.data?.message ||
                syncError?.message ||
                'Could not prepare your cart on the website. Please try again from the app.',
        )
      }
    }

    syncFromIos()
  }, [authLoading, loadCart, navigate, searchParams, user])

  if (needsLogin && !error) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900">Login is required</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Please sign in on the website to continue checkout from the iOS app.
        </p>
        <Link
          to="/login"
          state={{
            from: `/from-app?${searchParams.toString()}`,
            loginMessage: 'Login is required to continue checkout from the app.',
          }}
          className="mt-6 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      {error ? (
        <>
          <h1 className="text-xl font-bold text-gray-900">
            {error === 'Login is required' || error.toLowerCase().includes('authentication required')
              ? 'Login is required'
              : 'Could not open checkout'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {error.toLowerCase().includes('authentication required')
              ? 'Please sign in on the website to continue checkout from the iOS app.'
              : error}
          </p>
          {(error === 'Login is required' ||
            error.toLowerCase().includes('authentication required')) && (
            <Link
              to="/login"
              state={{
                from: `/from-app?${searchParams.toString()}`,
                loginMessage: 'Login is required to continue checkout from the app.',
              }}
              className="mt-6 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          )}
          {!(
            error === 'Login is required' ||
            error.toLowerCase().includes('authentication required')
          ) && (
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="mt-6 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to cart
            </button>
          )}
        </>
      ) : (
        <>
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <h1 className="mt-5 text-xl font-bold text-gray-900">Preparing your cart…</h1>
          <p className="mt-2 text-sm text-gray-600">
            Adding your items from the iOS app, then taking you to checkout.
          </p>
        </>
      )}
    </div>
  )
}

export default FromIosApp
