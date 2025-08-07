import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  server: {
    proxy: {
      // Proxy requests to the backend reset-password endpoint to the frontend
      '/api/auth/reset-password': {
        target: 'http://localhost:5173', // Frontend dev server
        changeOrigin: true,
        rewrite: () => '/reset-password'
      }
    }
  }
})
