import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import './Checkout.css';
import { paymentService } from '../../services/paymentService';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: ''
  });

  // If returned from PayPal to /checkout with payment params, forward to success route
  useEffect(() => {
    const paymentId = searchParams.get('paymentId');
    if (paymentId) {
      const params = new URLSearchParams();
      params.set('paymentId', paymentId);
      const payerEmail = searchParams.get('PayerEmail');
      if (payerEmail) params.set('PayerEmail', payerEmail);
      navigate(`/payment/paypal/success?${params.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle PayPal payment creation and redirect
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in your name and email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setIsProcessing(true);

      // Persist email for later use (success page and order confirmation)
      sessionStorage.setItem('customerEmail', formData.email);
      localStorage.setItem('customerEmail', formData.email);

      // Build order DTO expected by backend (guest checkout supported)
      const orderDto = {
        orderItems: items.map((item) => ({
          product: { id: item.product.id, name: item.product.name },
          quantity: item.quantity,
          price: item.product.price,
          currency: item.product.currency ?? 'USD',
        })),
        totalAmount: getTotalPrice(),
        currency: items[0]?.product.currency ?? 'USD',
        user: { email: formData.email },
      };

      // Create PayPal payment
      const payment = await paymentService.createPayPalPayment(orderDto);

      if (!payment.paymentUrl) {
        // If backend returns a completed/pending payment without a redirect URL, go to the summary page
        navigate('/payment/paypal/success', { state: { payment } });
        return;
      }

      // Redirect to approval/success URL provided by backend
      window.location.href = payment.paymentUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate payment';
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // If redirected from PayPal with payment params, show processing instead of empty cart
  if (searchParams.get('paymentId')) {
    return (
      <div className="checkout-container">
        <div className="empty-cart-message">
          <h2>Finalizing your payment…</h2>
          <p>Redirecting to payment summary.</p>
        </div>
      </div>
    );
  }
  
  // If cart is empty, redirect to products
  if (items.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-cart-message">
          <h2>Your cart is empty</h2>
          <p>Add some products to your cart before proceeding to checkout.</p>
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      <div className="checkout-content">
        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          
          <div className="order-items">
            {items.map(item => (
              <div key={item.product.id} className="order-item">
                <div className="item-name">{item.product.name}</div>
                <div className="item-details">
                  <span>Qty: {item.quantity}</span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="order-total">
            <span>Total:</span>
            <span>${getTotalPrice().toFixed(2)}</span>
          </div>
          
          <div className="delivery-info">
            <h3>Digital Product Delivery</h3>
            <p>Your digital product will be delivered to your email immediately after purchase.</p>
          </div>
        </div>
        
        {/* Checkout Form */}
        <div className="checkout-form-container">
          <h2>Your Information</h2>
          
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
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
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <h3>Payment</h3>
            <p>We use PayPal for secure checkout of digital products.</p>
            <button
              type="submit"
              className="place-order-btn"
              disabled={isProcessing}
            >
              {isProcessing ? 'Redirecting…' : 'Pay with PayPal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;