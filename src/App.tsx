import './App.css'
import { useState } from 'react'
import { product } from './data/productData'
import Header from './components/Header'
import Cart from './components/Cart'
import ProductView from './components/ProductView'
import ProductDetails from './components/ProductDetails'
import Footer from './components/Footer'

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
        <div className="product-container">
          <ProductView product={product} />
          <ProductDetails 
            product={product} 
            onAddToCart={addToCart} 
          />
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default App
