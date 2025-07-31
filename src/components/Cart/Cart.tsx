import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './Cart.css';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ 
  isOpen, 
  onClose, 
  onCheckout
}) => {
  const { items, removeFromCart, updateQuantity, getTotalItems, getTotalPrice } = useCart();
  const navigate = useNavigate();
  
  const handleViewFullCart = () => {
    onClose(); // Close the modal
    navigate('/cart'); // Navigate to the full cart page
  };
  
  if (!isOpen) return null;

  return (
    <div className="cart-modal">
      <div className="cart-content">
        <h2>Your Cart</h2>
        
        {items.length === 0 ? (
          <p className="cart-empty">Your cart is empty</p>
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
              
              <div className="cart-buttons">
                <button className="view-cart-btn" onClick={handleViewFullCart}>
                  View Full Cart
                </button>
                <button className="checkout-btn" onClick={onCheckout}>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
        
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default Cart;