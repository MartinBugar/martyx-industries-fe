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
    
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-paypal': ['@paypal/paypal-js', '@paypal/react-paypal-js'],
          'vendor-three': ['three', '@google/model-viewer'],
          
          // Feature chunks
          'admin-pages': [
            'src/pages/admin/AdminDashboard',
            'src/pages/admin/AdminUsers',
            'src/pages/admin/AdminProducts',
            'src/pages/admin/AdminOrders'
          ],
          'auth-pages': [
            'src/pages/Login',
            'src/pages/Registration',
            'src/pages/ForgotPassword',
            'src/pages/ResetPassword'
          ],
          'shop-pages': [
            'src/pages/Products',
            'src/pages/ProductDetail',
            'src/pages/Checkout',
            'src/pages/CartPage'
          ]
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
