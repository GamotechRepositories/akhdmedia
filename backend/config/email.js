export const BRAND_NAME = 'Akhd Media'

export const getResendApiKey = () =>
  process.env.RESEND_API_KEY?.trim() || process.env.api_key?.trim() || ''

export const getResendFrom = () =>
  process.env.RESEND_FROM?.trim() || 'Akhd Media <noreply@akhdmedia.com>'

export const isEmailConfigured = () => Boolean(getResendApiKey() && getResendFrom())

export const getFrontendUrl = () => {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173'
  return raw.split(',')[0].trim()
}

export const MAX_LICENSE_EMAIL_RESENDS = 3

export const LICENSE_EMAIL_RESEND_LIMIT_MESSAGE =
  'You have reached the maximum number of resend attempts. Please contact our support team for help.'
