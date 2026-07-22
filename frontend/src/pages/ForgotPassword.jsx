import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AlertModal from '../components/AlertModal'
import AuthModalShell from '../components/auth/AuthModalShell'
import { useAuth } from '../context/AuthContext'
import { useCloseAuthModal } from '../utils/authModalNavigation'
import {
  requestPasswordReset,
  resendPasswordResetOtp,
  resetPassword,
} from '../services/authApi'

const inputClass =
  'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10'

const ForgotPassword = () => {
  const { user, loading, refreshAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const closeModal = useCloseAuthModal('/login')
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')

  const redirectTo = location.state?.from || '/'
  const isBusy = submitting || loading || resending
  const normalizedEmail = email.trim().toLowerCase()

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />
  }

  const handleSendOtp = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await requestPasswordReset(normalizedEmail)
      setStep('otp')
      setOtp('')
      setPassword('')
      setConfirmPassword('')
      setResendCooldown(300)
    } catch (submitError) {
      setError(submitError.message || 'Could not send verification code')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter the 6-digit verification code')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)

    try {
      await resetPassword(normalizedEmail, otp.trim(), password)
      await refreshAuth()
      navigate(redirectTo, { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Could not reset password')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return

    setError('')
    setResending(true)

    try {
      await resendPasswordResetOtp(normalizedEmail)
      setResendCooldown(300)
    } catch (submitError) {
      setError(submitError.message || 'Could not resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      <AuthModalShell
        title={step === 'otp' ? 'Verify & Set Password' : 'Forgot Password'}
        subtitle={
          step === 'otp'
            ? 'Enter the code from your email and choose a new password.'
            : "Enter your email and we'll send a verification code. Works for Google accounts too."
        }
        onClose={closeModal}
        closeLabel="Close forgot password"
      >
        {step === 'email' ? (
          <form
            onSubmit={handleSendOtp}
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
              disabled={isBusy}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send verification code'}
            </button>

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
        ) : (
          <form
            onSubmit={handleResetPassword}
            className="rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl sm:p-8"
          >
            <p className="text-sm text-gray-600">
              Enter the 6-digit code we sent to{' '}
              <span className="font-semibold text-gray-900">{normalizedEmail}</span>
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  required
                  className={`${inputClass} tracking-[0.35em] text-center text-lg font-semibold`}
                  placeholder="000000"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
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
              disabled={isBusy || otp.length !== 6}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Updating...' : 'Verify & update password'}
            </button>

            <div className="mt-4 flex flex-col items-center gap-2 text-sm">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isBusy || resendCooldown > 0}
                className="font-semibold text-gray-900 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
              >
                {resending
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Resend code in ${Math.floor(resendCooldown / 60)}:${String(
                        resendCooldown % 60,
                      ).padStart(2, '0')}`
                    : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setOtp('')
                  setPassword('')
                  setConfirmPassword('')
                  setError('')
                }}
                disabled={isBusy}
                className="text-gray-500 hover:text-gray-900 hover:underline"
              >
                Change email
              </button>
            </div>
          </form>
        )}
      </AuthModalShell>

      <AlertModal
        open={Boolean(error)}
        title={
          error.toLowerCase().includes('no account')
            ? 'Account not found'
            : step === 'otp'
              ? 'Could not reset password'
              : 'Could not send verification code'
        }
        message={error}
        onClose={() => setError('')}
      />
    </>
  )
}

export default ForgotPassword
