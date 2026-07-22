import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AlertModal from '../components/AlertModal'
import AuthModalShell from '../components/auth/AuthModalShell'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import PhoneCountryInput, {
  isPhoneNumberValid,
  normalizePhoneValue,
} from '../components/ui/PhoneCountryInput'
import { GOOGLE_CLIENT_ID } from '../config/auth'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10'

const Register = () => {
  const {
    user,
    loading,
    sendRegisterOtp,
    resendRegisterOtp,
    verifyRegisterOtp,
    loginWithGoogle,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [termsError, setTermsError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')

  const redirectTo = location.state?.from || '/'
  const isBusy = submitting || loading || resending

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

  const finishLoginNavigation = () => {
    navigate(redirectTo, {
      replace: true,
      state: location.state?.afterLoginAction
        ? { afterLoginAction: location.state.afterLoginAction }
        : null,
    })
  }

  const showTermsRequired = () => {
    setTermsError(true)
    setError('Please agree to the Terms & Conditions and Privacy Policy')
  }

  const handleSubmitDetails = async (event) => {
    event.preventDefault()
    setError('')

    if (!acceptedTerms) {
      showTermsRequired()
      return
    }

    setTermsError(false)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!isPhoneNumberValid(phone)) {
      setError('Please enter a valid phone number')
      return
    }

    setSubmitting(true)

    try {
      await sendRegisterOtp(
        name,
        email.trim().toLowerCase(),
        normalizePhoneValue(phone),
        password,
      )
      setStep('otp')
      setOtp('')
      setResendCooldown(60)
    } catch (submitError) {
      setError(submitError.message || 'Could not send verification code')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtp = async (event) => {
    event.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setSubmitting(true)

    try {
      await verifyRegisterOtp(email.trim().toLowerCase(), otp.trim())
      finishLoginNavigation()
    } catch (submitError) {
      setError(submitError.message || 'Verification failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return

    setError('')
    setResending(true)

    try {
      await resendRegisterOtp(email.trim().toLowerCase())
      setResendCooldown(60)
    } catch (submitError) {
      setError(submitError.message || 'Could not resend code')
    } finally {
      setResending(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!acceptedTerms) {
      showTermsRequired()
      return
    }

    if (!credentialResponse?.credential) {
      setError('Google sign-in failed')
      return
    }

    setTermsError(false)
    setError('')
    setSubmitting(true)

    try {
      await loginWithGoogle(credentialResponse.credential)
      finishLoginNavigation()
    } catch (submitError) {
      setError(submitError.message || 'Google sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AuthModalShell
        title={step === 'otp' ? 'Verify Email' : 'Create Account'}
        closeLabel="Close registration"
      >
        {step === 'details' ? (
          <form
            onSubmit={handleSubmitDetails}
            className="rounded-2xl border border-white/40 bg-white/95 p-5 shadow-2xl sm:p-6"
          >
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
                <p className="mt-1 text-[11px] text-gray-500">
                  We will send a 6-digit code to verify this email
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="mb-1 block text-xs font-medium text-gray-700">
                  Phone Number
                </label>
                <PhoneCountryInput
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={setPhone}
                  disabled={isBusy}
                  className="phone-country-input phone-country-input--rounded-xl"
                  inputClassName={inputClass}
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
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-xs font-medium text-gray-700"
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

            <label
              className={`mt-3.5 flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition ${
                termsError
                  ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => {
                  setAcceptedTerms(event.target.checked)
                  if (event.target.checked) setTermsError(false)
                }}
                className={`mt-0.5 h-4 w-4 shrink-0 rounded focus:ring-gray-900 ${
                  termsError
                    ? 'border-red-500 text-red-600 focus:ring-red-500'
                    : 'border-gray-300 text-gray-900'
                }`}
              />
              <span className={`text-sm ${termsError ? 'text-red-700' : 'text-gray-700'}`}>
                I agree to the{' '}
                <Link
                  to="/terms-and-conditions"
                  onClick={(event) => event.stopPropagation()}
                  className="font-semibold underline underline-offset-2"
                >
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy-policy"
                  onClick={(event) => event.stopPropagation()}
                  className="font-semibold underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={isBusy}
              className="mt-3.5 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending code...' : 'Continue'}
            </button>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    or
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in was cancelled or failed')}
                  disabled={isBusy}
                  blocked={!acceptedTerms}
                  onBlocked={showTermsRequired}
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
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            className="rounded-2xl border border-white/40 bg-white/95 p-5 shadow-2xl sm:p-6"
          >
            <p className="text-sm text-gray-600">
              Enter the 6-digit code we sent to{' '}
              <span className="font-semibold text-gray-900">{email.trim().toLowerCase()}</span>
            </p>

            <div className="mt-4">
              <label htmlFor="otp" className="mb-1 block text-xs font-medium text-gray-700">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className={`${inputClass} tracking-[0.35em] text-center text-lg font-semibold`}
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={isBusy || otp.length !== 6}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Verifying...' : 'Verify & create account'}
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
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('details')
                  setOtp('')
                  setError('')
                }}
                disabled={isBusy}
                className="text-gray-500 hover:text-gray-900 hover:underline"
              >
                Change email / details
              </button>
            </div>
          </form>
        )}
      </AuthModalShell>

      <AlertModal
        open={Boolean(error)}
        title={
          error.includes('Terms & Conditions')
            ? 'Terms required'
            : step === 'otp'
              ? 'Verification failed'
              : 'Registration failed'
        }
        message={error}
        onClose={() => setError('')}
      />
    </>
  )
}

export default Register
