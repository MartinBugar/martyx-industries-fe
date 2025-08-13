import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/useCart';
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const titleId = 'your-cart-title';
  
  const handleViewFullCart = () => {
    onClose();
    navigate('/cart');
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => drawerRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  return (
    <div className="cart-modal" aria-hidden={!isOpen} onClick={onClose}>
      <div
        className="cart-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        ref={drawerRef}
        tabIndex={-1}
      >
        <div className="cart-header">
          <h2 id={titleId}>Your Cart</h2>
          <button className="close-icon-btn" aria-label="Close cart" onClick={onClose}>×</button>
        </div>
        
        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty</p>
            <button className="secondary-btn" onClick={handleViewFullCart}>Continue shopping</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => {
                const thumb = item.product.gallery?.[0];
                return (
                  <div key={item.product.id} className="cart-item">
                    {thumb && (
                      <img className="cart-item-thumb" src={thumb} alt={item.product.name} />
                    )}
                    <div className="cart-item-main">
                      <div className="cart-item-top">
                        <span className="cart-item-name">{item.product.name}</span>
                        <span className="cart-item-price">${item.product.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="cart-item-actions">
                        <div className="quantity-controls" aria-label="Quantity controls">
                          <button 
                            onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1))}
                            className="quantity-btn"
                            aria-label={`Decrease quantity of ${item.product.name}`}
                          >
                            −
                          </button>
                          <span className="quantity" aria-live="polite">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="quantity-btn"
                            aria-label={`Increase quantity of ${item.product.name}`}
                          >
                            +
                          </button>
                        </div>
                        
                        <span className="item-total">${(item.product.price * item.quantity).toFixed(2)}</span>
                        
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="remove-btn"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="cart-summary">
              <div className="cart-total">
                <span>Items: {getTotalItems()}</span>
                <strong>Total: ${getTotalPrice().toFixed(2)}</strong>
              </div>
              
              <div className="cart-buttons">
                <button className="view-cart-btn" onClick={handleViewFullCart}>
                  View Cart
                </button>
                <button className="checkout-btn" onClick={onCheckout}>
                  Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;