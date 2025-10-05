import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic'
    })
  ],
  
  // Asset handling
  assetsInclude: ['**/*.glb'],
  
  // Build optimizations
  build: {
    // Target modern browsers for better optimization
    target: 'es2018',
    
    // Enable minification
    minify: 'esbuild',
    
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
    
    // Enable compression
    reportCompressedSize: true,
    
    // Optimize chunks
    chunkSizeWarningLimit: 1000,
    
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        // Enhanced chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@paypal')) {
              return 'vendor-paypal';
            }
            if (id.includes('three') || id.includes('@google/model-viewer')) {
              return 'vendor-three';
            }
            if (id.includes('aws-sdk')) {
              return 'vendor-aws';
            }
            if (id.includes('i18next')) {
              return 'vendor-i18n';
            }
            // Other vendor libraries
            return 'vendor-other';
          }
          
          // Feature chunks
          if (id.includes('src/pages/admin/')) {
            return 'admin-pages';
          }
          if (id.includes('src/pages/') && (id.includes('Login') || id.includes('Registration') || id.includes('ForgotPassword'))) {
            return 'auth-pages';
          }
          if (id.includes('src/pages/') && (id.includes('Products') || id.includes('ProductDetail') || id.includes('Checkout'))) {
            return 'shop-pages';
          }
          if (id.includes('src/components/effects/')) {
            return 'effects';
          }
          if (id.includes('src/services/')) {
            return 'services';
          }
        },
        
        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') 
            : 'chunk';
          return `assets/js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/img/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Source maps for production debugging (optional)
    sourcemap: false,
    
    // Report compressed size
    reportCompressedSize: true
  },
  
  // Development server optimizations
  server: {
    // Enable HMR
    hmr: true,
    
    // Proxy configuration
    proxy: {
      // Proxy requests to the backend reset-password endpoint to the frontend
      '/api/auth/reset-password': {
        target: 'http://localhost:5173', // Frontend dev server
        changeOrigin: true,
        rewrite: () => '/reset-password'
      }
    },
    
    // Performance optimizations
    fs: {
      // Optimize file system access
      strict: false
    }
  },
  
  // Optimization settings
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@paypal/paypal-js',
      '@paypal/react-paypal-js'
    ],
    
    // Exclude heavy dependencies from pre-bundling
    exclude: [
      'three',
      '@google/model-viewer'
    ]
  },
  
  // Performance settings
  esbuild: {
    // Drop console and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    
    // Legal comments handling
    legalComments: 'none'
  },
  
  // Define environment variables
  define: {
    // Enable development tools in development
    __DEV__: process.env.NODE_ENV === 'development'
  },
  
  // CSS preprocessing optimizations
  css: {
    // Enable CSS modules if needed
    modules: false,
    
    // PostCSS configuration
    postcss: {},
    
    // CSS preprocessing
    preprocessorOptions: {
      // Any CSS preprocessor options
    }
  }
})
