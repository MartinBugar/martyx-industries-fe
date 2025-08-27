import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import './Checkout.css';
import PayPalCheckoutButton from '../../components/PayPalCheckoutButton';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}

const Checkout: React.FC = () => {
  const { items, getTotalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payStatus, setPayStatus] = useState<"idle"|"processing"|"success"|"error">("idle");
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: ''
  });

  // Compute cartHash that changes when cart total or items change
  const cartHash = useMemo(() => {
    const totalCents = Math.round(getTotalPrice() * 100);
    return `${totalCents}:${items.length}`;
  }, [getTotalPrice, items.length]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // PayPal success handler
  const handlePayPalSuccess = (capture: unknown) => {
    setPayStatus("success");
    console.log('Payment successful:', capture);
    
    // Persist email for later use
    if (formData.email) {
      sessionStorage.setItem('customerEmail', formData.email);
      localStorage.setItem('customerEmail', formData.email);
    }
    
    // TODO: Navigate to thank-you page with order summary
    // navigate('/order/thank-you', { state: { capture, orderSummary } });
    
    // For now, show success message
    alert('Payment successful! You will receive your digital products via email.');
  };

  // PayPal error handler
  const handlePayPalError = (err: unknown) => {
    console.error('PayPal payment error:', err);
    setPayStatus("error");
    alert('Payment failed. Please try again.');
  };
  
  // If redirected from PayPal with payment params, show processing instead of empty cart
  if (searchParams.get('paymentId')) {
    return (
      <main className="checkout-container" role="main" aria-labelledby="checkout-title">
        <div className="empty-cart-message">
          <h2>Finalizing your payment…</h2>
          <p>Redirecting to payment summary.</p>
        </div>
      </main>
    );
  }
  
  // If cart is empty, redirect to products
  if (items.length === 0) {
    return (
      <main className="checkout-container" role="main" aria-labelledby="checkout-title">
        <div className="empty-cart-message">
          <h2 id="checkout-title">Your cart is empty</h2>
          <p>Add some products to your cart before proceeding to checkout.</p>
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }
  
  return (
    <main className="checkout-container" role="main" aria-labelledby="checkout-title">
      <h1 id="checkout-title">Checkout</h1>
      
      <div className="checkout-content">
        {/* Order Summary */}
        <div className="order-summary" role="region" aria-labelledby="order-summary-title">
          <h2 id="order-summary-title">Order Summary</h2>
          
          <div className="order-items" role="list">
            {items.map(item => {
              const unit = Number(item.product.price);
              const qty = Number(item.quantity);
              const lineTotal = (unit * qty).toFixed(2);
              return (
                <div
                  key={item.product.id}
                  className="order-item"
                  role="listitem"
                  aria-label={`${item.product.name}, quantity ${qty}, total €${lineTotal}`}
                >
                  <div className="item-name">{item.product.name}</div>
                  <div className="item-details">
                    <span className="item-meta">€{unit.toFixed(2)} × {qty}</span>
                    <span className="item-amount">€{lineTotal}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="order-breakdown" aria-live="polite">
            <div className="breakdown-row">
              <span>Items ({items.length})</span>
              <span>€{getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="breakdown-row muted">
              <span>Fees</span>
              <span>€0.00</span>
            </div>
            <div className="order-total breakdown-total">
              <span>Total</span>
              <span>€{getTotalPrice().toFixed(2)}</span>
            </div>
          </div>
          
          <div className="delivery-info">
            <h3>Digital Product Delivery</h3>
            <p>Your digital product will be delivered to your email immediately after purchase.</p>
          </div>
        </div>
        
        {/* Checkout Form */}
        <div className="checkout-form-container">
          <h2>Your Information</h2>
          
          <form className="checkout-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email (for digital delivery)</label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <h3>Payment</h3>
            <p>We use PayPal for secure checkout of digital products.</p>
            
            {/* PayPal Checkout Button */}
            <div className="payment-section">
              <h3>Pay with PayPal</h3>
              <PayPalCheckoutButton
                items={items}
                totalAmount={getTotalPrice()}
                currency={"EUR"}
                email={formData.email}
                cartHash={cartHash}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
              />
            </div>
            
            {/* Status messages */}
            <div className="payment-status" role="status" aria-live="polite" aria-atomic="true">
              {payStatus === "processing" && <p>Processing payment…</p>}
              {payStatus === "success" && <p>Payment completed.</p>}
              {payStatus === "error" && <p>Payment failed. Please try again.</p>}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Checkout;