import { useEffect, useRef } from 'react'

const OTP_LENGTH = 6

const boxClass = (filled, disabled) =>
  [
    'h-12 w-full rounded-xl border text-center text-lg font-semibold text-gray-900 outline-none transition',
    filled ? 'border-gray-900 bg-white' : 'border-gray-300 bg-white',
    'focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10',
    disabled ? 'cursor-not-allowed opacity-60' : '',
  ]
    .filter(Boolean)
    .join(' ')

const OtpDigitInputs = ({
  value = '',
  onChange,
  disabled = false,
  length = OTP_LENGTH,
  autoFocus = true,
}) => {
  const inputsRef = useRef([])
  const digits = Array.from({ length }, (_, index) => value[index] || '')

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputsRef.current[0]?.focus()
    }
  }, [autoFocus, disabled])

  const emit = (nextDigits) => {
    const next = nextDigits.join('').slice(0, length)
    onChange?.(next)
  }

  const focusAt = (index) => {
    const node = inputsRef.current[index]
    if (!node) return
    node.focus()
    node.select()
  }

  const handleChange = (index, raw) => {
    const cleaned = raw.replace(/\D/g, '')

    if (cleaned.length > 1) {
      const next = Array.from({ length }, (_, i) => cleaned[i] || '')
      emit(next)
      const focusIndex = Math.min(cleaned.length, length - 1)
      focusAt(cleaned.length >= length ? length - 1 : focusIndex)
      return
    }

    const next = [...digits]
    next[index] = cleaned.slice(-1)
    emit(next)

    if (cleaned && index < length - 1) {
      focusAt(index + 1)
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      const next = [...digits]
      next[index - 1] = ''
      emit(next)
      focusAt(index - 1)
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusAt(index - 1)
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault()
      focusAt(index + 1)
    }
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    const next = Array.from({ length }, (_, i) => pasted[i] || '')
    emit(next)
    focusAt(Math.min(pasted.length, length - 1))
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-gray-700">Verification code</label>
      <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
        {digits.map((digit, index) => (
          <input
            key={`otp-digit-${index}`}
            ref={(node) => {
              inputsRef.current[index] = node
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={length}
            value={digit}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={boxClass(Boolean(digit), disabled)}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
          />
        ))}
      </div>
    </div>
  )
}

export default OtpDigitInputs
