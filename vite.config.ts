import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    // Allow all external hosts (ngrok, tunnels, etc.)
    // Safe for local development — do not use in production
    allowedHosts: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
