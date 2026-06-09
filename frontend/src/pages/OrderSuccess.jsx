import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../services/commerceApi';
import { formatCurrency } from '../utils/formatters';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const [isVisible, setIsVisible] = useState(false);
  const [order, setOrder] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingDownloads, setLoadingDownloads] = useState(false);

  const paymentMethod = searchParams.get('method') || order?.paymentMethod || 'online';
  const orderId = searchParams.get('orderId') || '';
  const orderNumber = order?.orderNumber?.slice(-8).toUpperCase() || '--------';
  const orderTotal = order?.totalAmount || 0;

  const estimatedDelivery = new Date();
  estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 5);

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

  useEffect(() => {
    if (!orderId) return;

    const fetchDownloads = async () => {
      setLoadingDownloads(true);
      try {
        const response = await orderAPI.getOrderDownloads(orderId);
        if (response.success) {
          setDownloads(response.data.downloads || []);
        }
      } catch (error) {
        console.error('Failed to fetch downloads:', error);
      } finally {
        setLoadingDownloads(false);
      }
    };

    fetchDownloads();
  }, [orderId]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsVisible(false);
          setTimeout(() => navigate('/'), 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleContinueShopping = () => {
    setIsVisible(false);
    setTimeout(() => navigate('/'), 300);
  };

  const paymentLabel =
    paymentMethod === 'COD' ? 'Invoice / Net 30' : 'Online Payment';

  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-12 transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div
        className={`max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-center transform transition-all duration-500 ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
        }`}
      >
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center relative">
            <svg className="w-14 h-14 text-green-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Order Placed Successfully!
        </h1>

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-600">Order Number:</span>
            <span className="text-sm font-bold text-gray-900">#{orderNumber}</span>
          </div>
        </div>

        <p className="text-gray-600 mb-6 text-lg">
          Your license order has been confirmed. Download your files below.
        </p>

        {(loadingDownloads || downloads.length > 0) && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
            <p className="mb-3 text-sm font-semibold text-gray-900">Your Downloads</p>
            {loadingDownloads ? (
              <p className="text-sm text-gray-500">Preparing download links...</p>
            ) : (
              <div className="space-y-4">
                {downloads.map((item) => (
                  <div key={`${item.productId}-${item.imageSize}`} className="rounded-md border border-gray-200 bg-white p-3">
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="mb-2 text-xs text-gray-500">{item.imageSize} resolution</p>
                    {item.files?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {item.files.map((file) => (
                          <a
                            key={`${file.type}-${file.label}`}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                          >
                            Download {file.label}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600">
                        {item.message || 'Files not available yet.'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-blue-900 uppercase">Instant Access</span>
            </div>
            <p className="text-sm font-semibold text-blue-700">
              {estimatedDelivery.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            <p className="text-xs text-blue-600 mt-1">Download ready within minutes</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-xs font-semibold text-purple-900 uppercase">Payment Method</span>
            </div>
            <p className="text-sm font-semibold text-purple-700">{paymentLabel}</p>
          </div>
        </div>

        {orderTotal > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-semibold text-gray-900">Order Summary</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Total</span>
                <span className="font-semibold text-gray-900">{formatCurrency(orderTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium text-gray-900">{paymentLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date</span>
                <span className="font-medium text-gray-900">
                  {(order?.createdAt ? new Date(order.createdAt) : new Date()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-2">Order Timeline</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-gray-600">Order confirmed</span>
                  <span className="text-xs text-gray-400 ml-auto">Just now</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-gray-600">Processing license</span>
                  <span className="text-xs text-gray-400 ml-auto">Complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-gray-600">Download ready</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {order?.billingAddress?.email
                      ? `Sent to ${order.billingAddress.email}`
                      : 'Email sent'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p>
              Redirecting to home in{' '}
              <span className="font-bold text-gray-700 text-sm">{countdown}</span>{' '}
              second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((10 - countdown) / 10) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleContinueShopping}
            className="w-full bg-gradient-to-r from-black to-gray-800 text-white py-3.5 rounded-xl hover:from-gray-800 hover:to-black transition-all duration-300 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
