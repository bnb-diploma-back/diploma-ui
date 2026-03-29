<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/stores/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref(null)
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = null
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || e.response?.data || 'Invalid email or password'
  } finally {
    loading.value = false
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
        <h1 class="text-2xl font-bold">Welcome back</h1>
        <p class="text-text-secondary text-sm mt-1">Sign in to BNB</p>
      </div>

      <!-- Form -->
      <div class="bg-surface rounded-2xl shadow-xl border border-border p-8">
        <div v-if="error" class="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm mb-6">{{ error }}</div>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              required
              autofocus
              placeholder="you@university.edu"
              class="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5">Password</label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="Enter your password"
              class="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 shadow-sm"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="text-center text-text-secondary text-sm mt-6">
          Don't have an account?
          <router-link to="/register" class="text-primary hover:text-primary-dark font-medium transition-colors">Sign up</router-link>
        </p>
      </div>
    </div>
  </div>
</template>