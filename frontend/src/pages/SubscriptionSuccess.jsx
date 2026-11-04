import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { subscriptionAPI } from '../services/subscriptionApi';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/ui/PageLoader';
import { BRAND } from '../config/brand';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const subscriptionId = searchParams.get('subscriptionId') || '';
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchReceipt = async () => {
      setLoading(true);
      setError('');
      try {
        if (subscriptionId) {
          const res = await subscriptionAPI.getReceipt(subscriptionId);
          if (res.data?.subscription) {
            setSubscription(res.data.subscription);
            return;
          }
        }

        // Fallback to active subscription overview
        const mySubRes = await subscriptionAPI.getMySubscription();
        if (mySubRes.data?.subscription) {
          setSubscription(mySubRes.data.subscription);
        } else {
          setError('Subscription details could not be found.');
        }
      } catch (err) {
        console.error('Failed to load subscription receipt:', err);
        setError('Could not load subscription confirmation details.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [subscriptionId]);

  if (loading) {
    return <PageLoader fullScreen label="Loading your subscription confirmation &amp; receipt..." />;
  }

  const planName =
    subscription?.planSnapshot?.name ||
    subscription?.planId?.name ||
    'Editorial Video Plan';

  const interval =
    subscription?.planSnapshot?.interval ||
    subscription?.planId?.interval ||
    'monthly';

  const subtotal =
    subscription?.subtotal ||
    subscription?.planSnapshot?.subtotal ||
    subscription?.price ||
    0;

  const gstPercentage =
    subscription?.gstPercentage !== undefined
      ? subscription.gstPercentage
      : subscription?.planSnapshot?.gstPercentage !== undefined
      ? subscription.planSnapshot.gstPercentage
      : 18;

  const gstAmount =
    subscription?.gstAmount !== undefined
      ? subscription.gstAmount
      : subscription?.planSnapshot?.gstAmount !== undefined
      ? subscription.planSnapshot.gstAmount
      : Math.round((subtotal * gstPercentage) / 100);

  const totalPaid =
    subscription?.totalAmount ||
    subscription?.amountPaid ||
    subscription?.planSnapshot?.totalPayable ||
    subtotal + gstAmount;

  const whatsappNumber =
    subscription?.whatsappNumber ||
    user?.phone ||
    'Provided Number';

  const customerEmail =
    subscription?.userId?.email ||
    user?.email ||
    '';

  const customerName =
    subscription?.userId?.name ||
    user?.name ||
    'Customer';

  const purchaseDate = subscription?.startDate
    ? new Date(subscription.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const expiryDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const refNumber = subscription?._id
    ? `SUB-${subscription._id.slice(-8).toUpperCase()}`
    : 'SUB-CONFIRMED';

  const txnId =
    subscription?.razorpayPaymentId ||
    subscription?.razorpaySubscriptionId ||
    refNumber;

  const videoQuota =
    subscription?.videoQuota ||
    subscription?.planSnapshot?.videoQuota ||
    20;

  const targetSubId = subscription?._id || subscriptionId;
  const apiUrlBase = import.meta.env.VITE_API_URL || '/api';
  const invoiceDownloadUrl = targetSubId
    ? `${apiUrlBase}/subscriptions/invoice-pdf/${targetSubId}`
    : '';

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 print:border-none print:shadow-none">
          {/* Header Banner */}
          <div className="bg-gradient-to-b from-emerald-50/70 to-white px-6 pt-8 pb-6 text-center border-b border-gray-100 print:hidden">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <svg className="h-9 w-9 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Payment Successful &amp; Subscription Activated!
            </h1>
            <p className="mt-1 text-sm font-semibold text-emerald-800">
              Thank you for subscribing to {BRAND.name}
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3.5 py-1 text-xs font-mono font-bold text-gray-600">
              <span>Receipt Ref:</span>
              <span className="text-gray-900">{refNumber}</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* WhatsApp Group Notice Box (User's Exact Requirement) */}
            <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/90 p-5 shadow-sm space-y-3 print:hidden">
              <div className="flex items-center gap-3">
                <svg className="h-9 w-9 shrink-0 drop-shadow-sm" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="#25D366" />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M24 8C15.163 8 8 15.163 8 24c0 3.013.834 5.834 2.284 8.243L8.5 39.5l7.46-1.748A15.93 15.93 0 0024 40c8.837 0 16-7.163 16-16S32.837 8 24 8zm0 29.333a13.28 13.28 0 01-6.772-1.848l-.485-.288-4.444 1.042 1.19-4.33-.316-.503A13.284 13.284 0 0110.667 24c0-7.364 5.97-13.333 13.333-13.333 7.364 0 13.333 5.969 13.333 13.333 0 7.364-5.969 13.333-13.333 13.333zm7.322-9.98c-.4-.2-2.368-1.168-2.735-1.301-.367-.134-.634-.2-.9.2-.267.4-1.034 1.301-1.267 1.568-.234.267-.467.3-.867.1-.4-.2-1.69-.623-3.218-1.986-1.189-1.06-1.992-2.37-2.225-2.77-.234-.4-.025-.617.175-.816.18-.18.4-.467.6-.7.2-.234.267-.4.4-.667.133-.267.067-.5-.033-.7-.1-.2-.9-2.169-1.234-2.969-.325-.78-.656-.674-.9-.686l-.768-.014c-.267 0-.7.1-1.067.5-.367.4-1.4 1.368-1.4 3.335s1.433 3.869 1.633 4.136c.2.267 2.822 4.31 6.836 6.042.955.412 1.7.658 2.28.843.959.305 1.832.262 2.522.159.77-.115 2.368-.968 2.702-1.902.333-.934.333-1.735.233-1.902-.1-.167-.367-.267-.767-.467z"
                    fill="#FFFFFF"
                  />
                </svg>
                <div>
                  <h2 className="text-base font-extrabold text-emerald-950">
                    Daily 4K UHD Video WhatsApp Delivery
                  </h2>
                  <p className="text-xs font-semibold text-emerald-700">
                    Dedicated Group Creation In Progress
                  </p>
                </div>
              </div>

              <p className="text-sm font-medium leading-relaxed text-emerald-950">
                We have successfully received your payment. In the next few hours a separate WhatsApp
                group will be created for you where you will keep getting all the 4K UHD videos on a
                daily basis.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 pt-1">
                <span className="font-semibold">Delivery WhatsApp Mobile Number:</span>
                <span className="font-mono font-bold text-emerald-950">
                  {whatsappNumber}
                </span>
              </div>
            </div>

            {/* Bill & Tax Invoice Receipt Section (Like Video Direct Buy with Bill) */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                    Subscription Tax Invoice &amp; Bill
                  </h3>
                  <p className="text-xs text-gray-500">Paid by {customerName}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                  PAID ✓
                </span>
              </div>

              {/* Plan Specs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block">Subscription Plan</span>
                  <span className="font-bold text-gray-900">{planName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Billing Interval</span>
                  <span className="font-bold text-gray-900 capitalize">{interval}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Active Period</span>
                  <span className="font-semibold text-gray-800">
                    {purchaseDate} {expiryDate ? `to ${expiryDate}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Website Video Downloads</span>
                  <span className="font-bold text-blue-700">{videoQuota} Videos / cycle</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal (Base Price)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST ({gstPercentage}%)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(gstAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2 text-sm font-bold text-gray-900">
                  <span>Total Paid</span>
                  <span className="text-base font-black text-emerald-800">
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
              </div>

              {/* Transaction ID */}
              <div className="border-t border-gray-200 pt-3 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
                <span>Payment Txn ID: <span className="font-mono text-gray-700">{txnId}</span></span>
                <span>Gateway: Razorpay</span>
              </div>
            </div>

            {/* Email Dispatch Notice (Plain Text, No Card Design) */}
            {customerEmail && (
              <p className="text-xs text-gray-600 text-center">
                📧 A confirmation receipt and bill has also been sent to your email{' '}
                <strong className="font-semibold text-gray-900">{customerEmail}</strong>.
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-3 print:hidden">
              <a
                href={invoiceDownloadUrl || '#'}
                download={`subscription-tax-invoice-${refNumber}.pdf`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 px-5 text-center text-sm font-bold text-white shadow-md hover:bg-gray-800 transition active:scale-[0.99] cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Official Tax Invoice (PDF)</span>
              </a>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/profile"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-100 py-3 text-center text-xs font-bold text-gray-800 hover:bg-gray-200 transition"
                >
                  Go to My Subscription
                </Link>
                <Link
                  to="/videos"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-100 py-3 text-center text-xs font-bold text-gray-800 hover:bg-gray-200 transition"
                >
                  Browse 4K Editorial Videos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;

