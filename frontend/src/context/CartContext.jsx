import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/commerceApi';
import { getCartItemPrice } from '../utils/cartHelpers';

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

  const removeFromCart = useCallback(async (itemId) => {
    const response = await cartAPI.removeFromCart(itemId);
    applyCartResponse(response);
  }, [applyCartResponse]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity < 1) return;
    const response = await cartAPI.updateCartItem(itemId, quantity);
    applyCartResponse(response);
  }, [applyCartResponse]);

  const clearCart = useCallback(async () => {
    const response = await cartAPI.clearCart();
    applyCartResponse(response);
  }, [applyCartResponse]);

  const getCartTotal = useCallback(
    () => cart.reduce((total, item) => total + getCartItemPrice(item) * item.quantity, 0),
    [cart],
  );

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
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemsCount,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
