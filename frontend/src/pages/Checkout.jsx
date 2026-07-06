import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkoutAPI, orderAPI, paymentAPI } from '../services/commerceApi';
import { openRazorpayCheckout } from '../utils/razorpay';
import { renderPayPalButtons } from '../utils/paypal';
import { formatPayableCurrency, formatUsd, convertInrToUsd } from '../utils/formatters';
import OrderAmountSummary from '../components/OrderAmountSummary';
import PageLoader from '../components/ui/PageLoader';
import PhoneCountryInput, { isPhoneNumberValid, normalizePhoneValue } from '../components/ui/PhoneCountryInput';
import { BRAND } from '../config/brand';

const STEPS = ['billing', 'summary'];

const PURCHASE_REASONS = [
  { id: 'personal', label: 'Personal collection' },
  { id: 'digital', label: 'Digital media' },
  { id: 'outlet', label: 'Media agency' },
  { id: 'other', label: 'Other' },
];

const REASONS_REQUIRING_DETAIL = ['digital', 'outlet', 'other'];

const REASON_DETAIL_CONFIG = {
  digital: {
    label: 'Company details',
    placeholder: 'Please fill your Digital Media Details',
    validationMessage: 'Please fill your Digital Media Details',
  },
  outlet: {
    label: 'Company details',
    placeholder: 'Please fill your media agency company details.',
    validationMessage: 'Please fill your media agency company details.',
  },
  other: {
    label: 'Please specify',
    placeholder: 'Where will you use this video?',
    validationMessage: 'Please describe how you will use the video',
  },
};

const emptyBilling = {
  name: '',
  email: '',
  phone: '',
  purchaseReasons: [],
  purchaseReasonOther: '',
};


const PAYMENT_GATEWAYS = [
  { id: 'razorpay', label: 'Razorpay', subtitle: 'UPI, cards & net banking' },
  { id: 'paypal', label: 'PayPal', subtitle: 'Pay with PayPal account or card' },
];

const PAYMENT_OPTIONS = [
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
  { id: 'netbanking', label: 'Net Banking' },
];

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

const IconUpi = ({ className = 'h-7 w-7' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 9h6M9 13h4" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 3l2 2-2 2" />
  </svg>
);

const IconCard = ({ className = 'h-7 w-7' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <rect x="2" y="5" width="20" height="14" rx="2.5" strokeWidth={1.75} />
    <path strokeLinecap="round" strokeWidth={1.75} d="M2 10h20" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 15h4" />
  </svg>
);

const IconNetBanking = ({ className = 'h-7 w-7' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M4 10h16M6 10V19M10 10V19M14 10V19M18 10V19M3 19h18M12 3l9 7H3l9-7z"
    />
  </svg>
);

const PAYMENT_OPTION_ICONS = {
  upi: IconUpi,
  card: IconCard,
  netbanking: IconNetBanking,
};

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
  const {
    cart,
    getCartTotal,
    getCartSubtotal,
    getCartGstTotal,
    appliedPromo,
    discountAmount,
    loading: cartLoading,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('billing');
  const [loading, setLoading] = useState(false);
  const [alertPopup, setAlertPopup] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [billingDetails, setBillingDetails] = useState(emptyBilling);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedLicensePolicy, setAcceptedLicensePolicy] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState('razorpay');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalContainerId = 'paypal-button-container';
  const paypalOrderRef = useRef(null);

  useEffect(() => {
    const loadPaymentConfig = async () => {
      try {
        const response = await paymentAPI.getConfig();
        if (response.success) {
          setPaymentConfig(response.data);
          if (response.data?.paypal?.enabled && !response.data?.razorpay?.enabled) {
            setPaymentProvider('paypal');
          }
        }
      } catch (configError) {
        console.error('Failed to load payment config:', configError);
      }
    };

    loadPaymentConfig();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (user) {
          setBillingDetails((prev) => ({
            ...prev,
            name: user.name || prev.name,
            email: user.email || prev.email,
            phone: normalizePhoneValue(user.phone || prev.phone),
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
            phone: normalizePhoneValue(saved.phone || ''),
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

  const selectPurchaseReason = (reasonId) => {
    setBillingDetails((prev) => ({
      ...prev,
      purchaseReasons: [reasonId],
      purchaseReasonOther: prev.purchaseReasons[0] === reasonId ? prev.purchaseReasonOther : '',
    }));
  };

  const showAlert = (message, title = 'Required') => {
    setAlertPopup({ title, message });
  };

  const getBillingValidationError = () => {
    if (!billingDetails.name.trim()) return 'Please enter your full name';
    if (!billingDetails.email.trim()) return 'Please enter your email address';
    if (!billingDetails.phone.trim()) return 'Please enter your phone number';
    if (!isPhoneNumberValid(billingDetails.phone)) return 'Please enter a valid phone number';
    if (!billingDetails.purchaseReasons.length) {
      return 'Please select where you will use the video';
    }
    const selectedReason = billingDetails.purchaseReasons[0];
    if (
      REASONS_REQUIRING_DETAIL.includes(selectedReason) &&
      !billingDetails.purchaseReasonOther.trim()
    ) {
      return REASON_DETAIL_CONFIG[selectedReason]?.validationMessage || 'Please provide required details';
    }
    if (!acceptedTerms) {
      return 'Please accept the terms and conditions to continue';
    }
    if (!acceptedLicensePolicy) {
      return 'Please accept the License Information Policy to continue';
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

  const completeOrderSuccess = (orderId, paymentResponse, orderNumber = '', provider = 'razorpay') => {
    setIsProcessingOrder(false);
    setLoading(false);
    setIsPlacingOrder(false);
    navigate(`/order-success?method=${provider}&orderId=${orderId}`, {
      replace: true,
      state: {
        showConfirmingOverlay: true,
        previewOrderNumber: orderNumber,
        pendingPaymentVerification:
          provider === 'paypal'
            ? {
                provider: 'paypal',
                orderId,
                paypalOrderId: paymentResponse.paypalOrderId,
              }
            : {
                provider: 'razorpay',
                orderId,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
      },
    });
  };

  const placeOnlineOrder = async (paymentMethod) => {
    setIsProcessingOrder(true);

    const response = await orderAPI.createOrder(billingDetails, 'online', paymentProvider);

    if (!response.success) {
      throw new Error(response.message || 'Failed to start payment');
    }

    const { order, razorpay } = response.data;

    if (paymentProvider === 'razorpay') {
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
        preferredMethod: paymentMethod,
        prefill: {
          name: billingDetails.name,
          email: billingDetails.email,
          contact: billingDetails.phone,
        },
        onSuccess: (paymentResponse) => {
          completeOrderSuccess(order.id, paymentResponse, order.orderNumber, 'razorpay');
          return { success: true };
        },
        onDismiss: () => {
          setLoading(false);
          setIsPlacingOrder(false);
        },
      });
      return;
    }

    throw new Error('Use PayPal to complete this payment');
  };

  const preparePayPalCheckout = async () => {
    if (loading || isProcessingOrder) return;

    setLoading(true);
    setIsPlacingOrder(true);
    setIsProcessingOrder(true);
    setPaypalReady(false);

    try {
      const response = await orderAPI.createOrder(billingDetails, 'online', 'paypal');
      if (!response.success) {
        throw new Error(response.message || 'Failed to start payment');
      }

      const { order, paypal } = response.data;
      if (!paypal?.orderId || !paymentConfig?.paypal?.clientId) {
        throw new Error('PayPal is not available right now');
      }

      paypalOrderRef.current = { order, paypalOrderId: paypal.orderId };
      setIsProcessingOrder(false);

      await renderPayPalButtons({
        clientId: paymentConfig.paypal.clientId,
        currency: paymentConfig.paypal.currency || paypal.currency || 'INR',
        containerId: paypalContainerId,
        paypalOrderId: paypal.orderId,
        onApprove: async (paypalOrderId) => {
          completeOrderSuccess(
            order.id,
            { paypalOrderId },
            order.orderNumber,
            'paypal',
          );
        },
        onCancel: () => {
          setLoading(false);
          setIsPlacingOrder(false);
          setIsProcessingOrder(false);
        },
        onError: () => {
          setLoading(false);
          setIsPlacingOrder(false);
          setIsProcessingOrder(false);
          showAlert('PayPal payment failed. Please try again.', 'Payment Failed');
        },
      });

      setPaypalReady(true);
      setLoading(false);
      setIsPlacingOrder(false);
    } catch (err) {
      setIsPlacingOrder(false);
      setIsProcessingOrder(false);
      setLoading(false);
      showAlert(err.message || 'Failed to start PayPal payment.', 'Payment Failed');
    }
  };

  useEffect(() => {
    if (step !== 'summary' || paymentProvider !== 'paypal') {
      setPaypalReady(false);
      paypalOrderRef.current = null;
      return;
    }

    const refreshRateAndPayPal = async () => {
      try {
        const configResponse = await paymentAPI.getConfig();
        if (configResponse.success) {
          setPaymentConfig(configResponse.data);
        }
      } catch (_) {
        // Keep existing config if refresh fails.
      }
      await preparePayPalCheckout();
    };

    refreshRateAndPayPal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paymentProvider]);

  const handlePaymentMethodSelect = async (methodId) => {
    if (loading || isProcessingOrder || paymentProvider !== 'razorpay') return;

    setLoading(true);
    setIsPlacingOrder(true);

    try {
      await placeOnlineOrder(methodId);
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

  const availableGateways = PAYMENT_GATEWAYS.filter((gateway) => {
    if (!paymentConfig) return gateway.id === 'razorpay';
    if (gateway.id === 'razorpay') return paymentConfig.razorpay?.enabled !== false;
    if (gateway.id === 'paypal') return paymentConfig.paypal?.enabled === true;
    return false;
  });

  const paypalUsdRate = paymentConfig?.paypal?.usdInrRate || 84;
  const paypalUsdTotal =
    paymentProvider === 'paypal' ? convertInrToUsd(getCartTotal(), paypalUsdRate) : 0;

  if (!cartLoading && cart.length === 0 && !isPlacingOrder) {
    return null;
  }

  if (cartLoading) {
    return <PageLoader fullScreen />;
  }

  return (
    <>
      <div className="min-h-screen bg-[#f4f5f7]">
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
                  <PhoneCountryInput
                    id="checkout-phone"
                    name="phone"
                    value={billingDetails.phone}
                    onChange={(nextPhone) =>
                      setBillingDetails((prev) => ({ ...prev, phone: nextPhone }))
                    }
                  />
                </div>

                <fieldset>
                  <legend className="mb-1 block text-sm font-medium text-gray-700">
                    Where will you use the video? <span className="text-red-500">*</span>
                  </legend>
                  <p className="mb-3 text-xs text-gray-500">Select one option</p>
                  <div className="space-y-2">
                    {PURCHASE_REASONS.map((reason) => {
                      const selected = billingDetails.purchaseReasons[0] === reason.id;
                      return (
                        <label
                          key={reason.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                            selected
                              ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900/10'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="purchaseReason"
                            value={reason.id}
                            checked={selected}
                            onChange={() => selectPurchaseReason(reason.id)}
                            className="h-4 w-4 shrink-0 border-gray-300 text-gray-900 focus:ring-gray-900"
                          />
                          <span className="text-sm text-gray-800">{reason.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {REASONS_REQUIRING_DETAIL.includes(billingDetails.purchaseReasons[0]) && (
                    <div className="mt-3">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        {REASON_DETAIL_CONFIG[billingDetails.purchaseReasons[0]]?.label}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="purchaseReasonOther"
                        value={billingDetails.purchaseReasonOther}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder={
                          REASON_DETAIL_CONFIG[billingDetails.purchaseReasons[0]]?.placeholder
                        }
                      />
                    </div>
                  )}
                </fieldset>
              </div>

              <div className="mt-5 space-y-2.5">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700">
                    I have read{' '}
                    <Link
                      to="/terms-and-conditions"
                      onClick={(event) => event.stopPropagation()}
                      className="font-semibold underline underline-offset-2"
                    >
                      Terms &amp; Conditions
                    </Link>{' '}
                    and agree
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={acceptedLicensePolicy}
                    onChange={(e) => setAcceptedLicensePolicy(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700">
                    I have read{' '}
                    <Link
                      to="/license-information-policy"
                      onClick={(event) => event.stopPropagation()}
                      className="font-semibold underline underline-offset-2"
                    >
                      License Information Policy
                    </Link>{' '}
                    and agree
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleContinueToSummary}
                disabled={!acceptedTerms || !acceptedLicensePolicy}
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
                  <p className="mt-1 text-xs text-gray-500">Choose Razorpay or PayPal</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</p>
                  {paymentProvider === 'paypal' ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{formatUsd(paypalUsdTotal)}</p>
                      <p className="text-xs text-gray-500">
                        ≈ {formatPayableCurrency(getCartTotal())}
                        {' · '}
                        {paymentConfig?.paypal?.usdInrRateSource === 'live' ? 'Live' : 'Est.'} rate ₹
                        {paypalUsdRate.toFixed(2)}/USD
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{formatPayableCurrency(getCartTotal())}</p>
                  )}
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-sm">
                <OrderAmountSummary
                  order={{
                    subtotalAmount: getCartSubtotal(),
                    gstAmount: getCartGstTotal(),
                    promoCode: appliedPromo?.code || '',
                    discountAmount,
                    totalAmount: getCartTotal(),
                  }}
                />
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {availableGateways.map((gateway) => {
                  const selected = paymentProvider === gateway.id;
                  return (
                    <button
                      key={gateway.id}
                      type="button"
                      onClick={() => setPaymentProvider(gateway.id)}
                      disabled={loading || isProcessingOrder}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        selected
                          ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900/10'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{gateway.label}</p>
                      <p className="mt-1 text-xs text-gray-500">{gateway.subtitle}</p>
                    </button>
                  );
                })}
              </div>

              {paymentProvider === 'razorpay' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PAYMENT_OPTIONS.map((option) => {
                  const PaymentIcon = PAYMENT_OPTION_ICONS[option.id];

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handlePaymentMethodSelect(option.id)}
                      disabled={loading || isProcessingOrder}
                      className="flex flex-row items-center justify-start gap-3 rounded-xl border border-gray-200 px-5 py-4 text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-col sm:justify-center sm:px-4 sm:py-5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center sm:h-auto sm:w-auto">
                        <PaymentIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                      </span>
                      <span className="text-sm font-semibold">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              )}

              {paymentProvider === 'paypal' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-5">
                  <p className="mb-1 text-sm font-medium text-gray-800">Pay securely with PayPal</p>
                  <p className="mb-3 text-xs text-gray-500">
                    You will be charged {formatUsd(paypalUsdTotal)} USD.
                  </p>
                  <div id={paypalContainerId} />
                  {!paypalReady && (
                    <p className="text-xs text-gray-500">Loading PayPal checkout…</p>
                  )}
                </div>
              )}

              <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
                <p>
                  <span className="font-medium text-gray-800">{billingDetails.name}</span>
                  {' · '}
                  {billingDetails.email}
                  {' · '}
                  {billingDetails.phone}
                </p>
              </div>

              <p className="mt-4 text-center text-[11px] text-gray-400">
                By paying, you agree to {BRAND.name}&apos;s licensing terms
              </p>
            </div>
          )}
        </div>

        {isProcessingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="rounded-xl bg-white px-8 py-6 text-center shadow-xl">
              <PageLoader label="Opening secure payment..." labelClassName="text-sm font-medium text-gray-900" minHeight="" />
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
    </>
  );
};

export default Checkout;
