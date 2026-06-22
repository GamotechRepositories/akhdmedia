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

  buyNow: async (productId, quantity = 1, imageSize = '') => {
    const { data } = await api.post('/cart/buy-now', { productId, quantity, imageSize })
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

  applyPromoCode: async (code) => {
    const { data } = await api.post('/cart/promo', { code })
    return data
  },

  removePromoCode: async () => {
    const { data } = await api.delete('/cart/promo')
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

export const paymentAPI = {
  verifyRazorpayPayment: async (payload) => {
    const { data } = await api.post('/payments/razorpay/verify', payload)
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

  resumeOrderPayment: async (orderId) => {
    const { data } = await api.post(`/orders/${orderId}/payment`)
    return data
  },

  getOrderDownloads: async (orderId) => {
    const { data } = await api.get(`/orders/${orderId}/downloads`)
    return data
  },

  resendLicenseEmail: async (orderId) => {
    const { data } = await api.post(`/orders/${orderId}/resend-email`)
    return data
  },

  downloadLicenseCertificate: async (orderId) => {
    const { data } = await api.get(`/orders/${orderId}/license-certificate`, {
      responseType: 'blob',
    })
    return data
  },

  downloadLicenseAgreement: async (orderId) => {
    const { data } = await api.get(`/orders/${orderId}/license-agreement`, {
      responseType: 'blob',
    })
    return data
  },
}

export const supportAPI = {
  submitRequest: async (payload) => {
    const { data } = await api.post('/support', payload)
    return data
  },
}
