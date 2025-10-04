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
import React, { useState, useCallback, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'

// Core providers and security
import SecurityErrorBoundary from './components/security/SecurityErrorBoundary'
import { setupCSPReporting, initializeCSRFToken } from './utils/security'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthProvider'
import { WishlistProvider } from './context/WishlistContext'
import { useCart } from './context/useCart'

// Core components (not lazy loaded as they're needed immediately)
import Navbar from './components/Navbar/Navbar'
import { useAuth } from './context/useAuth'
// Cart component will be loaded via lazy import
import Footer from './components/Footer/Footer'
import SessionExpiredNotification from './components/SessionExpiredNotification/SessionExpiredNotification'
import CookieConsent from './components/CookieConsent/CookieConsent'
import RequireAdmin from './pages/admin/RequireAdmin'
import { useIOSNoZoomOnFocus } from './hooks/useIOSNoZoomOnFocus'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import LoadingSpinner from './components/common/LoadingSpinner'
import { useEffectOnce } from './hooks/useOptimizedEffect'
import { visitorService } from './services/visitorService'

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
  PayPalSuccess,
  PayPalCancel,
  CartPage,
  Wishlist,
  UserAccount,
  UserGallery,
  UserGalleryDetail,
  EmailConfirmation,
  CookiesPolicy,
  PrivacyPolicy,
  TermsOfService,
  AdminLogin,
  AdminDashboard,
  AdminUsers,
  AdminUserDetail,
  AdminProducts,
  AdminProductDetail,
  AdminProductGallery,
  AdminOrders,
  AdminCassandra,
  ConstellationParticles
} from './utils/lazyImports'

// PayPal configuration - memoized to prevent recreation
const paypalOptions = {
  clientId: "Ae8bJdL8EaBJQtmDskm-esvEkUNfollfToURcmnNN4XCTl2j48YGAUQNUkUs6zthKZRndlKwSESyvFnh",
  currency: "EUR",
  intent: "capture"
} as const;

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="large" message="Loading page..." />
  </div>
);

// Optimized App wrapper with memoized security initialization
function AppWrapper() {
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

  return (
    <BrowserRouter>
      <PayPalScriptProvider options={paypalOptions}>
        <SecurityErrorBoundary>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <AppContent />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SecurityErrorBoundary>
      </PayPalScriptProvider>
    </BrowserRouter>
  );
}

// Memoized main content component
const MainContent = React.memo(() => {
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const [showCart, setShowCart] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

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
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment/paypal/success" element={<PayPalSuccess />} />
            <Route path="/payment/paypal/cancel" element={<PayPalCancel />} />
            <Route path="/account" element={<UserAccount />} />
            <Route path="/gallery" element={<UserGallery />} />
            <Route path="/gallery/:userId" element={<UserGalleryDetail />} />
            <Route path="/cookies-policy" element={<CookiesPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

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
            <Route path="/admin/orders" element={
              <RequireAdmin>
                <AdminOrders />
              </RequireAdmin>
            } />
            <Route path="/admin/cassandra" element={
              <RequireAdmin>
                <AdminCassandra />
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

  // Track visitor - once per session
  useEffectOnce(() => {
    try {
      if (typeof window !== 'undefined') {
        const alreadyTracked = window.sessionStorage.getItem('visitTracked');
        if (!alreadyTracked) {
          visitorService.trackVisit().then((result) => {
            if (result && import.meta.env.DEV) {
              console.log('Visit tracked successfully. Total visits:', result.totalCount);
            }
          }).catch((err) => {
            if (import.meta.env.DEV) {
              console.warn('Visitor tracking failed:', err);
            }
          });
          window.sessionStorage.setItem('visitTracked', 'true');
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('Visitor tracking setup error:', e);
      }
    }
  });

  return (
    <>
      <ScrollToTop />
      <MainContent />
    </>
  );
}

export default AppWrapper;