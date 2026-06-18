import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/commerceApi';
import { getCartItemBasePrice, getCartItemGstAmount } from '../utils/cartHelpers';
import { buildPayableTotals } from '../utils/money';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

const emptyCart = {
  items: [],
  subtotal: 0,
  gstTotal: 0,
  total: 0,
  itemCount: 0,
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartMeta, setCartMeta] = useState(emptyCart);
  const [loading, setLoading] = useState(true);

  const applyCartResponse = useCallback((response) => {
    const nextCart = response?.data?.cart?.items || [];
    setCart(nextCart);
    setCartMeta({
      items: nextCart,
      subtotal: response?.data?.cart?.subtotal ?? 0,
      gstTotal: response?.data?.cart?.gstTotal ?? 0,
      total: response?.data?.cart?.total ?? 0,
      itemCount: response?.data?.cart?.itemCount ?? 0,
    });
    return nextCart;
  }, []);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await cartAPI.getCart();
      applyCartResponse(response);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart([]);
      setCartMeta(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [applyCartResponse]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = useCallback(async (product, quantity = 1, imageSize = '') => {
    const response = await cartAPI.addToCart(product.id, quantity, imageSize);
    applyCartResponse(response);
    return response;
  }, [applyCartResponse]);

  const buyNow = useCallback(async (product, quantity = 1, imageSize = '') => {
    const response = await cartAPI.buyNow(product.id, quantity, imageSize);
    applyCartResponse(response);
    return response;
  }, [applyCartResponse]);

  const removeFromCart = useCallback(async (itemId) => {
    if (!itemId) return;

    const previousCart = cart;
    setCart((current) => current.filter((item) => item.id !== itemId));

    try {
      const response = await cartAPI.removeFromCart(itemId);
      applyCartResponse(response);
    } catch (error) {
      console.error('Failed to remove cart item:', error);
      setCart(previousCart);
      throw error;
    }
  }, [applyCartResponse, cart]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity < 1) return;
    const response = await cartAPI.updateCartItem(itemId, quantity);
    applyCartResponse(response);
  }, [applyCartResponse]);

  const clearCart = useCallback(async () => {
    const response = await cartAPI.clearCart();
    applyCartResponse(response);
  }, [applyCartResponse]);

  const getPayableBreakdown = useCallback(() => {
    const subtotal =
      cartMeta.subtotal ||
      cart.reduce((total, item) => total + getCartItemBasePrice(item) * item.quantity, 0);
    const rawGstTotal = cart.reduce(
      (total, item) => total + getCartItemGstAmount(item) * item.quantity,
      0,
    );

    return buildPayableTotals({ subtotal, gstTotal: rawGstTotal });
  }, [cart, cartMeta.subtotal]);

  const getCartTotal = useCallback(() => getPayableBreakdown().total, [getPayableBreakdown]);

  const getCartSubtotal = useCallback(
    () => cartMeta.subtotal || cart.reduce((total, item) => total + getCartItemBasePrice(item) * item.quantity, 0),
    [cart, cartMeta.subtotal],
  );

  const getCartGstTotal = useCallback(() => getPayableBreakdown().gstTotal, [getPayableBreakdown]);

  const getCartItemsCount = useCallback(
    () => cartMeta.itemCount || cart.reduce((count, item) => count + item.quantity, 0),
    [cart, cartMeta.itemCount],
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        buyNow,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartSubtotal,
        getCartGstTotal,
        getCartItemsCount,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
