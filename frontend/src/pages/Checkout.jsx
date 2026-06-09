import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { checkoutAPI, orderAPI } from '../services/commerceApi';
import { formatCurrency } from '../utils/formatters';
import { getCartItemImage, getCartItemPrice } from '../utils/cartHelpers';
import { BRAND } from '../config/brand';

const PURCHASE_REASONS = [
  { id: 'personal', label: 'Personal use' },
  { id: 'digital', label: 'Digital media' },
  { id: 'outlet', label: 'Outlet media' },
  { id: 'other', label: 'Other' },
];

const emptyBilling = {
  name: '',
  email: '',
  phone: '',
  purchaseReasons: [],
};

const IconCheck = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const IconPackage = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const IconAlert = () => (
  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const Checkout = () => {
  const { cart, getCartTotal, clearCart, loading: cartLoading } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alertPopup, setAlertPopup] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [billingDetails, setBillingDetails] = useState(emptyBilling);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await checkoutAPI.getProfile();
        if (response.success && response.data.billingAddress) {
          const saved = response.data.billingAddress;
          setBillingDetails({
            ...emptyBilling,
            name: saved.name || '',
            email: saved.email || '',
            phone: saved.phone || '',
            purchaseReasons: saved.purchaseReasons || [],
          });
        }
      } catch (profileError) {
        console.error('Failed to load billing profile:', profileError);
      }
    };

    loadProfile();
  }, []);

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
      const selected = prev.purchaseReasons.includes(reasonId)
        ? prev.purchaseReasons.filter((id) => id !== reasonId)
        : [...prev.purchaseReasons, reasonId];
      return { ...prev, purchaseReasons: selected };
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
      return 'Please select why you are purchasing this video';
    }
    return '';
  };

  const handlePayment = async () => {
    const validationError = getBillingValidationError();
    if (validationError) {
      showAlert(validationError);
      return;
    }

    setLoading(true);
    setIsPlacingOrder(true);
    setIsProcessingOrder(true);
    setProcessingStep(0);

    try {
      setProcessingStep(1);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingStep(2);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingStep(3);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingStep(4);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const response = await orderAPI.createOrder(billingDetails, paymentMethod);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create order');
      }

      const orderId = response.data.order.id;
      setProcessingStep(5);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setProcessingStep(6);
      await new Promise((resolve) => setTimeout(resolve, 400));

      setIsProcessingOrder(false);
      setLoading(false);
      setShowSuccessModal(true);
      await clearCart();

      setTimeout(() => {
        setShowSuccessModal(false);
        setTimeout(() => {
          navigate(`/order-success?method=${paymentMethod}&orderId=${orderId}`);
        }, 300);
      }, 2000);
    } catch (err) {
      setIsPlacingOrder(false);
      setIsProcessingOrder(false);
      setLoading(false);
      setProcessingStep(0);
      showAlert(err.message || 'Failed to place order. Please try again.', 'Order Failed');
    }
  };

  if ((!cartLoading && cart.length === 0 && !isPlacingOrder) || cartLoading) {
    return null;
  }

  return (
    <>
    <div
      className="min-h-screen bg-gray-50 transition-opacity duration-300 overflow-x-hidden"
      style={{
        opacity: showSuccessModal ? 0.3 : 1,
        pointerEvents: showSuccessModal ? 'none' : 'auto',
        animation: 'fadeInPage 0.4s ease-out',
      }}
    >
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900 truncate">Checkout</h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium flex-shrink-0"
          >
            ← Back to Cart
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <IconCheck size={48} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
              <p className="text-gray-600 mb-6">Your license order has been confirmed. Redirecting...</p>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
              </div>
            </div>
          </div>
        )}

        {isProcessingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 overflow-y-auto max-h-[90vh]">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{processingStep}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Placing Your Order</h3>
                <p className="text-sm text-gray-600 mb-6">Please wait while we process your order...</p>

                <div className="space-y-3 text-left">
                  {[
                    'Validating order details',
                    'Processing payment method',
                    'Confirming license',
                    'Creating order',
                    'Sending download email',
                    'Order confirmed',
                  ].map((label, index) => {
                    const step = index + 1;
                    const active = processingStep >= step;
                    const complete = processingStep > step;
                    return (
                      <div
                        key={label}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300 ${
                          active ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            active ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          {complete ? (
                            <IconCheck size={16} className="text-white" />
                          ) : processingStep === step ? (
                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                          ) : (
                            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full" />
                          )}
                        </div>
                        <span className={`text-sm font-medium transition-colors ${active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Billing Details</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={billingDetails.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={billingDetails.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                    placeholder="you@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Download links for your purchased resolution will be sent here.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={billingDetails.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Why are you purchasing this video? <span className="text-red-500">*</span>
                  </p>
                  <div className="space-y-2">
                    {PURCHASE_REASONS.map((reason) => (
                      <label
                        key={reason.id}
                        className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-all ${
                          billingDetails.purchaseReasons.includes(reason.id)
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={billingDetails.purchaseReasons.includes(reason.id)}
                          onChange={() => togglePurchaseReason(reason.id)}
                          className="w-4 h-4 text-gray-900 focus:ring-gray-900 rounded"
                        />
                        <span className="text-sm text-gray-900">{reason.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm lg:sticky lg:top-24 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4 max-h-64 overflow-y-auto">
                {cart.map((item) => {
                  const product = item.product || item;
                  const price = getCartItemPrice(item);
                  const image = getCartItemImage(item);
                  return (
                    <div key={item.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      {image && (
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-200">
                          <img src={image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 break-words">{product.name}</p>
                        {item.imageSize && (
                          <p className="text-xs text-gray-500 mt-0.5">License: {item.imageSize}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {formatCurrency(price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-2.5 mt-2.5 flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-semibold text-gray-900">{formatCurrency(getCartTotal())}</span>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Method</h3>
                <div className="space-y-2.5">
                  <label
                    className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-all ${
                      paymentMethod === 'online'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-gray-900 focus:ring-gray-900 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Online Payment</div>
                      <div className="text-xs text-gray-500 mt-0.5">Cards, UPI, Wallets</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-gray-900 focus:ring-gray-900 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 break-words">Invoice / Net 30</div>
                      <div className="text-xs text-gray-500 mt-0.5">For enterprise licensing</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={loading || isProcessingOrder}
                  className="w-full bg-gray-900 text-white py-2.5 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading || isProcessingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isProcessingOrder ? 'Placing Order...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <IconPackage />
                      <span>Place Order</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  By placing your order, you agree to {BRAND.name}&apos;s licensing terms
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInPage {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>

    {alertPopup && (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={() => setAlertPopup(null)}
      >
        <div
          className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl animate-[popupIn_0.25s_ease-out]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="checkout-alert-title"
          aria-describedby="checkout-alert-message"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <IconAlert />
          </div>
          <h2 id="checkout-alert-title" className="text-lg font-bold text-gray-900">
            {alertPopup.title}
          </h2>
          <p id="checkout-alert-message" className="mt-2 text-sm leading-relaxed text-gray-600">
            {alertPopup.message}
          </p>
          <button
            type="button"
            onClick={() => setAlertPopup(null)}
            className="mt-6 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
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
