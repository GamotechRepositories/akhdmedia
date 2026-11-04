import api from '../api/axios'

export const subscriptionAPI = {
  getPublicPlans: async () => {
    const { data } = await api.get('/subscriptions/plans')
    return data
  },

  getMySubscription: async () => {
    const { data } = await api.get('/subscriptions/my-subscription')
    return data
  },

  getReceipt: async (subscriptionId) => {
    const { data } = await api.get(`/subscriptions/receipt/${subscriptionId}`)
    return data
  },

  createCheckout: async (planId, paymentProvider = 'razorpay', extra = {}) => {
    const { data } = await api.post('/subscriptions/checkout', {
      planId,
      paymentProvider,
      ...extra,
    })
    return data
  },

  verifyPayment: async (payload) => {
    const { data } = await api.post('/subscriptions/verify', payload)
    return data
  },

  cancelSubscription: async (planId = null) => {
    const { data } = await api.post('/subscriptions/cancel', { planId })
    return data
  },

  checkClaimStatus: async (productId) => {
    const { data } = await api.get(`/subscriptions/claim-status/${productId}`)
    return data
  },

  claimVideo: async (productId, imageSize = '', action = 'claim') => {
    const { data } = await api.post(`/subscriptions/claim/${productId}`, { imageSize, action })
    return data
  },
}
