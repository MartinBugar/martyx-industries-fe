import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/useCart';
import './CartPage.css';

const CartPage: React.FC = () => {
  const { items, removeFromCart, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleBackToShopping = () => {
    navigate('/products');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const subtotal = getTotalPrice();
  const shipping = items.length > 0 ? 5.99 : 0;
  const total = subtotal + shipping;
  const isEmpty = items.length === 0;

  return (
    <div className="cart-page-container">
      
      {isEmpty ? (
        <section className="empty-cart" role="region" aria-labelledby="empty-cart-title">
          <div className="empty-cart-icon" aria-hidden="true">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h9m-9 0a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 id="empty-cart-title">Your cart is empty</h2>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <div className="empty-cart-actions">
            <button className="primary-btn" onClick={handleBackToShopping}>
              Start Shopping
            </button>
            <button className="secondary-btn" onClick={handleGoHome}>
              Go to Home
            </button>
          </div>
        </section>
      ) : (
        <div className="cart-layout">
          <div className="cart-main">
            <div className="cart-items-header">
              <h2>Cart Items</h2>
              <button 
                className="clear-cart-btn"
                onClick={clearCart}
              >
                Clear Cart
              </button>
            </div>
            
            <div className="cart-items">
              {items.map(item => {
                const thumb = item.product.gallery?.[0];
                const isDigital = item.product.productType === 'DIGITAL';
                return (
                <div key={item.product.id} className="cart-item">
                  <div className="cart-item-image">
                    {thumb ? (
                      <img src={thumb} alt={item.product.name} />
                    ) : (
                      <div aria-hidden="true" style={{width: '100%', height: '100%', background: '#f1f5f9'}} />
                    )}
                  </div>
                  
                  <div className="cart-item-details">
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.product.name}</h3>
                      <p className="cart-item-type">{item.product.productType}</p>
                      <div className="cart-item-price">
                        <span className="price-amount">${item.product.price.toFixed(2)}</span>
                        {item.quantity > 1 && (
                          <span className="price-per-item">each</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="cart-item-actions">
                      <div className="quantity-controls" aria-label={`Quantity controls for ${item.product.name}`}>
                        <button 
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          className="quantity-btn"
                          aria-label={`Decrease quantity of ${item.product.name}`}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="quantity-display" aria-live="polite" aria-atomic="true">{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          className="quantity-btn"
                          aria-label={`Increase quantity of ${item.product.name}`}
                          disabled={isDigital && item.quantity >= 1}
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="cart-item-total">
                        <span className="total-label">Total</span>
                        <span className="total-amount">${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="remove-btn"
                        aria-label={`Remove ${item.product.name} from cart` }
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
            
            <div className="cart-continue-shopping">
              <button className="secondary-btn" onClick={handleBackToShopping}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Continue Shopping
              </button>
            </div>
          </div>
          
          <div className="cart-summary">
            <div className="summary-header">
              <h2>Order Summary</h2>
            </div>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal ({getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''})</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping > 0 ? `$${shipping.toFixed(2)}` : 'Free'}</span>
              </div>
              {shipping > 0 && (
                <div className="free-shipping-notice">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Free shipping on orders over $50
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="summary-actions">
              <button className="primary-btn checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="secure-checkout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Secure checkout
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;