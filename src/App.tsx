import { logInfo, logWarn } from './services/logger';
/**
 * Optimized App Component with Code Splitting and Performance Improvements
 *
 * Key optimizations:
 * - Lazy loading of all pages for better bundle splitting
 * - Memoized components to prevent unnecessary re-renders
 * - Optimized context providers
 * - Reduced imports and better dependency management
 */

import './App.css'
import { Toaster } from 'react-hot-toast';
import React, { useState, useCallback, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'

// Core providers and security
import SecurityErrorBoundary from './components/security/SecurityErrorBoundary'
import { setupCSPReporting, initializeCSRFToken } from './utils/security'
import { ErrorProvider } from './context/ErrorContext'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthProvider'
import { WishlistProvider } from './context/WishlistContext'
import { UserSettingsProvider } from './context/UserSettingsContext'
import { useCart } from './context/useCart'

// Core components (not lazy loaded as they're needed immediately)
import Navbar from './components/Navbar/Navbar'
import CategoryBar from './components/CategoryBar/CategoryBar'
import { useAuth } from './context/useAuth'
// Cart component will be loaded via lazy import
import Footer from './components/Footer/Footer'
import SessionExpiredNotification from './components/SessionExpiredNotification/SessionExpiredNotification'
import CookieConsent from './components/CookieConsent/CookieConsent'
import RequireAdmin from './pages/admin/RequireAdmin'
import { useIOSNoZoomOnFocus } from './hooks/useIOSNoZoomOnFocus'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import { useEffectOnce } from './hooks/useOptimizedEffect'
import { visitorService } from './services/visitorService'
import DevelopmentGate from './components/DevelopmentGate/DevelopmentGate'
import RateLimitNotification, { type RateLimitError } from './components/RateLimitNotification/RateLimitNotification'
import { initializeGA4 } from './services/analyticsService'
import ReferralTracker from './components/ReferralTracker/ReferralTracker'
// import { useRoutePrefetch } from './hooks/useRoutePrefetch'
// import { advancedCache } from './utils/advancedCache'

// Lazy imports for code splitting
import {
  Home,
  Products,
  ProductDetail,
  About,
  Contact,
  Login,
  Registration,
  ForgotPassword,
  ResetPassword,
  ResetPasswordRedirect,
  Checkout,
  StripeSuccess,
  StripeCancel,
  CartPage,
  Wishlist,
  UserAccount,
  UserGallery,
  UserGalleryDetail,
  EmailConfirmation,
  CookiesPolicy,
  PrivacyPolicy,
  TermsOfService,
  BuildDifficultyGuide,
  AdminLogin,
  AdminDashboard,
  AdminUsers,
  AdminUserDetail,
  AdminProducts,
  AdminCategories,
  AdminInventory,
  AdminProductDetail,
  AdminProductGallery,
  AdminProduct3DModel,
  AdminProductDigitalFile,
  AdminVariantTabs,
  AdminVariantTabForm,
  AdminMasterProductTabs,
  AdminMasterProductTabForm,
  AdminProductAttachments,
  AdminProductAttachmentForm,
  AdminOrders,
  AdminOrderDetail,
  AdminGallery,
  AdminGalleryUserDetail,
  AdminCassandra,
  AdminCassandraRanks,
  AdminCampaigns,
  AdminSegments,
  AdminAbandonedCarts,
  AdminHomeSettings,
  AdminCompanySettings,
  AdminDiscounts,
  AdminReferralConfig,
  AdminCreditUsageConfig,
  AdminAccountLockoutConfig,
  AdminEmailTemplates,
  AdminXpConfig,
  AdminInvoices,
  AdminGiftTiers,
  AdminShippingZones,
  AdminManualOrderCreate,
  AdminManualOrderHistory,
  AdminReviews,
  AdminSystemSettings,
  ConstellationParticles
} from './utils/lazyImports'

// Optimized App wrapper with memoized security initialization
function AppWrapper() {
  const [showDevelopmentGate, setShowDevelopmentGate] = useState(true);

  // Initialize security only once
  useEffectOnce(() => {
    setupCSPReporting();
    initializeCSRFToken();
  });

  // Add hydrated class to enable transitions after React hydration
  useEffect(() => {
    document.documentElement.classList.add("hydrated");
    return () => document.documentElement.classList.remove("hydrated");
  }, []);

  // Check if development access has been granted
  useEffect(() => {
    const hasAccess = sessionStorage.getItem('dev-access') === 'granted';
    if (hasAccess) {
      setShowDevelopmentGate(false);
    }
  }, []);

  const handleDevelopmentAccess = useCallback(() => {
    setShowDevelopmentGate(false);
  }, []);

  // Show development gate first
  if (showDevelopmentGate) {
    return <DevelopmentGate onAccess={handleDevelopmentAccess} />;
  }

  return (
    <BrowserRouter>
      <SecurityErrorBoundary>
        <ErrorProvider>
          <AuthProvider>
            <UserSettingsProvider>
              <CartProvider>
                <WishlistProvider>
                  <AppContent />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#1a1a2e',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      },
                      success: {
                        iconTheme: {
                          primary: '#10b981',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                </WishlistProvider>
              </CartProvider>
            </UserSettingsProvider>
          </AuthProvider>
        </ErrorProvider>
      </SecurityErrorBoundary>
    </BrowserRouter>
  );
}

// Memoized main content component
const MainContent = React.memo(() => {
  const { getTotalItems } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const [showCart, setShowCart] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isProductsRoute = location.pathname.startsWith('/products');

  // Debug log whenever user changes
  React.useEffect(() => {
    logInfo('🎯 MainContent - Auth state:', {
      user,
      isAuthenticated,
      userId: user?.id,
      userEmail: user?.email
    });
  }, [user, isAuthenticated]);

  // Memoized callbacks to prevent unnecessary re-renders
  const toggleCart = useCallback(() => {
    setShowCart(prev => !prev);
  }, []);

  const handleCheckout = useCallback(() => {
    setShowCart(false);
    navigate('/checkout');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div className="app-container">
      {/* Lazy load constellation particles only when needed */}
      <Suspense fallback={null}>
        <ConstellationParticles />
      </Suspense>
      
      {!isAdminRoute && (
        <Navbar
          cartCount={getTotalItems()}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* Category Bar - only shown on /products and /products/:id pages */}
      {isProductsRoute && <CategoryBar />}

      {!isAdminRoute && showCart && (
        <Suspense fallback={<div className="cart-loading">Loading cart...</div>}>
          <CartPage
            isOpen={showCart}
            onClose={toggleCart}
            onCheckout={handleCheckout}
          />
        </Suspense>
      )}

      <main className="main-content" style={isAdminRoute ? { padding: 0 } : undefined}>
        <Suspense fallback={null}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/api/auth/reset-password" element={<ResetPasswordRedirect />} />
            <Route path="/confirm-email" element={<EmailConfirmation />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/stripe/success" element={<StripeSuccess />} />
            <Route path="/payment/cancelled" element={<StripeCancel />} />
            <Route path="/account" element={<UserAccount />} />
            <Route path="/gallery" element={<UserGallery />} />
            <Route path="/gallery/:userId" element={<UserGalleryDetail />} />
            <Route path="/cookies-policy" element={<CookiesPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/build-difficulty-guide" element={<BuildDifficultyGuide />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/panel" element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            } />
            <Route path="/admin/users" element={
              <RequireAdmin>
                <AdminUsers />
              </RequireAdmin>
            } />
            <Route path="/admin/users/:id" element={
              <RequireAdmin>
                <AdminUserDetail />
              </RequireAdmin>
            } />
            <Route path="/admin/products" element={
              <RequireAdmin>
                <AdminProducts />
              </RequireAdmin>
            } />
            <Route path="/admin/categories" element={
              <RequireAdmin>
                <AdminCategories />
              </RequireAdmin>
            } />
            <Route path="/admin/inventory" element={
              <RequireAdmin>
                <AdminInventory />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:id/view" element={
              <RequireAdmin>
                <AdminProductDetail />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:id/edit" element={
              <RequireAdmin>
                <AdminProductDetail />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:id" element={
              <RequireAdmin>
                <AdminProductDetail />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:id/gallery" element={
              <RequireAdmin>
                <AdminProductGallery />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:id/3d-model" element={
              <RequireAdmin>
                <AdminProduct3DModel />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:id/digital-file" element={
              <RequireAdmin>
                <AdminProductDigitalFile />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:productId/tabs" element={
              <RequireAdmin>
                <AdminMasterProductTabs />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:productId/tabs/new" element={
              <RequireAdmin>
                <AdminMasterProductTabForm />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:productId/tabs/:tabId/edit" element={
              <RequireAdmin>
                <AdminMasterProductTabForm />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:productId/variants/:variantId/tabs" element={
              <RequireAdmin>
                <AdminVariantTabs />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:productId/variants/:variantId/tabs/new" element={
              <RequireAdmin>
                <AdminVariantTabForm />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:productId/variants/:variantId/tabs/:tabId/edit" element={
              <RequireAdmin>
                <AdminVariantTabForm />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:productId/attachments" element={
              <RequireAdmin>
                <AdminProductAttachments />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:productId/attachments/new" element={
              <RequireAdmin>
                <AdminProductAttachmentForm />
              </RequireAdmin>
            } />
            <Route path="/admin/products/:productId/attachments/:attachmentId/edit" element={
              <RequireAdmin>
                <AdminProductAttachmentForm />
              </RequireAdmin>
            } />
            <Route path="/admin/orders" element={
              <RequireAdmin>
                <AdminOrders />
              </RequireAdmin>
            } />
            <Route path="/admin/orders/:id" element={
              <RequireAdmin>
                <AdminOrderDetail />
              </RequireAdmin>
            } />
            <Route path="/admin/gallery" element={
              <RequireAdmin>
                <AdminGallery />
              </RequireAdmin>
            } />
            <Route path="/admin/gallery/users/:userId" element={
              <RequireAdmin>
                <AdminGalleryUserDetail />
              </RequireAdmin>
            } />
            <Route path="/admin/campaigns" element={
              <RequireAdmin>
                <AdminCampaigns />
              </RequireAdmin>
            } />
            <Route path="/admin/discounts" element={
              <RequireAdmin>
                <AdminDiscounts />
              </RequireAdmin>
            } />
            <Route path="/admin/referral-config" element={
              <RequireAdmin>
                <AdminReferralConfig />
              </RequireAdmin>
            } />
            <Route path="/admin/credit-usage-config" element={
              <RequireAdmin>
                <AdminCreditUsageConfig />
              </RequireAdmin>
            } />
            <Route path="/admin/account-lockout-config" element={
              <RequireAdmin>
                <AdminAccountLockoutConfig />
              </RequireAdmin>
            } />
            <Route path="/admin/segments" element={
              <RequireAdmin>
                <AdminSegments />
              </RequireAdmin>
            } />
            <Route path="/admin/abandoned-carts" element={
              <RequireAdmin>
                <AdminAbandonedCarts />
              </RequireAdmin>
            } />
            <Route path="/admin/home-settings" element={
              <RequireAdmin>
                <AdminHomeSettings />
              </RequireAdmin>
            } />
            <Route path="/admin/company-settings" element={
              <RequireAdmin>
                <AdminCompanySettings />
              </RequireAdmin>
            } />
            <Route path="/admin/cassandra" element={
              <RequireAdmin>
                <AdminCassandra />
              </RequireAdmin>
            } />
            <Route path="/admin/cassandra-ranks" element={
              <RequireAdmin>
                <AdminCassandraRanks />
              </RequireAdmin>
            } />
            <Route path="/admin/email-templates" element={
              <RequireAdmin>
                <AdminEmailTemplates />
              </RequireAdmin>
            } />
            <Route path="/admin/xp-config" element={
              <RequireAdmin>
                <AdminXpConfig />
              </RequireAdmin>
            } />
            <Route path="/admin/invoices" element={
              <RequireAdmin>
                <AdminInvoices />
              </RequireAdmin>
            } />
            <Route path="/admin/gift-tiers" element={
              <RequireAdmin>
                <AdminGiftTiers />
              </RequireAdmin>
            } />
            <Route path="/admin/shipping" element={
              <RequireAdmin>
                <AdminShippingZones />
              </RequireAdmin>
            } />
            <Route path="/admin/manual-orders/create" element={
              <RequireAdmin>
                <AdminManualOrderCreate />
              </RequireAdmin>
            } />
            <Route path="/admin/manual-orders/history" element={
              <RequireAdmin>
                <AdminManualOrderHistory />
              </RequireAdmin>
            } />
            <Route path="/admin/reviews" element={
              <RequireAdmin>
                <AdminReviews />
              </RequireAdmin>
            } />
            <Route path="/admin/settings" element={
              <RequireAdmin>
                <AdminSystemSettings />
              </RequireAdmin>
            } />
          </Routes>
        </Suspense>
      </main>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <SessionExpiredNotification />}
      {!isAdminRoute && <CookieConsent />}
    </div>
  );
});

MainContent.displayName = 'MainContent';

// Optimized app content
function AppContent() {
  useIOSNoZoomOnFocus();
  // useRoutePrefetch(); // Enable route prefetching - temporarily disabled
  const [rateLimitError, setRateLimitError] = useState<RateLimitError | null>(null);

  // Rate limit event listener
  useEffect(() => {
    const handleRateLimit = (event: Event) => {
      const customEvent = event as CustomEvent;
      setRateLimitError(customEvent.detail);
    };

    window.addEventListener('api:rateLimit', handleRateLimit);
    return () => window.removeEventListener('api:rateLimit', handleRateLimit);
  }, []);

  // Initialize Google Analytics 4 - once per session
  useEffectOnce(() => {
    try {
      initializeGA4();
    } catch (e) {
      if (import.meta.env.DEV) {
        logWarn('GA4 initialization failed:', e);
      }
    }
  });

  // Track visitor - once per session
  useEffectOnce(() => {
    try {
      if (typeof window !== 'undefined') {
        const alreadyTracked = window.sessionStorage.getItem('visitTracked');
        if (!alreadyTracked) {
          visitorService.trackVisit().then((result) => {
            if (result && import.meta.env.DEV) {
              logInfo('Visit tracked successfully. Total visits:', result.totalCount);
            }
          }).catch((err) => {
            if (import.meta.env.DEV) {
              logWarn('Visitor tracking failed:', err);
            }
          });
          window.sessionStorage.setItem('visitTracked', 'true');
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        logWarn('Visitor tracking setup error:', e);
      }
    }
  });

  // Preload critical data on app start - temporarily disabled
  // useEffectOnce(() => {
  //   advancedCache.preloadCriticalData().catch(err => {
  //     if (import.meta.env.DEV) {
  //       logWarn('Failed to preload critical data:', err);
  //     }
  //   });
  // });

  return (
    <>
      <ScrollToTop />
      <ReferralTracker />
      <MainContent />
      <RateLimitNotification
        error={rateLimitError}
        onClose={() => setRateLimitError(null)}
      />
    </>
  );
}

export default AppWrapper;