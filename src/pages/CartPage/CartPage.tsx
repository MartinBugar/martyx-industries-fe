import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './CartPage.css';

const CartPage: React.FC = () => {
  const { items, removeFromCart, updateQuantity, getTotalItems, getTotalPrice } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleBackToShopping = () => {
    navigate('/products');
  };

  return (
    <div className="cart-page-container">
      <h1>Your Cart</h1>
      
      {items.length === 0 ? (
        <div className="empty-cart">
          <p className="cart-empty">Your cart is empty</p>
          <button className="back-to-shopping-btn" onClick={handleBackToShopping}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map(item => (
              <div key={item.product.id} className="cart-item">
                <div className="cart-item-details">
                  <span className="cart-item-name">{item.product.name}</span>
                  <span className="cart-item-price">${item.product.price.toFixed(2)}</span>
                </div>
                
                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                  
                  <span className="item-total">${(item.product.price * item.quantity).toFixed(2)}</span>
                  
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <div className="cart-total">
              <span>Total Items: {getTotalItems()}</span>
              <strong>Total: ${getTotalPrice().toFixed(2)}</strong>
            </div>
            
            <div className="cart-actions">
              <button className="back-to-shopping-btn" onClick={handleBackToShopping}>
                Continue Shopping
              </button>
              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;