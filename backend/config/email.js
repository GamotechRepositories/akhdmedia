export const BRAND_NAME = 'AKHD MEDIA & CO'

export const getResendApiKey = () =>
  process.env.RESEND_API_KEY?.trim() || process.env.api_key?.trim() || ''

export const getResendFrom = () => {
  const raw = process.env.RESEND_FROM?.trim() || 'AKHD MEDIA & CO <noreply@akhdmedia.com>'
  return raw.replace(/^["']+|["']+$/g, '')
}

export const isEmailConfigured = () => Boolean(getResendApiKey() && getResendFrom())

export const getFrontendUrl = () => {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173'
  return raw.split(',')[0].trim()
}

export const PASSWORD_RESET_EXPIRY_MINUTES = Number(
  process.env.PASSWORD_RESET_EXPIRY_MINUTES || 10,
)

export const PASSWORD_RESET_EXPIRY_MS = PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000

export const formatPasswordResetExpiryLabel = (
  minutes = PASSWORD_RESET_EXPIRY_MINUTES,
) => {
  const value = Number(minutes) || 10

  if (value === 1) return '1 minute'
  if (value < 60) return `${value} minutes`

  if (value % 60 === 0) {
    const hours = value / 60
    return hours === 1 ? '1 hour' : `${hours} hours`
  }

  return `${value} minutes`
}

export const MAX_LICENSE_EMAIL_RESENDS = 2

export const LICENSE_EMAIL_RESEND_WINDOW_MS = 5 * 60 * 1000

export const LICENSE_EMAIL_RESEND_LIMIT_MESSAGE =
  'You have reached the maximum number of resend attempts. Please contact our support team for help.'

export const LICENSE_EMAIL_RESEND_WINDOW_EXPIRED_MESSAGE =
  'The resend period has ended. Resend is only available within 5 minutes of your order. Please contact support if you need help.'

export const getLicenseResendWindowEndsAt = (orderCreatedAt) =>
  new Date(new Date(orderCreatedAt).getTime() + LICENSE_EMAIL_RESEND_WINDOW_MS)

export const isLicenseResendWindowOpen = (orderCreatedAt, now = Date.now()) =>
  now < getLicenseResendWindowEndsAt(orderCreatedAt).getTime()
