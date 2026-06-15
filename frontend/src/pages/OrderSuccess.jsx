import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../services/commerceApi';
import { BRAND } from '../config/brand';
import {
  LICENSE_EMAIL_RESEND_LIMIT_MESSAGE,
  MAX_LICENSE_EMAIL_RESENDS,
} from '../constants/email';
import { formatCurrency } from '../utils/formatters';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState('');
  const [showSupportModal, setShowSupportModal] = useState(false);

  const orderId = searchParams.get('orderId') || '';
  const orderNumber = order?.orderNumber?.slice(-8).toUpperCase() || '--------';
  const orderTotal = order?.totalAmount || 0;
  const customerEmail = order?.billingAddress?.email || '';
  const orderItems = order?.items || [];
  const maxResends = order?.maxLicenseEmailResends ?? MAX_LICENSE_EMAIL_RESENDS;
  const resendCount = order?.licenseEmailResendCount ?? 0;
  const resendsRemaining = order?.licenseEmailResendsRemaining ?? Math.max(0, maxResends - resendCount);
  const canResendEmail = resendsRemaining > 0;

  const paymentPending =
    order?.paymentMethod === 'online' &&
    order?.paymentStatus === 'pending' &&
    order?.status === 'pending';

  const isPaid = order?.paymentStatus === 'paid';

  const openSupportModal = () => setShowSupportModal(true);

  const handleResendEmail = async () => {
    if (!orderId || resendingEmail) return;

    if (!canResendEmail) {
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
      setEmailNotice(error.message || 'Could not send license email. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setLoadingOrder(false);
      return;
    }

    const fetchOrderData = async () => {
      setLoadingOrder(true);
      try {
        const response = await orderAPI.getOrder(orderId);
        if (response.success) {
          setOrder(response.data.order);
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  if (loadingOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (paymentPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-lg">
          <h1 className="text-xl font-bold text-gray-900">Payment Not Completed</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please return to checkout and complete your payment.
          </p>
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="mt-5 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">License Issued</h1>
          <p className="mt-1 text-sm text-gray-500">Order #{orderNumber}</p>
        </div>

        {isPaid && orderItems.length > 0 && (
          <div className="mt-5 space-y-3">
            {orderItems.map((item, index) => (
              <div
                key={`${item.productId}-${item.licenseNumber}-${index}`}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
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
                <p className="mt-3 text-xs text-blue-800">
                  Download link sent to your email only.
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-semibold">License email</p>
          <p className="mt-1 leading-relaxed text-blue-800">
            License details and your video download link were sent to{' '}
            <span className="font-medium">{customerEmail || 'your email'}</span>.
            Please check your inbox and spam folder.
          </p>
          {canResendEmail && (
            <p className="mt-2 text-xs text-blue-700">
              You can resend the license email {resendsRemaining} more time{resendsRemaining === 1 ? '' : 's'}.
            </p>
          )}
          {emailNotice && <p className="mt-2 text-xs font-medium text-blue-900">{emailNotice}</p>}
          {isPaid && orderId && (
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendingEmail}
              className="mt-3 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-900 transition hover:bg-blue-100 disabled:opacity-60"
            >
              {resendingEmail ? 'Sending...' : 'Resend license email'}
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Total paid</span>
            <span className="font-semibold text-gray-900">{formatCurrency(orderTotal)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Payment</span>
            <span className="font-medium text-gray-900">Online Payment</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Date</span>
            <span className="font-medium text-gray-900">
              {(order?.createdAt ? new Date(order.createdAt) : new Date()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-5 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Continue Shopping
        </button>
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
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <p>
                Email:{' '}
                <a href={`mailto:${BRAND.supportEmail}`} className="font-medium text-gray-900 underline">
                  {BRAND.supportEmail}
                </a>
              </p>
              <p className="mt-2">
                Phone: <span className="font-medium text-gray-900">{BRAND.supportPhone}</span>
              </p>
            </div>
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
