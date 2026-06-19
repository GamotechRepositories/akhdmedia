// OAuth client IDs are public. VITE_GOOGLE_CLIENT_ID overrides this in local .env if needed.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ||
  '581422572984-eiv7vs7tdl744g2pnd5m4jh95d6p054t.apps.googleusercontent.com'
