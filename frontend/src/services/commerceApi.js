import api from '../api/axios'

export const cartAPI = {
  getCart: async () => {
    const { data } = await api.get('/cart')
    return data
  },

  addToCart: async (productId, quantity = 1, imageSize = '') => {
    const { data } = await api.post('/cart/items', { productId, quantity, imageSize })
    return data
  },

  updateCartItem: async (itemId, quantity) => {
    const { data } = await api.patch(`/cart/items/${itemId}`, { quantity })
    return data
  },

  removeFromCart: async (itemId) => {
    const { data } = await api.delete(`/cart/items/${itemId}`)
    return data
  },

  clearCart: async () => {
    const { data } = await api.delete('/cart')
    return data
  },
}

export const checkoutAPI = {
  getProfile: async () => {
    const { data } = await api.get('/orders/profile')
    return data
  },

  saveProfile: async (billingAddress) => {
    const { data } = await api.put('/orders/profile', billingAddress)
    return data
  },
}

export const orderAPI = {
  createOrder: async (billingAddress, paymentMethod = 'online') => {
    const { data } = await api.post('/orders', { billingAddress, paymentMethod })
    return data
  },

  getOrder: async (orderId) => {
    const { data } = await api.get(`/orders/${orderId}`)
    return data
  },

  getOrderDownloads: async (orderId) => {
    const { data } = await api.get(`/orders/${orderId}/downloads`)
    return data
  },
}
