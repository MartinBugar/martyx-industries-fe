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

  // Helper function to format currency
  const formatPrice = (amount: number, currency?: string) => {
    const cur = currency || (items.length > 0 ? items[0].product.currency : 'USD');
    return `${amount.toFixed(2)} ${cur === 'EUR' ? '€' : cur}`;
  };

  const subtotal = getTotalPrice();
  // Check if all items are digital products (no shipping needed for digital products)
  const hasPhysicalProducts = items.some(item => item.product.productType === 'PHYSICAL');
  const shipping = items.length > 0 && hasPhysicalProducts ? 5.99 : 0;
  const total = subtotal + shipping;
  const isEmpty = items.length === 0;

  return (
    <div className="cart-page-container">
      <div className="cart-page-header">
        <h1>Shopping Cart</h1>
        <p className="cart-page-subtitle">
          {isEmpty ? 'Your cart is waiting for some amazing products!' : `${getTotalItems()} ${getTotalItems() === 1 ? 'item' : 'items'} ready for checkout`}
        </p>
      </div>
      
      {isEmpty ? (
        <section className="empty-cart" role="region" aria-labelledby="empty-cart-title">
          <div className="empty-cart-icon" aria-hidden="true">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h9m-9 0a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4z"/>
            </svg>
          </div>
          <h2 id="empty-cart-title">Your cart is empty</h2>
          <p>Discover amazing products and start building your collection today!</p>
          <div className="empty-cart-actions">
            <button className="primary-btn" onClick={handleBackToShopping}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h9m-9 0a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4z"/>
              </svg>
              Start Shopping
            </button>
            <button className="secondary-btn" onClick={handleGoHome}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
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
                aria-label="Clear all items from cart"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
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
                      <div aria-hidden="true" style={{width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="cart-item-details">
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.product.name}</h3>
                      <div className="cart-item-type">
                        {isDigital ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                            <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"/>
                            <path d="m3.3 7 8.7 5 8.7-5"/>
                            <path d="M12 22V12"/>
                          </svg>
                        )}
                        {item.product.productType}
                      </div>
                      <div className="cart-item-price">
                        <span className="price-amount">{formatPrice(item.product.price, item.product.currency)}</span>
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
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                        <span className="quantity-display" aria-live="polite" aria-atomic="true">{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          className="quantity-btn"
                          aria-label={`Increase quantity of ${item.product.name}`}
                          disabled={isDigital && item.quantity >= 1}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                      </div>
                      
                      <div className="cart-item-total">
                        <span className="total-label">Total</span>
                        <span className="total-amount">{formatPrice(item.product.price * item.quantity, item.product.currency)}</span>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="remove-btn"
                        aria-label={`Remove ${item.product.name} from cart`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"/>
                  <path d="m12 19-7-7 7-7"/>
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
                <span>{formatPrice(subtotal)}</span>
              </div>
              {hasPhysicalProducts && (
                <>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>{shipping > 0 ? formatPrice(shipping) : 'Free'}</span>
                  </div>
                  {shipping > 0 && (
                    <div className="free-shipping-notice">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Free shipping on orders over $50
                    </div>
                  )}
                </>
              )}
              {!hasPhysicalProducts && items.length > 0 && (
                <div className="digital-products-notice">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                  Digital products - delivered via email
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            
            <div className="summary-actions">
              <button className="primary-btn checkout-btn" onClick={handleCheckout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"/>
                  <path d="m16 8 2 2-2 2"/>
                  <path d="M21 12H18"/>
                </svg>
                Proceed to Checkout
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
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