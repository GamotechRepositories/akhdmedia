import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { handleImageError } from '../utils/imageFallback';
import { PROTECTED_MEDIA_CLASS, getProtectedImageProps, preventMediaContextMenu } from '../utils/mediaProtection';
import { formatCurrency } from '../utils/formatters';
import { getCartItemImage, getCartItemPrice } from '../utils/cartHelpers';

const IconTrash = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconMinus = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 12H4" />
  </svg>
);
const IconPlus = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
  </svg>
);
const IconLock = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const IconArrowLeft = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, loading } = useCart();
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState(null);

  const handleRemove = async (itemId) => {
    if (removingId) return;
    setRemovingId(itemId);
    try {
      await removeFromCart(itemId);
    } catch {
      window.alert('Could not remove item. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Your shopping bag is empty</h1>
        <p className="text-gray-600 mb-8 text-center max-w-sm text-sm">
          Add items to your bag to continue shopping.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors shadow-sm"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <IconArrowLeft className="w-4 h-4 mr-1.5" />
            Continue Shopping
          </Link>

          <div className="hidden md:flex items-center space-x-2 text-xs font-medium">
            <span className="text-gray-900">Shopping Bag</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">Checkout</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">Payment</span>
          </div>

          <div className="flex items-center text-xs font-medium text-gray-500">
            <IconLock className="w-3.5 h-3.5 mr-1.5" />
            Secure Checkout
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Shopping Bag</h1>
          <p className="text-sm text-gray-600">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-10 items-start">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="col-span-6">Product</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-3 text-right">Total</div>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.map((item) => {
                  const product = item.product || item;
                  const itemId = item.id;
                  const productImage = getCartItemImage(item);
                  const productPrice = getCartItemPrice(item);

                  return (
                    <div key={itemId} className="p-5 sm:p-6 border-b border-gray-100 last:border-0 hover:bg-gray-50/30 transition-colors">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                        <div className="sm:col-span-6 flex gap-4">
                          <div
                            className="protected-media-shell relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-200"
                            onContextMenu={preventMediaContextMenu}
                          >
                            <img
                              src={productImage}
                              alt={product.name || 'Product'}
                              className={`w-full h-full object-cover ${PROTECTED_MEDIA_CLASS}`}
                              onError={(e) => handleImageError(e, 200, 200)}
                              {...getProtectedImageProps()}
                            />
                          </div>
                          <div className="flex flex-col justify-center min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                              <Link to={`/product/${product.id}`} className="hover:text-gray-600 transition-colors">
                                {product.name || 'Product'}
                              </Link>
                            </h3>
                            {product.brand && (
                              <p className="mt-0.5 text-xs sm:text-sm text-gray-500">{product.brand}</p>
                            )}
                            {item.imageSize && (
                              <p className="mt-0.5 text-xs text-gray-500">License: {item.imageSize}</p>
                            )}
                            <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(productPrice)}</p>
                            <button
                              type="button"
                              onClick={() => handleRemove(itemId)}
                              disabled={removingId === itemId}
                              className="sm:hidden mt-2 text-xs text-red-600 font-semibold flex items-center hover:text-red-700 disabled:opacity-50"
                            >
                              <IconTrash className="w-3 h-3 mr-1" /> Remove
                            </button>
                          </div>
                        </div>

                        <div className="sm:col-span-3 flex justify-start sm:justify-center">
                          <div className="flex items-center border border-gray-300 rounded-md h-9 w-28">
                            <button
                              type="button"
                              onClick={() => updateQuantity(itemId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-9 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-r border-gray-300"
                            >
                              <IconMinus className="w-3.5 h-3.5" />
                            </button>
                            <span className="flex-1 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(itemId, item.quantity + 1)}
                              className="w-9 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors border-l border-gray-300"
                            >
                              <IconPlus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="sm:col-span-3 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2">
                          <span className="text-sm sm:hidden font-medium text-gray-600">Total:</span>
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-semibold text-gray-900">
                              {formatCurrency(productPrice * item.quantity)}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemove(itemId)}
                              disabled={removingId === itemId}
                              className="hidden sm:flex items-center justify-end mt-2 text-xs text-red-600 font-semibold hover:text-red-700 transition-colors disabled:opacity-50"
                            >
                              <IconTrash className="w-3 h-3 mr-1" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">Order Summary</h2>

              <dl className="space-y-3.5 text-sm">
                <div className="flex justify-between pb-4 border-b border-gray-200">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="font-medium text-gray-900">{formatCurrency(getCartTotal())}</dd>
                </div>

                <div className="flex justify-between items-center pt-3">
                  <dt className="text-base font-semibold text-gray-900">Total</dt>
                  <dd className="text-xl font-semibold text-gray-900">{formatCurrency(getCartTotal())}</dd>
                </div>
                <p className="text-xs text-gray-500 mt-1">Including GST</p>
              </dl>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-900 hover:text-gray-600 list-none">
                    <span>Do you have a promo code?</span>
                    <span className="transition group-open:rotate-180">
                      <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <button type="button" className="px-4 py-2 bg-gray-100 text-gray-900 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors">
                      Apply
                    </button>
                  </div>
                </details>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="w-full flex items-center justify-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Proceed to Checkout
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-3 text-center">Secure Payment</p>
                <div className="flex justify-center gap-4 opacity-60">
                  <svg className="h-6" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="38" height="24" rx="4" fill="#F3F4F6" />
                    <path d="M14.07 15.631H16.485L18 8.42H15.657C15.12 8.42 14.628 8.736 14.436 9.197L12.333 14.238L10.153 9.197C9.972 8.71 9.564 8.42 8.949 8.42H5.733L5.617 8.974C6.828 9.243 7.824 9.612 8.718 10.536C9.564 11.433 9.513 11.248 9.87 13.069L8.475 19.82H11.025L14.07 15.631Z" fill="#1A1F71" />
                  </svg>
                  <svg className="h-6" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="38" height="24" rx="4" fill="#F3F4F6" />
                    <path d="M13.6 12C13.6 14.333 14.65 16.433 16.3 17.9C15.033 18.8 13.516 19.333 11.85 19.333C7.8 19.333 4.51667 16.05 4.51667 12C4.51667 7.95 7.8 4.66667 11.85 4.66667C13.516 4.66667 15.033 5.2 16.3 6.1C14.65 7.56667 13.6 9.66667 13.6 12Z" fill="#EB001B" />
                    <path d="M26.2667 12C26.2667 16.05 22.9833 19.333 18.9333 19.333C17.2667 19.333 15.75 18.8 14.4833 17.9C16.1333 16.433 17.1833 14.333 17.1833 12C17.1833 9.66667 16.1333 7.56667 14.4833 6.1C15.75 5.2 17.2667 4.66667 18.9333 4.66667C22.9833 4.66667 26.2667 7.95 26.2667 12Z" fill="#F79E1B" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
