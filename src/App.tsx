import './App.css'
import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthProvider'
import { useCart } from './context/useCart'
import Header from './components/Header/Header'
import Cart from './components/Cart/Cart'
import Footer from './components/Footer/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import About from './pages/About'
import Login from './pages/Login'
import Registration from './pages/Registration'
import Checkout from './pages/Checkout/Checkout'
import OrderConfirmation from './pages/OrderConfirmation/OrderConfirmation'
import CartPage from './pages/CartPage/CartPage'
import UserAccount from './pages/UserAccount/UserAccount'

// App wrapper to provide CartContext and AuthContext
function AppWrapper() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
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
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/account" element={<UserAccount />} />
        </Routes>
      </main>
      
      <Footer />
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
