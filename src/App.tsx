import './App.css'
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { useCart } from './context/CartContext'
import Header from './components/Header/Header'
import Cart from './components/Cart/Cart'
import Footer from './components/Footer/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import About from './pages/About'
import Checkout from './pages/Checkout/Checkout'
import OrderConfirmation from './pages/OrderConfirmation/OrderConfirmation'

// App wrapper to provide CartContext
function AppWrapper() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

// Main app content
function AppContent() {
  const { getTotalItems } = useCart();
  const [showCart, setShowCart] = useState(false);

  const toggleCart = () => {
    setShowCart(!showCart);
  };

  const handleCheckout = () => {
    // Close the cart and navigate to checkout page
    setShowCart(false);
    window.location.href = '/checkout';
  };

  return (
    <BrowserRouter>
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
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default AppWrapper;
