import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AlertModal from '../components/AlertModal'
import AuthModalShell from '../components/auth/AuthModalShell'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { GOOGLE_CLIENT_ID } from '../config/auth'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10'

const Login = () => {
  const { user, loading, login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = location.state?.from || '/'

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(email, password)
      navigate(redirectTo, {
        replace: true,
        state: location.state?.afterLoginAction
          ? { afterLoginAction: location.state.afterLoginAction }
          : null,
      })
    } catch (submitError) {
      setError(submitError.message || 'Login failed')
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

  return (
    <>
      <AuthModalShell title="Sign In" closeLabel="Close login">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
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
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  replace
                  state={location.state || null}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className={inputClass}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="my-5 flex items-center gap-3">
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

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              replace
              state={location.state || null}
              className="font-semibold text-gray-900 hover:underline"
            >
              Create one
            </Link>
          </p>
        </form>
      </AuthModalShell>

      <AlertModal
        open={Boolean(error)}
        title="Login failed"
        message={error}
        onClose={() => setError('')}
      />
    </>
  )
}

export default Login
