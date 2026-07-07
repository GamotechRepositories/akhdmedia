import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderAPI, paymentAPI } from '../services/commerceApi';
import { BRAND } from '../config/brand';
import {
  LICENSE_EMAIL_RESEND_LIMIT_MESSAGE,
  LICENSE_EMAIL_RESEND_WINDOW_EXPIRED_MESSAGE,
  MAX_LICENSE_EMAIL_RESENDS,
  formatResendWindowLabel,
} from '../constants/email';
import OrderAmountSummary from '../components/OrderAmountSummary';
import OrderConfirmingModal from '../components/OrderConfirmingModal';
import PageLoader from '../components/ui/PageLoader';
import { IconClose } from '../components/icons/Icons';

const saveBlobDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const handleContinue = () => {
    if (location.state?.fromOrders && location.state?.orderId) {
      navigate('/orders', { state: { focusOrderId: location.state.orderId } });
      return;
    }

    navigate('/videos');
  };

  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingOrderLabel, setLoadingOrderLabel] = useState('Loading order...');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState('');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [resendWindowRemainingMs, setResendWindowRemainingMs] = useState(0);
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);

  const pendingVerificationRef = useRef(null);
  const previewOrderNumberRef = useRef('');
  const showConfirmingInitiallyRef = useRef(
    Boolean(
      location.state?.showConfirmingOverlay ||
        location.state?.pendingPaymentVerification,
    ),
  );

  const [showConfirmingPopup, setShowConfirmingPopup] = useState(
    showConfirmingInitiallyRef.current,
  );

  const orderId = searchParams.get('orderId') || '';

  if (
    !pendingVerificationRef.current &&
    location.state?.pendingPaymentVerification?.orderId === orderId
  ) {
    pendingVerificationRef.current = location.state.pendingPaymentVerification;
  }

  if (!previewOrderNumberRef.current && location.state?.previewOrderNumber) {
    previewOrderNumberRef.current = location.state.previewOrderNumber;
  }

  const formatOrderNumber = (value = '') => value.slice(-8).toUpperCase();
  const orderNumber =
    formatOrderNumber(order?.orderNumber || '') ||
    formatOrderNumber(previewOrderNumberRef.current || '') ||
    '--------';
  const customerEmail = order?.billingAddress?.email || '';
  const orderItems = order?.items || [];
  const maxResends = order?.maxLicenseEmailResends ?? MAX_LICENSE_EMAIL_RESENDS;
  const resendCount = order?.licenseEmailResendCount ?? 0;
  const resendsRemaining = order?.licenseEmailResendsRemaining ?? Math.max(0, maxResends - resendCount);
  const isResendWindowOpen = resendWindowRemainingMs > 0;
  const canResendEmail = isResendWindowOpen && resendsRemaining > 0;

  const isPaid = order?.paymentStatus === 'paid';

  const orderDateLabel = (order?.createdAt ? new Date(order.createdAt) : new Date()).toLocaleDateString(
    'en-IN',
    { day: 'numeric', month: 'short', year: 'numeric' },
  );

  const handleDownloadLicense = async () => {
    if (!orderId || downloadingCertificate) return;

    setDownloadingCertificate(true);
    try {
      const blob = await orderAPI.downloadLicenseCertificate(orderId);
      saveBlobDownload(blob, `license-${orderNumber}.pdf`);
    } catch (error) {
      console.error('Failed to download license certificate:', error);
    } finally {
      setDownloadingCertificate(false);
    }
  };

  const openSupportModal = () => setShowSupportModal(true);

  const handleResendEmail = async () => {
    if (!orderId || resendingEmail) return;

    if (!canResendEmail) {
      if (!isResendWindowOpen && resendsRemaining > 0) {
        setEmailNotice(LICENSE_EMAIL_RESEND_WINDOW_EXPIRED_MESSAGE);
        return;
      }
      openSupportModal();
      return;
    }

    setResendingEmail(true);
    setEmailNotice('');

    try {
      const response = await orderAPI.resendLicenseEmail(orderId);
      if (response.success) {
        if (response.data?.order) {
          setOrder(response.data.order);
        }
        setEmailNotice(`License email sent to ${customerEmail || 'your email'}.`);
      }
    } catch (error) {
      if (error.message === LICENSE_EMAIL_RESEND_LIMIT_MESSAGE) {
        openSupportModal();
        return;
      }
      if (error.message === LICENSE_EMAIL_RESEND_WINDOW_EXPIRED_MESSAGE) {
        openSupportModal();
        return;
      }
      setEmailNotice(error.message || 'Could not send license email. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setLoadingOrder(false);
      return undefined;
    }

    const pendingVerification =
      pendingVerificationRef.current?.orderId === orderId
        ? pendingVerificationRef.current
        : null;

    const loadOrderData = async () => {
      setLoadingOrder(true);

      try {
        if (pendingVerification) {
          pendingVerificationRef.current = null;
          setLoadingOrderLabel('Confirming your payment...');

          const verifyResponse =
            pendingVerification.provider === 'paypal'
              ? await paymentAPI.capturePayPalPayment({
                  orderId,
                  paypalOrderId: pendingVerification.paypalOrderId,
                  clearCart: true,
                })
              : await paymentAPI.verifyRazorpayPayment({
                  orderId,
                  razorpay_order_id: pendingVerification.razorpay_order_id,
                  razorpay_payment_id: pendingVerification.razorpay_payment_id,
                  razorpay_signature: pendingVerification.razorpay_signature,
                  clearCart: true,
                });

          window.history.replaceState({}, '', `${location.pathname}${location.search}`);

          if (verifyResponse.success && verifyResponse.data?.order) {
            setOrder(verifyResponse.data.order);
            if (verifyResponse.data.order.orderNumber) {
              previewOrderNumberRef.current = verifyResponse.data.order.orderNumber;
            }
            try {
              await clearCart();
            } catch (error) {
              console.error('Failed to clear cart after payment:', error);
            }

            if (
              verifyResponse.data.order.paymentStatus === 'paid' &&
              verifyResponse.data.order.items?.length
            ) {
              return;
            }
          } else if (!verifyResponse.success) {
            console.error('Payment verification failed:', verifyResponse.message);
          }
        }

        setLoadingOrderLabel('Loading order...');
        const response = await orderAPI.getOrder(orderId);
        if (response.success && response.data?.order) {
          setOrder(response.data.order);
          if (response.data.order.orderNumber) {
            previewOrderNumberRef.current = response.data.order.orderNumber;
          }
        }
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setLoadingOrder(false);
      }
    };

    loadOrderData();
  }, [orderId, location.pathname, location.search, clearCart]);

  useEffect(() => {
    if (!showConfirmingInitiallyRef.current) return undefined;

    const timer = window.setTimeout(() => {
      setShowConfirmingPopup(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const windowEndsAt = order?.licenseEmailResendWindowEndsAt;
    if (!windowEndsAt) {
      setResendWindowRemainingMs(0);
      return undefined;
    }

    const updateWindow = () => {
      const remaining = new Date(windowEndsAt).getTime() - Date.now();
      setResendWindowRemainingMs(Math.max(0, remaining));
    };

    updateWindow();
    const intervalId = window.setInterval(updateWindow, 1000);
    return () => window.clearInterval(intervalId);
  }, [order?.licenseEmailResendWindowEndsAt]);

  if (showConfirmingPopup) {
    return <OrderConfirmingModal open />;
  }

  if (loadingOrder) {
    return <PageLoader fullScreen label={loadingOrderLabel} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
        <div className="relative bg-white px-6 pb-5 pt-6 text-center">
          <button
            type="button"
            onClick={handleContinue}
            aria-label={location.state?.fromOrders ? 'Back to My Orders' : 'Continue shopping'}
            className="absolute right-4 top-4 rounded-full p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700"
          >
            <IconClose className="h-5 w-5" strokeWidth={3} />
          </button>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order confirm &amp; License Issued</h1>
          <p className="mt-1 text-sm text-gray-500">Order #{orderNumber}</p>
        </div>

        {isPaid && orderItems.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-100 px-6 py-4">
            <div className="divide-y divide-slate-200/80">
              {orderItems.map((item, index) => (
                <div
                  key={`${item.productId}-${item.licenseNumber}-${index}`}
                  className={index > 0 ? 'pt-4' : ''}
                >
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <p>
                      Clip ID: <span className="font-mono font-medium text-gray-900">{item.clipId || '—'}</span>
                    </p>
                    <p>
                      License tier: <span className="font-medium text-gray-900">{item.imageSize || 'Standard'}</span>
                    </p>
                    <p>
                      License No: <span className="font-mono font-medium text-gray-900">{item.licenseNumber || '—'}</span>
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-bold text-gray-900">
                    Download link sent to your Email only.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isPaid && orderItems.length > 0 && (
          <div className="border-t border-emerald-200 bg-emerald-50 px-6 py-4">
            <p className="text-xs leading-relaxed text-emerald-950">
              Save this license for your records — download the certificate below or take a screenshot of this page.
            </p>
            <button
              type="button"
              onClick={handleDownloadLicense}
              disabled={downloadingCertificate}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              {downloadingCertificate ? 'Downloading…' : 'Download license certificate'}
            </button>
          </div>
        )}

        <div className="border-t border-blue-200 bg-blue-50 px-6 py-4 text-sm text-blue-950">
          <p className="font-semibold">License email</p>
          <p className="mt-1 leading-relaxed text-blue-900">
            License details, your video download link, and your license certificate (including usage terms) were sent to{' '}
            <span className="font-medium">{customerEmail || 'your email'}</span>.
            Please check your inbox and spam folder.
          </p>
          {isResendWindowOpen && resendsRemaining > 0 && (
            <p className="mt-2 text-xs text-blue-800">
              Resend available for {formatResendWindowLabel(resendWindowRemainingMs)} ({resendsRemaining} left).
            </p>
          )}
          {!isResendWindowOpen && resendsRemaining > 0 && (
            <p className="mt-2 text-xs text-blue-800">
              The 5-minute resend window has ended. Contact support if you need help.
            </p>
          )}
          {emailNotice && <p className="mt-2 text-xs font-medium text-blue-950">{emailNotice}</p>}
          {isPaid && orderId && resendsRemaining > 0 && isResendWindowOpen && (
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendingEmail}
              className="mt-3 rounded-lg bg-blue-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resendingEmail ? 'Sending...' : 'Resend license email'}
            </button>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm">
          <p className="font-semibold text-gray-900">Seller details</p>
          <p className="mt-2 font-medium text-gray-900">{BRAND.name}</p>
          <p className="mt-1 text-xs text-gray-600">GSTIN: {BRAND.gstNumber}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">{BRAND.companyAddress}</p>
        </div>

        <div className="space-y-2 border-t border-gray-200 bg-stone-100 px-6 py-4 text-sm">
          <OrderAmountSummary order={order} totalLabel="Total paid" />
          <div className="flex justify-between gap-4 pt-2">
            <span className="text-gray-600">Payment</span>
            <span className="font-medium text-gray-900">Online Payment</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Date</span>
            <span className="font-medium text-gray-900">{orderDateLabel}</span>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-5">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            {location.state?.fromOrders ? 'Back to My Orders' : 'Continue Shopping'}
          </button>
        </div>
      </div>

      {showSupportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-title"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 id="support-title" className="text-center text-lg font-bold text-gray-900">
              Contact Support
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-gray-600">
              {LICENSE_EMAIL_RESEND_LIMIT_MESSAGE}
            </p>
            <Link
              to={`/support?subject=license_email&email=${encodeURIComponent(customerEmail)}&order=${encodeURIComponent(orderNumber)}&message=${encodeURIComponent('I need help receiving my license/download email.')}`}
              className="mt-4 flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              onClick={() => setShowSupportModal(false)}
            >
              Open Support Form
            </Link>
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="mt-3 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccess;
