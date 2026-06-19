import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AlertModal from '../components/AlertModal'
import { useAuth } from '../context/AuthContext'
import { resetPassword } from '../services/authApi'

const inputClass =
  'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10'

const ResetPassword = () => {
  const { user, loading, refreshAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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

  const handleClose = () => {
    navigate('/login', { replace: true })
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
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/35 px-4 py-6 backdrop-blur-md sm:py-12">
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">Set New Password</h1>
            <p className="mt-2 text-sm text-white/80">Choose a new password for your account.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative rounded-2xl border border-white/40 bg-white/95 p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close reset password"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>

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
        </div>

        <AlertModal
          open={Boolean(error)}
          title="Could not reset password"
          message={error}
          onClose={() => setError('')}
        />
      </div>
    </div>
  )
}

export default ResetPassword
