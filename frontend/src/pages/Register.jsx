import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AlertModal from '../components/AlertModal'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { useAuth } from '../context/AuthContext'

const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

const inputClass =
  'w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10'

const Register = () => {
  const { user, loading, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = location.state?.from || '/'

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      await register(name, email, phone, password)
      navigate(redirectTo, {
        replace: true,
        state: location.state?.afterLoginAction
          ? { afterLoginAction: location.state.afterLoginAction }
          : null,
      })
    } catch (submitError) {
      setError(submitError.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError('Google sign-in failed')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      await loginWithGoogle(credentialResponse.credential)
      navigate(redirectTo, {
        replace: true,
        state: location.state?.afterLoginAction
          ? { afterLoginAction: location.state.afterLoginAction }
          : null,
      })
    } catch (submitError) {
      setError(submitError.message || 'Google sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    navigate(location.state?.from || '/', { replace: true })
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/35 px-4 py-6 backdrop-blur-md sm:py-12">
      <div className="flex min-h-full items-start justify-center sm:items-center">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative rounded-2xl border border-white/40 bg-white/95 p-5 shadow-2xl"
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close registration"
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>

          <div className="space-y-3">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="name"
                className={inputClass}
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                autoComplete="tel"
                className={inputClass}
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={inputClass}
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-xs font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={inputClass}
                placeholder="Re-enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="mt-3.5 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>

          {googleEnabled && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was cancelled or failed')}
                disabled={submitting || loading}
              />
            </>
          )}

          <p className="mt-3 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              replace
              state={location.state || null}
              className="font-semibold text-gray-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>

      <AlertModal
        open={Boolean(error)}
        title="Registration failed"
        message={error}
        onClose={() => setError('')}
      />
      </div>
    </div>
  )
}

export default Register
