import api from './axios.js'

export const getHealthStatus = async () => {
  const { data } = await api.get('/health')
  return data
}
