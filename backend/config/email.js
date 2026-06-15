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
