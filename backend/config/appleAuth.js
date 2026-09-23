export const getAppleClientId = () =>
  process.env.APPLE_IOS_BUNDLE_ID?.trim() || 'com.akhdmedia.ios'
