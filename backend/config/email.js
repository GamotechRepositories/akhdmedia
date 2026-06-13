export const BRAND_NAME = 'AKHDMEDIA'

export const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

export const getFrontendUrl = () => {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173'
  return raw.split(',')[0].trim()
}
