import './App.css'
import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthProvider'
import { useCart } from './context/useCart'
import { DevPasswordGateProvider } from './context/DevPasswordGateProvider'
import { DevPasswordGate } from './components/DevPasswordGate/DevPasswordGate'
import Header from './components/Header/Header'
import Cart from './components/Cart/Cart'
import Footer from './components/Footer/Footer'
import SessionExpiredNotification from './components/SessionExpiredNotification/SessionExpiredNotification'
import Home from './pages/Home'
import Products from './pages/Products'
import About from './pages/About'
import Login from './pages/Login'
import Registration from './pages/Registration'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ResetPasswordRedirect from './pages/ResetPasswordRedirect'
import Checkout from './pages/Checkout/Checkout'
import OrderConfirmation from './pages/OrderConfirmation/OrderConfirmation'
import CartPage from './pages/CartPage/CartPage'
import UserAccount from './pages/UserAccount/UserAccount'
import EmailConfirmation from './components/EmailConfirmation/EmailConfirmation'

// App wrapper to provide DevPasswordGate, AuthContext, and CartContext
function AppWrapper() {
  return (
    <DevPasswordGateProvider>
      <DevPasswordGate>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </DevPasswordGate>
    </DevPasswordGateProvider>
  );
}

// Main content component that uses navigation
function MainContent() {
  const { getTotalItems } = useCart();
  const [showCart, setShowCart] = useState(false);
  const navigate = useNavigate();

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
      <Header 
        cartItems={getTotalItems()} 
        onCartClick={toggleCart} 
      />
      
      <Cart 
        isOpen={showCart} 
        onClose={toggleCart} 
        onCheckout={handleCheckout} 
      />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
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
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/account" element={<UserAccount />} />
        </Routes>
      </main>
      
      <Footer />
      
      {/* Global session expiration notification */}
      <SessionExpiredNotification />
    </div>
  );
}

// Main app content
function AppContent() {
  return (
    <BrowserRouter>
      <MainContent />
    </BrowserRouter>
  );
}

export default AppWrapper;
