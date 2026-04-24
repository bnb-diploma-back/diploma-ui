import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401/403, clear auth and redirect to login (or verify-email if unverified)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const message = error.response?.data?.message || error.response?.data || ''
      if (typeof message === 'string' && message.toLowerCase().includes('verif')) {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/verify-email') {
          window.location.href = `/verify-email?email=${encodeURIComponent(user.email || '')}`
        }
      } else if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api