import {
  COOKIE_CONSENT_STATUS,
  COOKIE_CONSENT_STORAGE_KEY,
} from '../constants/cookieConsent';

export const getCookieConsent = () => {
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (
      value === COOKIE_CONSENT_STATUS.ACCEPTED ||
      value === COOKIE_CONSENT_STATUS.REJECTED
    ) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
};

export const hasCookieConsentChoice = () => Boolean(getCookieConsent());

export const setCookieConsent = (status) => {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, status);
  } catch {
    // Ignore storage failures — banner may reappear on next visit.
  }
};

export const acceptCookieConsent = () => {
  setCookieConsent(COOKIE_CONSENT_STATUS.ACCEPTED);
};

export const rejectCookieConsent = () => {
  setCookieConsent(COOKIE_CONSENT_STATUS.REJECTED);
};
