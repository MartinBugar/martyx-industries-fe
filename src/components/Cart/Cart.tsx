import React from 'react';
import { type Product } from '../../data/productData';
import './Cart.css';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  cartItems: number;
  product: Product;
}

const Cart: React.FC<CartProps> = ({ 
  isOpen, 
  onClose, 
  onCheckout, 
  cartItems, 
  product 
}) => {
  if (!isOpen) return null;

  return (
    <div className="cart-modal">
      <div className="cart-content">
        <h2>Your Cart</h2>
        
        {cartItems === 0 ? (
          <p className="cart-empty">Your cart is empty</p>
        ) : (
          <>
            <div className="cart-item">
              <span>{product.name}</span>
              <span>Quantity: {cartItems}</span>
              <span>${(product.price * cartItems).toFixed(2)}</span>
            </div>
            
            <div className="cart-total">
              <strong>Total: ${(product.price * cartItems).toFixed(2)}</strong>
            </div>
            
            <button className="checkout-btn" onClick={onCheckout}>
              Checkout
            </button>
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