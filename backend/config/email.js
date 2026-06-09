export const isEmailEnabled = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

export const SMTP_HOST = process.env.SMTP_HOST || ''
export const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
export const SMTP_USER = process.env.SMTP_USER || ''
export const SMTP_PASS = process.env.SMTP_PASS || ''
export const SMTP_FROM =
  process.env.SMTP_FROM || 'FrameVault <licensing@framevault.com>'

export const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim()

export const getApiPublicUrl = () =>
  (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`).replace(
    /\/$/,
    '',
  )
