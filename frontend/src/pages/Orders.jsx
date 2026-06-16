import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AlertModal from '../components/AlertModal';
import { getUserOrders } from '../services/authApi';
import { formatCurrency } from '../utils/formatters';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const shortOrderNumber = (orderNumber = '') => orderNumber.slice(-8).toUpperCase();

const paymentStatusClass = (status) => {
  if (status === 'paid') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

const paymentStatusLabel = (status) => {
  if (status === 'paid') return 'Paid';
  if (status === 'pending') return 'Payment pending';
  if (status === 'failed') return 'Failed';
  return status || 'Unknown';
};

const Orders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const orderRefs = useRef(new Map());

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await getUserOrders();
        setOrders(response.data?.orders || []);
      } catch (loadError) {
        setError(loadError.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  useEffect(() => {
    const focusOrderId = location.state?.focusOrderId;
    if (!focusOrderId || loading) return;

    const target = orderRefs.current.get(focusOrderId);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('ring-2', 'ring-gray-400');
    const timer = window.setTimeout(() => {
      target.classList.remove('ring-2', 'ring-gray-400');
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [location.state, loading]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f4f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-1 text-sm text-gray-500">Your latest purchases, newest first</p>
          </div>
          <Link
            to="/profile"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            Profile
          </Link>
        </div>

        {loading && (
          <div className="mt-10 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No orders yet</h2>
            <p className="mt-2 text-sm text-gray-500">When you buy clips, your orders will appear here.</p>
            <Link
              to="/videos"
              className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Browse Videos
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
              const firstItem = order.items?.[0];

              return (
                <article
                  key={order.id}
                  ref={(node) => {
                    if (node) orderRefs.current.set(order.id, node);
                    else orderRefs.current.delete(order.id);
                  }}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-gray-900">
                          Order #{shortOrderNumber(order.orderNumber)}
                        </h2>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${paymentStatusClass(order.paymentStatus)}`}
                        >
                          {paymentStatusLabel(order.paymentStatus)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{formatDate(order.createdAt)}</p>

                      <div className="mt-4 flex items-center gap-3">
                        {firstItem?.image ? (
                          <img
                            src={firstItem.image}
                            alt={firstItem.name}
                            className="h-14 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                            No image
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {firstItem?.name || 'Order items'}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            {(order.items?.length || 0) > 1 ? ` · ${order.items.length} clips` : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      <Link
                        to={`/order-success?orderId=${order.id}`}
                        state={{ fromOrders: true, orderId: order.id }}
                        className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <AlertModal
        open={Boolean(error) && !loading}
        title="Could not load orders"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  );
};

export default Orders;
