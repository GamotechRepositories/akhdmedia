import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AlertModal from '../components/AlertModal'
import AuthModalShell from '../components/auth/AuthModalShell'
import { useCloseAuthModal } from '../utils/authModalNavigation'
import { useAuth } from '../context/AuthContext'
import { resetPassword } from '../services/authApi'

const inputClass =
  'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10'

const ResetPassword = () => {
  const { user, loading, refreshAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const closeModal = useCloseAuthModal('/login')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = location.state?.from || '/'

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />
  }

  if (!token) {
    return <Navigate to="/forgot-password" replace />
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
      await resetPassword(token, password)
      await refreshAuth()
      navigate(redirectTo, { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Could not reset password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AuthModalShell
        title="Set New Password"
        subtitle="Choose a new password for your account."
        onClose={closeModal}
        closeLabel="Close reset password"
      >
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                New Password
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
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
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
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            Link expired?{' '}
            <Link to="/forgot-password" replace className="font-semibold text-gray-900 hover:underline">
              Request a new one
            </Link>
          </p>
        </form>
      </AuthModalShell>

      <AlertModal
        open={Boolean(error)}
        title="Could not reset password"
        message={error}
        onClose={() => setError('')}
      />
    </>
  )
}

export default ResetPassword
