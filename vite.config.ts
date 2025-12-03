import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  assetsInclude: ['**/*.glb'],
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React vendor chunk (core framework)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // 3D/Model viewer chunk (heavy dependencies)
          'three-vendor': ['three', '@google/model-viewer'],

          // i18n chunk (internationalization)
          'i18n-vendor': [
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
            'i18next-http-backend',
            'i18next-icu',
            'intl-messageformat'
          ],

          // Form libraries chunk
          'form-vendor': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],

          // Utilities chunk
          'utils-vendor': [
            'lucide-react',
            'dompurify'
          ]
        }
      }
    },
    // Keep chunk size warning at default to catch large bundles early
    chunkSizeWarningLimit: 500
  },
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
