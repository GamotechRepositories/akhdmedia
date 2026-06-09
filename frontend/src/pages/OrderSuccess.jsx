import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../services/commerceApi';
import { formatCurrency } from '../utils/formatters';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const paymentMethod = searchParams.get('method') || order?.paymentMethod || 'online';
  const orderId = searchParams.get('orderId') || '';
  const orderNumber = order?.orderNumber?.slice(-8).toUpperCase() || '--------';
  const orderTotal = order?.totalAmount || 0;
  const customerEmail = order?.billingAddress?.email || '';

  const paymentLabel = paymentMethod === 'COD' ? 'Invoice / Net 30' : 'Online Payment';

  const paymentPending =
    order?.paymentMethod === 'online' &&
    order?.paymentStatus === 'pending' &&
    order?.status === 'pending';

  useEffect(() => {
    if (!orderId) {
      setLoadingOrder(false);
      return;
    }

    const fetchOrder = async () => {
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

    fetchOrder();
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
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Placed!</h1>
          <p className="mt-1 text-sm text-gray-500">Order #{orderNumber}</p>
        </div>

        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-semibold">Download link coming to your email</p>
          <p className="mt-1 leading-relaxed text-blue-800">
            We will send the download link to{' '}
            <span className="font-medium">{customerEmail || 'your email'}</span>. Check your inbox
            and download from there.
          </p>
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Total paid</span>
            <span className="font-semibold text-gray-900">{formatCurrency(orderTotal)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Payment</span>
            <span className="font-medium text-gray-900">{paymentLabel}</span>
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
    </div>
  );
};

export default OrderSuccess;
