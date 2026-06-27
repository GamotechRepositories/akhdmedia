import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';
import {
  acceptCookieConsent,
  hasCookieConsentChoice,
  rejectCookieConsent,
} from '../utils/cookieConsent';

const CookieIcon = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2C6.48 2 2 6.25 2 11.5 2 16.75 6.48 21 12 21c.95 0 1.87-.14 2.73-.4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M12 2c3.2 0 5.97 1.86 7.28 4.56.45.88.72 1.88.72 2.94 0 .55-.08 1.08-.22 1.58M12 21c-1.2 0-2.33-.28-3.34-.78"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <circle cx="8.5" cy="10.5" r="1" fill="currentColor" />
    <circle cx="12" cy="14.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="9.5" r="1" fill="currentColor" />
    <circle cx="17.5" cy="14" r="1" fill="currentColor" />
  </svg>
);

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
    <>
      <div
        className="fixed inset-0 z-[88] bg-gray-950/25 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        className="fixed inset-x-0 bottom-[5.25rem] z-[90] md:bottom-0"
      >
        <div className="border-t border-gray-200/80 bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.14)]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  <CookieIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 pt-0.5">
                  <p
                    id="cookie-consent-title"
                    className="text-sm font-semibold tracking-tight text-gray-900 sm:text-[15px]"
                  >
                    We use cookies to improve your experience
                  </p>
                  <p
                    id="cookie-consent-description"
                    className="mt-1.5 max-w-3xl text-xs leading-relaxed text-gray-600 sm:text-sm"
                  >
                    {BRAND.name} uses essential cookies to keep you signed in, save your cart, and complete
                    checkout. Your browser may also cache images for faster loading. The site works smoothly
                    either way — this choice only saves your preference so we do not ask again. Read our{' '}
                    <Link
                      to="/privacy-policy"
                      className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-2 transition hover:decoration-gray-500"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  className="cursor-pointer rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  Essential only
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="cursor-pointer rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  Accept all
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsentBanner;
