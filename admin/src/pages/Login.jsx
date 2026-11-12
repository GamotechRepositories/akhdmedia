import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import { getFirstAllowedPath } from '../constants/adminPermissions'
import { useAuth } from '../context/AuthContext'

const OTP_LENGTH = 6

const OtpInputs = ({ value, onChange, disabled }) => {
  const inputsRef = useRef([])
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] || '')

  useEffect(() => {
    if (!disabled) {
      inputsRef.current[0]?.focus()
    }
  }, [disabled])

  const emit = (nextDigits) => {
    onChange(nextDigits.join('').replace(/\D/g, '').slice(0, OTP_LENGTH))
  }

  const focusAt = (index) => {
    const node = inputsRef.current[index]
    if (!node) return
    node.focus()
    node.select()
  }

  const handleChange = (index, raw) => {
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      const next = [...digits]
      next[index] = ''
      emit(next)
      return
    }

    if (cleaned.length > 1) {
      const next = Array.from({ length: OTP_LENGTH }, (_, i) => cleaned[i] || digits[i] || '')
      const start = index
      cleaned.split('').forEach((digit, offset) => {
        if (start + offset < OTP_LENGTH) next[start + offset] = digit
      })
      emit(next)
      focusAt(Math.min(start + cleaned.length, OTP_LENGTH - 1))
      return
    }

    const next = [...digits]
    next[index] = cleaned
    emit(next)
    if (index < OTP_LENGTH - 1) focusAt(index + 1)
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      const next = [...digits]
      next[index - 1] = ''
      emit(next)
      focusAt(index - 1)
    }
  }

  return (
    <div className="grid grid-cols-6 gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1}`}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          className="h-12 w-full rounded-xl border border-slate-300 text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      ))}
    </div>
  )
}

const Login = () => {
  const { admin, loading, sendLoginCode, verifyLoginCode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [expiresInMinutes, setExpiresInMinutes] = useState(5)
  const [sentTo, setSentTo] = useState('')
  const [accountName, setAccountName] = useState('')

  const redirectTo = location.state?.from || '/'

  const resolveRedirect = (account) => {
    if (!account) return '/login'
    if (redirectTo === '/' || redirectTo === '/access-denied') {
      return getFirstAllowedPath(account)
    }
    return redirectTo
  }

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendIn((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendIn])

  if (!loading && admin) {
    return <Navigate to={resolveRedirect(admin)} replace />
  }

  const handleSendCode = async (event) => {
    event?.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await sendLoginCode(email.trim())
      setExpiresInMinutes(response?.data?.expiresInMinutes || 5)
      setResendIn(response?.data?.resendAfterSeconds || 60)
      setSentTo(response?.data?.sentTo || '')
      setAccountName(response?.data?.name || '')
      setCode('')
      setStep('code')
    } catch (submitError) {
      setError(submitError.message || 'Could not send the code')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await verifyLoginCode(email.trim(), code)
      const loggedInAdmin = response?.data?.admin
      navigate(resolveRedirect(loggedInAdmin), { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
        </div>

        <form
          onSubmit={step === 'email' ? handleSendCode : handleVerify}
          className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl shadow-black/30"
        >
          {step === 'email' ? (
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Your email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                placeholder="Enter your team email"
              />
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600">
                Enter the 6-digit code sent to{' '}
                <span className="font-semibold text-slate-900">{sentTo || 'the admin inbox'}</span>.
                This signs in{' '}
                <span className="font-semibold text-slate-900">
                  {accountName ? `${accountName} (${email})` : email}
                </span>
                . It expires in {expiresInMinutes} minutes.
              </p>
              <div className="mt-4">
                <OtpInputs value={code} onChange={setCode} disabled={submitting} />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setCode('')
                    setError('')
                  }}
                  className="font-medium text-slate-500 transition hover:text-slate-900"
                >
                  Use a different email
                </button>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={submitting || resendIn > 0}
                  className="font-semibold text-slate-900 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || loading || (step === 'code' && code.length !== OTP_LENGTH)}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? step === 'email'
                ? 'Sending code...'
                : 'Signing in...'
              : step === 'email'
                ? 'Send code'
                : 'Sign in'}
          </button>
        </form>
      </div>

      <AdminAlertModal
        open={Boolean(error)}
        title={step === 'email' ? 'Could not send code' : 'Login failed'}
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default Login
