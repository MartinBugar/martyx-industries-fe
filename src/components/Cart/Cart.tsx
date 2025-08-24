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
          <h2 id={titleId}>Your Cart ({getTotalItems()})</h2>
          <button className="close-icon-btn" aria-label="Close cart" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Start adding some amazing products!</p>
            <button className="secondary-btn" onClick={handleViewFullCart}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h9m-9 0a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4z"/>
              </svg>
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => {
                const thumb = item.product.gallery?.[0];
                const isDigital = item.product.productType === 'DIGITAL';
                return (
                  <div key={item.product.id} className="cart-item">
                    <div className="cart-item-thumb-container">
                      {thumb ? (
                        <img className="cart-item-thumb" src={thumb} alt={item.product.name} />
                      ) : (
                        <div className="cart-item-thumb cart-item-thumb-placeholder">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
                          </svg>
                        </div>
                      )}
                      {isDigital && (
                        <div className="digital-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                            <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                          </svg>
                          Digital
                        </div>
                      )}
                    </div>
                    
                    <div className="cart-item-main">
                      <div className="cart-item-top">
                        <h3 className="cart-item-name">{item.product.name}</h3>
                        <span className="cart-item-price">${item.product.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="cart-item-actions">
                        <div className="quantity-controls" aria-label="Quantity controls">
                          <button 
                            onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1))}
                            className="quantity-btn"
                            aria-label={`Decrease quantity of ${item.product.name}`}
                            disabled={item.quantity <= 1}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                          </button>
                          <span className="quantity" aria-live="polite">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="quantity-btn"
                            aria-label={`Increase quantity of ${item.product.name}`}
                            disabled={isDigital && item.quantity >= 1}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                          </button>
                        </div>
                        
                        <span className="item-total">${(item.product.price * item.quantity).toFixed(2)}</span>
                        
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="remove-btn"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                          </svg>
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
                <span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                  </svg>
                  {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
                </span>
                <strong>${getTotalPrice().toFixed(2)}</strong>
              </div>
              
              <div className="cart-buttons">
                <button className="view-cart-btn" onClick={handleViewFullCart}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                  </svg>
                  View Full Cart
                </button>
                <button className="checkout-btn" onClick={onCheckout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"/>
                    <path d="m16 8 2 2-2 2"/>
                    <path d="M21 12H18"/>
                  </svg>
                  Secure Checkout
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