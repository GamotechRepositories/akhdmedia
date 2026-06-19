import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AlertModal from '../components/AlertModal'
import AuthModalShell from '../components/auth/AuthModalShell'
import { useCloseAuthModal } from '../utils/authModalNavigation'
import { requestPasswordReset } from '../services/authApi'

const inputClass =
  'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10'

const ForgotPassword = () => {
  const location = useLocation()
  const closeModal = useCloseAuthModal('/login')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    <>
      <AuthModalShell
        title="Forgot Password"
        subtitle="Enter your email and we'll send you a reset link."
        onClose={closeModal}
        closeLabel="Close forgot password"
      >
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl sm:p-8"
        >
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
            <p className="mt-4 text-center text-sm text-gray-900">{success}</p>
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
      </AuthModalShell>

      <AlertModal
        open={Boolean(error)}
        title="Could not send reset email"
        message={error}
        onClose={() => setError('')}
      />
    </>
  )
}

export default ForgotPassword
