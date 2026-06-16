import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkoutAPI, orderAPI, paymentAPI } from '../services/commerceApi';
import { openRazorpayCheckout } from '../utils/razorpay';
import { formatCurrency } from '../utils/formatters';
import { BRAND } from '../config/brand';

const STEPS = ['billing', 'summary'];

const PURCHASE_REASONS = [
  { id: 'personal', label: 'Personal collection' },
  { id: 'digital', label: 'Digital media' },
  { id: 'outlet', label: 'Outlet media' },
  { id: 'other', label: 'Other' },
];

const emptyBilling = {
  name: '',
  email: '',
  phone: '',
  purchaseReasons: [],
  purchaseReasonOther: '',
};


const PAYMENT_OPTIONS = [
  { id: 'upi', label: 'UPI', hint: 'GPay, PhonePe, Paytm' },
  { id: 'card', label: 'Card', hint: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', hint: 'HDFC, SBI, ICICI' },
];

const LICENSE_TERMS_TEXT =
  'You may not use these videos commercially or associate them with any brand. This is illegal. If you keep them personally or a media agency uses them digitally, and they do not involve any commercial use, you may use them freely, but do not associate them with that brand.';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10';

const IconCheck = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const IconAlert = () => (
  <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const StepIndicator = ({ step }) => (
  <div className="mb-6 flex items-center justify-center gap-3">
    {[
      { id: 'billing', label: 'Billing' },
      { id: 'summary', label: 'Payment' },
    ].map((item, index) => {
      const stepIndex = STEPS.indexOf(step);
      const itemIndex = STEPS.indexOf(item.id);
      const isActive = itemIndex === stepIndex;
      const isDone = itemIndex < stepIndex;

      return (
        <div key={item.id} className="flex items-center gap-3">
          {index > 0 && <div className={`h-px w-8 sm:w-12 ${isDone ? 'bg-gray-900' : 'bg-gray-200'}`} />}
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                isDone
                  ? 'bg-gray-900 text-white'
                  : isActive
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isDone ? <IconCheck size={14} className="text-white" /> : index + 1}
            </span>
            <span className={`text-sm font-medium ${isActive || isDone ? 'text-gray-900' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

const Checkout = () => {
  const { cart, getCartTotal, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('billing');
  const [loading, setLoading] = useState(false);
  const [alertPopup, setAlertPopup] = useState(null);
  const [onlinePaymentMethod, setOnlinePaymentMethod] = useState('upi');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [billingDetails, setBillingDetails] = useState(emptyBilling);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (user) {
          setBillingDetails((prev) => ({
            ...prev,
            name: user.name || prev.name,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
          }))
          return
        }

        const response = await checkoutAPI.getProfile();
        if (response.success && response.data.billingAddress) {
          const saved = response.data.billingAddress;
          const savedReasons = Array.isArray(saved.purchaseReasons)
            ? saved.purchaseReasons
            : [];

          setBillingDetails({
            ...emptyBilling,
            name: saved.name || '',
            email: saved.email || '',
            phone: saved.phone || '',
            purchaseReasons: savedReasons.length ? [savedReasons[0]] : [],
            purchaseReasonOther: saved.purchaseReasonOther || '',
          });
        }
      } catch (profileError) {
        console.error('Failed to load billing profile:', profileError);
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!cartLoading && cart.length === 0 && !isPlacingOrder) {
      navigate('/cart');
    }
  }, [cart.length, cartLoading, navigate, isPlacingOrder]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingDetails((prev) => ({ ...prev, [name]: value }));
  };

  const togglePurchaseReason = (reasonId) => {
    setBillingDetails((prev) => {
      const isRemoving = prev.purchaseReasons[0] === reasonId;
      const purchaseReasons = isRemoving ? [] : [reasonId];

      return {
        ...prev,
        purchaseReasons,
        purchaseReasonOther:
          reasonId === 'other' && isRemoving ? '' : prev.purchaseReasonOther,
      };
    });
  };

  const showAlert = (message, title = 'Required') => {
    setAlertPopup({ title, message });
  };

  const getBillingValidationError = () => {
    if (!billingDetails.name.trim()) return 'Please enter your full name';
    if (!billingDetails.email.trim()) return 'Please enter your email address';
    if (!billingDetails.phone.trim()) return 'Please enter your phone number';
    if (!billingDetails.purchaseReasons.length) {
      return 'Please select where you will use the video';
    }
    if (
      billingDetails.purchaseReasons.includes('other') &&
      !billingDetails.purchaseReasonOther.trim()
    ) {
      return 'Please describe how you will use the video';
    }
    if (!acceptedTerms) {
      return 'Please accept the terms and conditions to continue';
    }
    return '';
  };

  const handleContinueToSummary = () => {
    const validationError = getBillingValidationError();
    if (validationError) {
      showAlert(validationError);
      return;
    }
    setStep('summary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completeOrderSuccess = async (orderId) => {
    setIsProcessingOrder(false);
    setLoading(false);
    setShowSuccessModal(true);
    await clearCart();

    setTimeout(() => {
      setShowSuccessModal(false);
      setTimeout(() => {
        navigate(`/order-success?method=online&orderId=${orderId}`);
      }, 300);
    }, 2000);
  };

  const placeOnlineOrder = async () => {
    setIsProcessingOrder(true);

    const response = await orderAPI.createOrder(billingDetails, 'online');

    if (!response.success) {
      throw new Error(response.message || 'Failed to start payment');
    }

    const { order, razorpay } = response.data;

    if (!razorpay?.orderId || !razorpay?.keyId) {
      throw new Error('Payment gateway is not available right now');
    }

    setIsProcessingOrder(false);

    await openRazorpayCheckout({
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      orderId: razorpay.orderId,
      name: BRAND.name,
      description: `Order ${order.orderNumber}`,
      preferredMethod: onlinePaymentMethod,
      prefill: {
        name: billingDetails.name,
        email: billingDetails.email,
        contact: billingDetails.phone,
      },
      onSuccess: async (paymentResponse) => {
        setLoading(true);
        const verifyResponse = await paymentAPI.verifyRazorpayPayment({
          orderId: order.id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        });

        if (!verifyResponse.success) {
          throw new Error(verifyResponse.message || 'Payment verification failed');
        }

        await completeOrderSuccess(order.id);
        return verifyResponse;
      },
      onDismiss: () => {
        setLoading(false);
        setIsPlacingOrder(false);
      },
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setIsPlacingOrder(true);

    try {
      await placeOnlineOrder();
    } catch (err) {
      setIsPlacingOrder(false);
      setIsProcessingOrder(false);
      setLoading(false);

      if (err.message === 'Payment cancelled') {
        showAlert('Payment was cancelled. Your cart is still saved.', 'Payment Cancelled');
        return;
      }

      showAlert(err.message || 'Failed to place order. Please try again.', 'Order Failed');
    }
  };

  if ((!cartLoading && cart.length === 0 && !isPlacingOrder) || cartLoading) {
    return null;
  }

  return (
    <>
      <div
        className="min-h-screen bg-[#f4f5f7]"
        style={{
          opacity: showSuccessModal ? 0.3 : 1,
          pointerEvents: showSuccessModal ? 'none' : 'auto',
        }}
      >
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4 sm:px-6">
            <div>
              <h1 className="text-base font-semibold text-gray-900">Checkout</h1>
              <p className="text-xs text-gray-500">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => (step === 'summary' ? setStep('billing') : navigate('/cart'))}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {step === 'summary' ? '← Back' : '← Cart'}
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-8">
          <StepIndicator step={step} />

          {step === 'billing' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-gray-900">Billing Details</h2>
              <p className="mt-1 text-sm text-gray-500">Download link will be sent to your email.</p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={billingDetails.name}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={billingDetails.email}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={billingDetails.phone}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Where will you use the video? <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PURCHASE_REASONS.map((reason) => {
                      const selected = billingDetails.purchaseReasons[0] === reason.id;
                      return (
                        <button
                          key={reason.id}
                          type="button"
                          onClick={() => togglePurchaseReason(reason.id)}
                          className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                            selected
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-200 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {reason.label}
                        </button>
                      );
                    })}
                  </div>
                  {billingDetails.purchaseReasons.includes('other') && (
                    <div className="mt-3">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Please specify <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="purchaseReasonOther"
                        value={billingDetails.purchaseReasonOther}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="Where will you use this video?"
                      />
                    </div>
                  )}
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">
                  I have read{' '}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setShowTermsModal(true);
                    }}
                    className="font-semibold underline underline-offset-2"
                  >
                    Terms &amp; Conditions
                  </button>{' '}
                  and agree
                </span>
              </label>

              <button
                type="button"
                onClick={handleContinueToSummary}
                disabled={!acceptedTerms}
                className="mt-6 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 'summary' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-end justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Payment</h2>
                  <p className="mt-1 text-xs text-gray-500">Secure checkout via Razorpay</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(getCartTotal())}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setOnlinePaymentMethod(option.id)}
                    className={`rounded-lg border px-4 py-3 text-left transition sm:px-2 sm:py-2.5 sm:text-center ${
                      onlinePaymentMethod === option.id
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <p className="text-sm font-bold sm:text-xs">{option.label}</p>
                    <p className={`mt-0.5 text-xs sm:text-[10px] ${onlinePaymentMethod === option.id ? 'text-gray-300' : 'text-gray-400'}`}>
                      {option.hint}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
                <p>
                  <span className="font-medium text-gray-800">{billingDetails.name}</span>
                  {' · '}
                  {billingDetails.email}
                  {' · '}
                  {billingDetails.phone}
                </p>
              </div>

              <button
                type="button"
                onClick={handlePayment}
                disabled={loading || isProcessingOrder}
                className="mt-4 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading || isProcessingOrder ? 'Opening payment...' : `Pay ${formatCurrency(getCartTotal())}`}
              </button>

              <p className="mt-3 text-center text-[11px] text-gray-400">
                By paying, you agree to {BRAND.name}&apos;s licensing terms
              </p>
            </div>
          )}
        </div>

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <IconCheck size={28} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Order confirmed</h2>
              <p className="mt-2 text-sm text-gray-600">
                Download link sent to <strong>{billingDetails.email}</strong>
              </p>
            </div>
          </div>
        )}

        {isProcessingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="rounded-xl bg-white px-8 py-6 text-center shadow-xl">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
              <p className="text-sm font-medium text-gray-900">Opening secure payment...</p>
            </div>
          </div>
        )}
      </div>

      {alertPopup && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAlertPopup(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <IconAlert />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{alertPopup.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{alertPopup.message}</p>
            <button
              type="button"
              onClick={() => setAlertPopup(null)}
              className="mt-5 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">Terms &amp; Conditions</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{LICENSE_TERMS_TEXT}</p>
            <button
              type="button"
              onClick={() => setShowTermsModal(false)}
              className="mt-5 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;
