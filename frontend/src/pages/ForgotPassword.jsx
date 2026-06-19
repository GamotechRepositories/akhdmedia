import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AlertModal from '../components/AlertModal'
import { requestPasswordReset } from '../services/authApi'

const inputClass =
  'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleClose = () => {
    navigate(location.state?.from || '/login', { replace: true })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const response = await requestPasswordReset(email)
      setSuccess(response.message || 'Check your email for a reset link.')
      setEmail('')
    } catch (submitError) {
      setError(submitError.message || 'Could not send reset email')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/35 px-4 py-6 backdrop-blur-md sm:py-12">
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
            <p className="mt-2 text-sm text-white/80">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative rounded-2xl border border-white/40 bg-white/95 p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close forgot password"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>

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

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>

            {success && (
              <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {success}
              </p>
            )}

            <p className="mt-6 text-center text-sm text-gray-500">
              Remember your password?{' '}
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
          title="Could not send reset email"
          message={error}
          onClose={() => setError('')}
        />
      </div>
    </div>
  )
}

export default ForgotPassword
