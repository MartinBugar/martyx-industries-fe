import './App.css'
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { product } from './data/productData'
import Header from './components/Header/Header'
import Cart from './components/Cart/Cart'
import Footer from './components/Footer/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import About from './pages/About'

function App() {
  const [cartItems, setCartItems] = useState(0)
  const [showCart, setShowCart] = useState(false)

  const addToCart = () => {
    setCartItems(cartItems + 1)
  }

  const toggleCart = () => {
    setShowCart(!showCart)
  }

  const checkout = () => {
    alert(`Thank you for your purchase of ${cartItems} item(s)!`)
    setCartItems(0)
    setShowCart(false)
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Header 
          cartItems={cartItems} 
          onCartClick={toggleCart} 
        />
        
        <Cart 
          isOpen={showCart} 
          onClose={toggleCart} 
          onCheckout={checkout} 
          cartItems={cartItems} 
          product={product} 
        />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home onAddToCart={addToCart} />} />
            <Route path="/products" element={<Products onAddToCart={addToCart} />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
