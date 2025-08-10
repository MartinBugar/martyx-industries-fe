import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { product } from '../../data/productData';
import { ordersService } from '../../services/ordersService';
import './OrderConfirmation.css';

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const [downloadUrls] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem('downloadUrls');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  useEffect(() => {
    // Get customer email from session storage
    const email = sessionStorage.getItem('customerEmail');
    if (!email) {
      // If no email is found, redirect to home page
      navigate('/');
      return;
    }
    
    setCustomerEmail(email);
    
    // Generate a random order number
    const randomOrderNumber = Math.floor(100000000 + Math.random() * 900000000).toString();
    setOrderNumber(randomOrderNumber);
    
    // Simulate email sending
    const emailTimer = setTimeout(() => {
      setIsEmailSent(true);
    }, 2000);
    
    return () => {
      clearTimeout(emailTimer);
    };
  }, [navigate]);
  
  // Format the current date
  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle download click
  const handleDownload = async () => {
    setDownloadError(null);
    if (!downloadUrls || downloadUrls.length === 0) {
      setDownloadError('Download link is not available yet. Please check your email or try again later.');
      return;
    }
    try {
      setDownloading(true);
      // Use the first available download URL; backend may return multiple per item
      await ordersService.downloadByUrl(downloadUrls[0], product.name);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to download product';
      setDownloadError(msg);
    } finally {
      setDownloading(false);
    }
  };
  
  if (!customerEmail) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="order-confirmation-container">
      <div className="order-confirmation-content">
        <div className="order-success">
          <div className="success-icon">✓</div>
          <h1>Thank You for Your Order!</h1>
          <p>Your order has been successfully placed and is being processed.</p>
        </div>
        
        <div className="order-details">
          <h2>Order Details</h2>
          
          <div className="order-info">
            <div className="info-row">
              <span>Order Number:</span>
              <span>{orderNumber}</span>
            </div>
            
            <div className="info-row">
              <span>Date:</span>
              <span>{formatDate()}</span>
            </div>
            
            <div className="info-row">
              <span>Email:</span>
              <span>{customerEmail}</span>
            </div>
            
            <div className="info-row">
              <span>Product:</span>
              <span>{product.name}</span>
            </div>
            
            <div className="info-row">
              <span>Total:</span>
              <span>${product.price.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="digital-delivery">
          <h2>Digital Product Delivery</h2>
          
          <div className="email-status">
            {isEmailSent ? (
              <p className="email-sent">
                <span className="status-icon">✓</span>
                An email with download instructions has been sent to <strong>{customerEmail}</strong>
              </p>
            ) : (
              <p className="email-sending">
                <span className="status-icon">⟳</span>
                Sending email to <strong>{customerEmail}</strong>...
              </p>
            )}
          </div>
          
          <div className="download-section">
            <p>You can also download your product directly from here:</p>
            
            <button 
              className="download-btn"
              onClick={handleDownload}
              disabled={downloading || !downloadUrls || downloadUrls.length === 0}
            >
              {downloading ? 'Downloading…' : `Download ${product.name}.zip`}
            </button>
            {downloadError && (
              <p className="download-info" role="alert" style={{ color: '#b00020' }}>{downloadError}</p>
            )}
            
            <div className="download-info">
              <p>Your download link will expire in 24 hours.</p>
              <p>If you encounter any issues, please contact our support team.</p>
            </div>
          </div>
        </div>
        
        <div className="next-steps">
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;