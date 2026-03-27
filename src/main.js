import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { auth } from './stores/auth'

async function bootstrap() {
  // If we have a token, verify it and refresh user data from /me
  if (auth.isAuthenticated.value) {
    try {
      await auth.fetchMe()
    } catch (e) {
      // Token is invalid/expired — clear and let router redirect to login
      auth.clearAuth()
    }
  }

  const app = createApp(App)
  app.use(router)
  app.mount('#app')
}

bootstrap()