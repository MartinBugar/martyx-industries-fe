import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stripeService, type StripeSuccessResponse } from '../../services/stripeService';
import { useCart } from '../../context/useCart';
import { API_BASE_URL } from '../../services/apiUtils';

/**
 * Validates and sanitizes download URLs to prevent injection attacks.
 * Only allows URLs starting with /api/download/
 *
 * @param url - The URL to validate
 * @returns Validated full URL or null if invalid
 */
const validateDownloadUrl = (url: string | undefined): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Only allow URLs starting with /api/download/ or /api/download/invoice/
  if (!trimmedUrl.startsWith('/api/download/')) {
    console.error('Invalid download URL format:', trimmedUrl);
    return null;
  }

  // Prevent directory traversal attacks
  if (trimmedUrl.includes('..') || trimmedUrl.includes('//')) {
    console.error('Potential directory traversal in URL:', trimmedUrl);
    return null;
  }

  // Use backend API URL instead of frontend URL
  return `${API_BASE_URL}${trimmedUrl}`;
};

const StripeSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<StripeSuccessResponse | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    // Validate session ID format before making API call
    if (!sessionId) {
      setError('No payment session found');
      setLoading(false);
      return;
    }

    // Validate Stripe session ID format (cs_xxx)
    if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
      setError('Invalid payment session ID');
      setLoading(false);
      return;
    }

    // Fetch payment details from backend
    const fetchPaymentDetails = async () => {
      try {
        const details = await stripeService.getSuccessDetails(sessionId);

        setPaymentData(details);

        // NOTE: Cart clearing is handled automatically by the backend after successful payment
        // No need to manually clear cart here - backend deletes the cart in OrderEventListener
        // Keeping the clearCart() call here would create race conditions with backend deletion

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch payment details:', err);
        setError('Failed to verify payment. Please contact support.');
        setLoading(false);
      }
    };

    fetchPaymentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - sessionId comes from URL and won't change

  if (loading) {
    return (
      <div className="payment-status-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{
          display: 'inline-block',
          width: '48px',
          height: '48px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #635BFF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <h2 style={{ marginTop: '24px', color: '#333' }}>Verifying payment...</h2>
        <p style={{ color: '#666', marginTop: '8px' }}>Please wait while we confirm your order</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-status-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          margin: '0 auto',
          backgroundColor: '#FEE2E2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '36px', color: '#DC2626' }}>✕</span>
        </div>
        <h2 style={{ marginTop: '24px', color: '#DC2626' }}>Payment Verification Failed</h2>
        <p style={{ color: '#666', marginTop: '12px', maxWidth: '500px', margin: '12px auto' }}>{error}</p>
        <button
          onClick={() => navigate('/products')}
          style={{
            marginTop: '32px',
            padding: '12px 32px',
            backgroundColor: '#635BFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="payment-success-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
      {/* Success Icon */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '96px',
          height: '96px',
          margin: '0 auto',
          backgroundColor: '#D1FAE5',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'successPulse 0.6s ease-out'
        }}>
          <span style={{ fontSize: '48px', color: '#059669' }}>✓</span>
        </div>
        <h1 style={{ marginTop: '24px', color: '#059669', fontSize: '32px', fontWeight: 'bold' }}>
          Payment Successful!
        </h1>
        <p style={{ color: '#666', marginTop: '12px', fontSize: '18px' }}>
          Thank you for your purchase
        </p>
      </div>

      {/* Order Details */}
      <div style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '20px', fontWeight: '600' }}>
          Order Details
        </h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {paymentData?.orderNumber && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Order Number:</span>
              <span style={{ fontWeight: '600', color: '#333' }}>{paymentData.orderNumber}</span>
            </div>
          )}
          {paymentData?.amount && paymentData?.currency && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Amount Paid:</span>
              <span style={{ fontWeight: '600', color: '#333' }}>
                {paymentData.currency} {paymentData.amount.toFixed(2)}
              </span>
            </div>
          )}
          {paymentData?.transactionId && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Transaction ID:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#666' }}>
                {paymentData.transactionId.substring(0, 24)}...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Download Links */}
      {paymentData?.downloadLinks && paymentData.downloadLinks.length > 0 && (
        <div style={{ backgroundColor: '#EEF2FF', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '20px', fontWeight: '600' }}>
            Your Digital Products
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {paymentData.downloadLinks
              .filter(link => validateDownloadUrl(link.url) !== null)
              .map((link, index) => {
                const validatedUrl = validateDownloadUrl(link.url);
                if (!validatedUrl) return null;

                return (
                  <a
                    key={index}
                    href={validatedUrl}
                    download
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: '#333',
                      border: '1px solid #E5E7EB',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 91, 255, 0.15)';
                      e.currentTarget.style.borderColor = '#635BFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <span style={{ fontWeight: '500' }}>{link.productName || 'Download'}</span>
                    <span style={{ color: '#635BFF', fontWeight: '600' }}>Download →</span>
                  </a>
                );
              })}
          </div>
        </div>
      )}

      {/* Invoice Download */}
      {paymentData?.invoiceDownloadUrl && validateDownloadUrl(paymentData.invoiceDownloadUrl) && (
        <div style={{ marginBottom: '24px' }}>
          <a
            href={validateDownloadUrl(paymentData.invoiceDownloadUrl) || '#'}
            download
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 24px',
              backgroundColor: 'white',
              color: '#635BFF',
              border: '2px solid #635BFF',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#635BFF';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#635BFF';
            }}
          >
            📄 Download Invoice
          </a>
        </div>
      )}

      {/* Email Confirmation Notice */}
      <div style={{
        padding: '16px',
        backgroundColor: '#FEF3C7',
        borderRadius: '8px',
        marginBottom: '32px',
        border: '1px solid #FCD34D'
      }}>
        <p style={{ margin: 0, color: '#92400E', fontSize: '14px' }}>
          📧 A confirmation email with your download links has been sent to your email address.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/products')}
          style={{
            padding: '14px 32px',
            backgroundColor: '#635BFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5147EC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#635BFF';
          }}
        >
          Continue Shopping
        </button>
      </div>

      <style>{`
        @keyframes successPulse {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default StripeSuccess;
