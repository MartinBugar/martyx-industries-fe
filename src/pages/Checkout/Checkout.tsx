import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/useCart';
import './Checkout.css';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}

const Checkout: React.FC = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: ''
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.cardNumber || !formData.cardExpiry || !formData.cardCvc) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    // Process payment (mock)
    setIsProcessing(true);
    
    // Simulate payment processing delay
    setTimeout(() => {
      setIsProcessing(false);
      
      // Store email in session storage for order confirmation
      sessionStorage.setItem('customerEmail', formData.email);
      
      // Clear cart and navigate to order confirmation
      clearCart();
      navigate('/order-confirmation');
    }, 2000);
  };
  
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
            
            <h3>Payment Information</h3>
            
            <div className="form-group">
              <label htmlFor="cardNumber">Card Number</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cardExpiry">Expiry Date</label>
                <input
                  type="text"
                  id="cardExpiry"
                  name="cardExpiry"
                  placeholder="MM/YY"
                  value={formData.cardExpiry}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cardCvc">CVC</label>
                <input
                  type="text"
                  id="cardCvc"
                  name="cardCvc"
                  placeholder="123"
                  value={formData.cardCvc}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="place-order-btn"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;