import { reactive, computed } from 'vue'
import api from '@/api'

const state = reactive({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
})

export const auth = {
  state,

  isAuthenticated: computed(() => !!state.token),
  isAdmin: computed(() => state.user?.role === 'ADMIN'),
  isStudent: computed(() => state.user?.role === 'STUDENT'),
  studentId: computed(() => state.user?.studentId),
  user: computed(() => state.user),

  setAuth(data) {
    state.token = data.token
    state.user = {
      userId: data.userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      studentId: data.studentId,
    }
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(state.user))
  },

  clearAuth() {
    state.token = null
    state.user = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    this.setAuth(data)
    return data
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload)
    this.setAuth(data)
    return data
  },

  async registerAdmin(payload) {
    const { data } = await api.post('/auth/register/admin', payload)
    return data
  },

  async fetchMe() {
    try {
      const { data } = await api.get('/auth/me')
      state.user = {
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        studentId: data.studentId,
      }
      localStorage.setItem('user', JSON.stringify(state.user))
      return data
    } catch (e) {
      this.clearAuth()
      throw e
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // ignore — token may already be invalid
    }
    this.clearAuth()
  },
}