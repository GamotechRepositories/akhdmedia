import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';
import {
  acceptCookieConsent,
  hasCookieConsentChoice,
  rejectCookieConsent,
} from '../utils/cookieConsent';

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasCookieConsentChoice());
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    acceptCookieConsent();
    setVisible(false);
  };

  const handleReject = () => {
    rejectCookieConsent();
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-0 bottom-20 z-[90] px-3 sm:bottom-4 md:bottom-4 lg:px-4"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
        <div className="min-w-0 flex-1">
          <p id="cookie-consent-title" className="text-sm font-bold text-gray-900">
            Cookies &amp; browser storage
          </p>
          <p id="cookie-consent-description" className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
            {BRAND.name} uses cookies, cache, and local browser storage to keep you signed in, remember your cart,
            secure checkout, and improve site performance. By continuing, you allow these on your device.{' '}
            <Link
              to="/privacy-policy"
              className="font-medium text-gray-900 underline decoration-gray-400 underline-offset-2 hover:text-gray-700"
            >
              Privacy Policy
            </Link>
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleReject}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
