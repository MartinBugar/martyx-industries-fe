import './App.css'
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import SecurityErrorBoundary from './components/security/SecurityErrorBoundary'
import { setupCSPReporting, initializeCSRFToken } from './utils/security'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthProvider'
import { useCart } from './context/useCart'
import { DevPasswordGateProvider } from './context/DevPasswordGateProvider'
import { DevPasswordGate } from './components/DevPasswordGate/DevPasswordGate'
// import { ParticleEffects, particleConfigs } from './components/effects'
import ConstellationParticles from './components/effects/ConstellationParticles'
import Navbar from './components/Navbar/Navbar'
import { useAuth } from './context/useAuth'
import Cart from './components/Cart/Cart'
import Footer from './components/Footer/Footer'
import SessionExpiredNotification from './components/SessionExpiredNotification/SessionExpiredNotification'
import Home from './pages/Home/Home'
import { visitorService } from './services/visitorService'
import Products from './pages/Products/Products'
import ProductDetail from './pages/ProductDetail/ProductDetail'
import About from './pages/About/About'
import Login from './pages/Login'
import Registration from './pages/Registration'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ResetPasswordRedirect from './pages/ResetPasswordRedirect'
import Checkout from './pages/Checkout/Checkout'
import PayPalSuccess from './pages/Payments/PayPalSuccess'
import PayPalCancel from './pages/Payments/PayPalCancel'
import CartPage from './pages/CartPage/CartPage'
import UserAccount from './pages/UserAccount/UserAccount'
import EmailConfirmation from './components/EmailConfirmation/EmailConfirmation'
import CookieConsent from './components/CookieConsent/CookieConsent'
import CookiesPolicy from './pages/CookiesPolicy/CookiesPolicy'
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService/TermsOfService'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import RequireAdmin from './pages/admin/RequireAdmin'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductDetail from './pages/admin/AdminProductDetail'
import AdminOrders from './pages/admin/AdminOrders'
import { useIOSNoZoomOnFocus } from './hooks/useIOSNoZoomOnFocus'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'

// PayPal configuration
const paypalOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "ARuSpd8MqECuEZ-L8I5tOHUSCRPNcTXHq7C_pliB76gHjIcE3ehpjEir8GUP760PB0Ap4sIpkuuDKqjh",
  currency: "EUR",
  intent: "capture"
  // optional: "locale": "sk_SK",
};

// App wrapper to provide DevPasswordGate, AuthContext, and CartContext
function AppWrapper() {
  // Inicializácia bezpečnostných opatrení
  useEffect(() => {
    setupCSPReporting();
    initializeCSRFToken();
  }, []);

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <SecurityErrorBoundary>
        <DevPasswordGateProvider>
          <DevPasswordGate>
            <AuthProvider>
              <CartProvider>
                <AppContent />
              </CartProvider>
            </AuthProvider>
          </DevPasswordGate>
        </DevPasswordGateProvider>
      </SecurityErrorBoundary>
    </PayPalScriptProvider>
  );
}

// Main content component that uses navigation
function MainContent() {
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const [showCart, setShowCart] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const toggleCart = () => {
    setShowCart(!showCart);
  };

  const handleCheckout = () => {
    // Close the cart and navigate to checkout page using React Router
    setShowCart(false);
    navigate('/checkout');
  };

  return (
    <div className="app-container">
      {/* Constellation Particle Network */}
      <ConstellationParticles />
      
      {/* Advanced Particle Effects (disabled for testing) */}
      {/* <ParticleEffects
        enabled={true}
        {...particleConfigs.sparkle}
      /> */}
      
      {!isAdminRoute && (
        <Navbar cartCount={getTotalItems()} user={user} onLogout={logout} />
      )}
      
      {!isAdminRoute && (
        <Cart 
          isOpen={showCart} 
          onClose={toggleCart} 
          onCheckout={handleCheckout} 
        />
      )}

      <main className="main-content" style={isAdminRoute ? { padding: 0 } : undefined}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Handle backend reset password URL pattern */}
          <Route path="/api/auth/reset-password" element={<ResetPasswordRedirect />} />
          <Route path="/confirm-email" element={<EmailConfirmation />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/paypal/success" element={<PayPalSuccess />} />
          <Route path="/payment/paypal/cancel" element={<PayPalCancel />} />
          <Route path="/account" element={<UserAccount />} />
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
          <Route path="/admin/products/:id" element={
            <RequireAdmin>
              <AdminProductDetail />
            </RequireAdmin>
          } />
          <Route path="/admin/orders" element={
            <RequireAdmin>
              <AdminOrders />
            </RequireAdmin>
          } />
        </Routes>
      </main>
      
      {!isAdminRoute && <Footer />}
      
      {/* Global session expiration notification */}
      {!isAdminRoute && <SessionExpiredNotification />}

      {/* Cookie consent banner */}
      {!isAdminRoute && <CookieConsent />}
    </div>
  );
}

// Main app content
function AppContent() {
  useIOSNoZoomOnFocus();
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const alreadyTracked = window.sessionStorage.getItem('visitTracked');
        if (!alreadyTracked) {
          visitorService.trackVisit().catch((err) => {
            console.warn('Visitor tracking failed:', err);
          });
          window.sessionStorage.setItem('visitTracked', 'true');
        }
      }
    } catch (e) {
      console.warn('Visitor tracking setup error:', e);
    }
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <MainContent />
    </BrowserRouter>
  );
}

export default AppWrapper;
