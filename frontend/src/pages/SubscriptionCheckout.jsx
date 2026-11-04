import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { subscriptionAPI } from '../services/subscriptionApi';
import { useAuth } from '../context/AuthContext';
import { openRazorpayCheckout } from '../utils/razorpay';
import PageLoader from '../components/ui/PageLoader';
import { BRAND } from '../config/brand';
import PhoneCountryInput, { isPhoneNumberValid, normalizePhoneValue } from '../components/ui/PhoneCountryInput';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);

const SubscriptionCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const { user, isAuthenticated } = useAuth();

  const [paymentProvider, setPaymentProvider] = useState('razorpay');
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [usdInrRate, setUsdInrRate] = useState(null);
  const [paypalVerifying, setPaypalVerifying] = useState(false);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [enteredWhatsappNumber, setWhatsappNumber] = useState(null);
  const whatsappNumber = enteredWhatsappNumber ?? normalizePhoneValue(user?.phone || '');
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: `/subscriptions/checkout?planId=${planId || ''}` },
      });
      return;
    }

    if (!planId) {
      navigate('/subscriptions');
      return;
    }

    const fetchPlan = async () => {
      setLoading(true);
      try {
        const res = await subscriptionAPI.getPublicPlans();
        const rate = Number(res.data?.usdInrRate);
        setUsdInrRate(Number.isFinite(rate) && rate > 0 ? rate : null);
        setPaypalEnabled(Boolean(res.data?.providers?.paypal) && Number.isFinite(rate) && rate > 0);
        const found = (res.data?.plans || []).find((p) => p._id === planId);
        if (!found) {
          setError('Subscription plan not found or no longer available.');
        } else {
          setPlan(found);
        }
      } catch (err) {
        setError(err.message || 'Failed to load plan details');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, isAuthenticated, navigate]);

  const subtotal = Number(plan?.price) || 0;
  const gstRate = Number(plan?.gstPercentage !== undefined ? plan.gstPercentage : 18);
  const gstAmount = Math.round((subtotal * gstRate) / 100);
  const totalPayable = subtotal + gstAmount;

  const displayPrice = (amount) => paymentProvider === 'paypal' && usdInrRate
    ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.round(amount / usdInrRate * 100) / 100)} USD`
    : formatCurrency(amount);

  const isPhoneValid = Boolean(
    whatsappNumber && (isPhoneNumberValid(whatsappNumber) || String(whatsappNumber).replace(/\D/g, '').length >= 10)
  );
  const isFormReady = isPhoneValid && agreePolicy && agreeTerms;

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!isPhoneValid) {
      setValidationError('Please enter a valid WhatsApp mobile number with country code.');
      return;
    }

    if (!agreePolicy) {
      setValidationError('Please agree to the Subscription Terms & Editorial Content Usage Policy.');
      return;
    }

    if (!agreeTerms) {
      setValidationError('Please agree to the Terms and Conditions and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formattedWhatsapp = normalizePhoneValue(whatsappNumber) || whatsappNumber;

      const res = await subscriptionAPI.createCheckout(plan._id, paymentProvider, {
        whatsappNumber: formattedWhatsapp,
        policyAgreed: true,
      });

      const { directActive, razorpay, paypal, subscriptionId } = res.data;

      if (directActive) {
        navigate(`/subscriptions/success?subscriptionId=${res.data.subscription?._id || ''}`, {
          state: { subscription: res.data.subscription },
        });
        return;
      }

      if (paypal?.approvalUrl) {
        window.location.assign(paypal.approvalUrl);
        return;
      }

      if (!razorpay?.subscriptionId && !razorpay?.orderId) {
        throw new Error('Payment gateway not available for subscriptions');
      }

      await openRazorpayCheckout({
        key: razorpay.keyId,
        subscriptionId: razorpay.subscriptionId,
        orderId: razorpay.orderId,
        amount: razorpay.amount || totalPayable,
        currency: razorpay.currency || 'INR',
        name: BRAND.name || 'AKHD Media & Co.',
        description: `${plan.name} (${plan.interval})`,
        preferredMethod: 'all',
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: formattedWhatsapp || user?.phone || '',
        },
        onSuccess: async (paymentResponse) => {
          try {
            const verifyRes = await subscriptionAPI.verifyPayment({
              subscriptionId,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_subscription_id: paymentResponse.razorpay_subscription_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });
            navigate(`/subscriptions/success?subscriptionId=${subscriptionId}`, {
              state: {
                subscriptionId,
                paymentResponse,
                verifiedSubscription: verifyRes?.data?.subscription,
              },
            });
          } catch (verifyErr) {
            setValidationError(verifyErr.message || 'Payment verification failed');
            setIsSubmitting(false);
          }
        },
        onDismiss: () => {
          setIsSubmitting(false);
        },
      });
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to initiate payment. Please try again.';
      setValidationError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paypalReturnId = searchParams.get('paypalSubscription');
  const verifyPaypal = async () => {
    setPaypalVerifying(true);
    setValidationError('');
    try {
      const res = await subscriptionAPI.verifyPayPalPayment(paypalReturnId);
      navigate(`/subscriptions/success?subscriptionId=${paypalReturnId}`, {
        replace: true,
        state: { subscriptionId: paypalReturnId, verifiedSubscription: res.data.subscription },
      });
    } catch (err) {
      setValidationError(err.response?.data?.message || err.message || 'Payment verification failed. Please retry.');
    } finally {
      setPaypalVerifying(false);
    }
  };

  if (paypalReturnId && isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Confirm your PayPal subscription</h1>
        <p className="mt-3 text-sm text-gray-600">Confirm your payment to activate access. If PayPal is still processing it, wait a moment and retry.</p>
        {validationError && <p role="alert" className="mt-4 text-sm text-red-700">{validationError}</p>}
        <button onClick={verifyPaypal} disabled={paypalVerifying} className="mt-6 rounded-xl bg-gray-900 px-6 py-3 text-white disabled:opacity-50">
          {paypalVerifying ? 'Checking payment…' : 'Confirm payment'}
        </button>
        <Link to="/subscriptions" className="mt-4 block text-sm underline">Back to subscriptions</Link>
      </div>
    );
  }

  if (loading) {
    return <PageLoader />;
  }

  if (error || !plan) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 max-w-md">
          <p className="text-base font-bold text-red-900">{error || 'Plan not found'}</p>
          <Link
            to="/subscriptions"
            className="mt-4 inline-block rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-gray-800"
          >
            ← View All Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/70 pb-20 pt-6 sm:pt-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/subscriptions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 transition hover:text-gray-900 sm:text-sm"
          >
            ← Back to All Plans
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Confirm Subscription Details
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Provide your WhatsApp mobile number for daily video delivery and accept the editorial license terms before payment.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Form Column: WhatsApp & Agreement in One Card */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 space-y-6">
              {/* WhatsApp Mobile Number Section */}
              <div>
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <svg className="h-10 w-10 shrink-0 drop-shadow-sm" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="24" fill="#25D366" />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M24 8C15.163 8 8 15.163 8 24c0 3.013.834 5.834 2.284 8.243L8.5 39.5l7.46-1.748A15.93 15.93 0 0024 40c8.837 0 16-7.163 16-16S32.837 8 24 8zm0 29.333a13.28 13.28 0 01-6.772-1.848l-.485-.288-4.444 1.042 1.19-4.33-.316-.503A13.284 13.284 0 0110.667 24c0-7.364 5.97-13.333 13.333-13.333 7.364 0 13.333 5.969 13.333 13.333 0 7.364-5.969 13.333-13.333 13.333zm7.322-9.98c-.4-.2-2.368-1.168-2.735-1.301-.367-.134-.634-.2-.9.2-.267.4-1.034 1.301-1.267 1.568-.234.267-.467.3-.867.1-.4-.2-1.69-.623-3.218-1.986-1.189-1.06-1.992-2.37-2.225-2.77-.234-.4-.025-.617.175-.816.18-.18.4-.467.6-.7.2-.234.267-.4.4-.667.133-.267.067-.5-.033-.7-.1-.2-.9-2.169-1.234-2.969-.325-.78-.656-.674-.9-.686l-.768-.014c-.267 0-.7.1-1.067.5-.367.4-1.4 1.368-1.4 3.335s1.433 3.869 1.633 4.136c.2.267 2.822 4.31 6.836 6.042.955.412 1.7.658 2.28.843.959.305 1.832.262 2.522.159.77-.115 2.368-.968 2.702-1.902.333-.934.333-1.735.233-1.902-.1-.167-.367-.267-.767-.467z"
                      fill="#FFFFFF"
                    />
                  </svg>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Enter your WhatsApp mobile number
                    </h2>
                    <p className="text-xs text-emerald-700 font-medium">
                      Required for daily video delivery &amp; group creation
                    </p>
                  </div>
                </div>

                {/* WhatsApp Message without card design */}
                <p className="mt-3 text-xs leading-relaxed text-gray-600">
                  Please enter your WhatsApp mobile number below. A separate WhatsApp group will be created for you where you will receive the latest videos and exclusive content on a daily basis.
                </p>

                <div className="mt-4">
                  <label htmlFor="subscription-whatsapp" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    WhatsApp Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <PhoneCountryInput
                    id="subscription-whatsapp"
                    name="whatsappNumber"
                    value={whatsappNumber}
                    onChange={(nextVal) => {
                      setWhatsappNumber(nextVal || '');
                      if (validationError) setValidationError('');
                    }}
                  />
                </div>
              </div>

              {/* Divider & Terms & Policy Agreement Section */}
              <div className="border-t border-gray-100 pt-5 space-y-3.5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Terms &amp; Policy Agreement
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Please review and accept our subscription and usage policies before proceeding to payment.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreePolicy}
                      onChange={(e) => {
                        setAgreePolicy(e.target.checked);
                        if (validationError) setValidationError('');
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      required
                    />
                    <span className="text-xs font-semibold text-gray-800 leading-normal">
                      I have read and agree to the{' '}
                      <Link
                        to="/subscription-policy"
                        target="_blank"
                        className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
                      >
                        Subscription Terms &amp; Editorial Content Usage Policy
                      </Link>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        if (validationError) setValidationError('');
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      required
                    />
                    <span className="text-xs font-semibold text-gray-800 leading-normal">
                      I have read and agree to the{' '}
                      <Link
                        to="/terms-and-conditions"
                        target="_blank"
                        className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
                      >
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/privacy-policy"
                        target="_blank"
                        className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                {validationError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {validationError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order & Plan Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 sticky top-24">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Selected Plan
              </span>
              <h3 className="mt-2 text-xl font-bold text-gray-900">{plan.name}</h3>
              {plan.tagline && <p className="text-xs text-gray-500 mt-0.5">{plan.tagline}</p>}

              <div className="mt-4 border-t border-b border-gray-100 py-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Billing Cycle</span>
                  <span className="font-bold text-gray-900 capitalize">{plan.interval}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Website Video Downloads</span>
                  <span className="font-bold text-blue-700">{plan.videoQuota} Videos</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Footage Resolution</span>
                  <span className="font-bold text-gray-900">4K-UHD RAW Masters</span>
                </div>
              </div>

              {/* Price Breakdown: Subtotal, GST, Total Payable */}
              <div className="mt-4 border-t border-gray-100 pt-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-semibold text-gray-900">{displayPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">
                    GST {gstRate > 0 ? `(${gstRate}%)` : ''}
                  </span>
                  <span className="font-semibold text-gray-900">{displayPrice(gstAmount)}</span>
                </div>
              </div>

              <div className="mt-3 border-t border-gray-100 pt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-gray-900">Total payable</span>
                  <p className="text-[11px] text-gray-400">Inclusive of GST &amp; digital licensing</p>
                </div>
                <span className="text-2xl font-black text-gray-900">
                  {displayPrice(totalPayable)}
                </span>
              </div>

              {subtotal > 0 && (
                <fieldset className="mt-5 space-y-2" disabled={isSubmitting}>
                  <legend className="text-sm font-bold text-gray-900">Payment method</legend>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="provider" checked={paymentProvider === 'razorpay'} onChange={() => { setPaymentProvider('razorpay'); }} />
                    Razorpay · India
                  </label>
                  {paypalEnabled && <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="provider" checked={paymentProvider === 'paypal'} onChange={() => { setPaymentProvider('paypal'); }} />
                    PayPal · International (USD)
                  </label>}
                  <p className="text-xs text-gray-600">Your subscription renews automatically each billing cycle until you cancel in your account.</p>
                </fieldset>
              )}
              {searchParams.get('paypalCancelled') && <p role="status" className="mt-3 text-sm text-gray-600">PayPal setup was cancelled. You can try again.</p>}
              {paymentProvider === 'paypal' && <p role="status" className="mt-3 text-xs text-gray-600">Prices are converted to USD. Approve automatic renewal on PayPal to complete your subscription.</p>}
              {/* Action Button */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={!isFormReady || isSubmitting}
                  className={`w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition ${
                    isFormReady && !isSubmitting
                      ? 'bg-gray-900 hover:bg-gray-800 active:scale-[0.99] cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isSubmitting
                    ? 'Processing Payment Gateway...'
                    : `Proceed to Payment · ${displayPrice(totalPayable)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;

