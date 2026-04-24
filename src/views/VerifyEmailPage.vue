<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'

const router = useRouter()
const route = useRoute()
const email = ref(route.query.email || '')
const code = ref('')
const error = ref(null)
const success = ref(null)
const loading = ref(false)
const resending = ref(false)

async function submit() {
  loading.value = true
  error.value = null
  try {
    await api.post('/auth/verify', { email: email.value, code: code.value })
    router.push('/login')
  } catch (e) {
    error.value = e.response?.data?.message || e.response?.data || 'Invalid verification code'
  } finally {
    loading.value = false
  }
}

async function resendCode() {
  resending.value = true
  error.value = null
  success.value = null
  try {
    await api.post(`/auth/resend-code?email=${encodeURIComponent(email.value)}`)
    success.value = 'A new code has been sent to your email'
  } catch (e) {
    error.value = e.response?.data?.message || e.response?.data || 'Failed to resend code'
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-primary/25">
          B
        </div>
        <h1 class="text-2xl font-bold">Verify your email</h1>
        <p class="text-text-secondary text-sm mt-1">
          We sent a 6-digit code to <span class="font-medium text-text-primary">{{ email }}</span>
        </p>
      </div>

      <!-- Form -->
      <div class="bg-surface rounded-2xl shadow-xl border border-border p-8">
        <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm mb-6">{{ error }}</div>
        <div v-if="success" class="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-6">{{ success }}</div>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1.5">Verification Code</label>
            <input
              v-model="code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              required
              autofocus
              placeholder="123456"
              class="w-full px-4 py-3 border border-border rounded-xl text-sm text-center tracking-[0.3em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            :disabled="loading || code.length < 6"
            class="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 shadow-sm"
          >
            {{ loading ? 'Verifying...' : 'Verify Email' }}
          </button>
        </form>

        <div class="text-center mt-6">
          <p class="text-text-secondary text-sm">
            Didn't receive the code?
            <button
              @click="resendCode"
              :disabled="resending"
              class="text-primary hover:text-primary-dark font-medium transition-colors disabled:opacity-50"
            >
              {{ resending ? 'Sending...' : 'Resend code' }}
            </button>
          </p>
        </div>

        <p class="text-center text-text-secondary text-sm mt-4">
          <router-link to="/login" class="text-primary hover:text-primary-dark font-medium transition-colors">Back to Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>