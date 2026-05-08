import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import { _setAuthStoreGetter } from './api'
import { useAuthStore } from './stores/auth'

async function bootstrap(): Promise<void> {
  // Start MSW mock worker in development mode only
  if (import.meta.env.DEV) {
    const { startMockWorker } = await import('./mocks/browser')
    await startMockWorker()
  }

  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)

  // Wire up the auth store getter for apiFetch — must be done after Pinia is installed
  // so that useAuthStore() can be called safely inside authenticated requests.
  _setAuthStoreGetter(() => useAuthStore())

  app.mount('#app')
}

bootstrap()
