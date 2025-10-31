import React from 'react';
import { useNavigate } from 'react-router-dom';

const StripeCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-cancel-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
      {/* Cancel Icon */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '96px',
          height: '96px',
          margin: '0 auto',
          backgroundColor: '#FEE2E2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'cancelPulse 0.6s ease-out'
        }}>
          <span style={{ fontSize: '48px', color: '#DC2626' }}>✕</span>
        </div>
        <h1 style={{ marginTop: '24px', color: '#DC2626', fontSize: '32px', fontWeight: 'bold' }}>
          Payment Cancelled
        </h1>
        <p style={{ color: '#666', marginTop: '12px', fontSize: '18px' }}>
          Your payment was not completed
        </p>
      </div>

      {/* Information Box */}
      <div style={{
        backgroundColor: '#F9FAFB',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '20px', fontWeight: '600' }}>
          What happened?
        </h3>
        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '12px' }}>
          You cancelled the payment process or closed the checkout window. No charges were made to your account.
        </p>
        <p style={{ color: '#666', lineHeight: '1.6' }}>
          Your shopping cart has been preserved. You can complete your purchase at any time.
        </p>
      </div>

      {/* Helpful Information */}
      <div style={{
        padding: '16px',
        backgroundColor: '#EEF2FF',
        borderRadius: '8px',
        marginBottom: '32px',
        border: '1px solid #C7D2FE'
      }}>
        <p style={{ margin: 0, color: '#3730A3', fontSize: '14px', lineHeight: '1.5' }}>
          💡 <strong>Need help?</strong> If you encountered any issues during checkout or have questions about payment methods, please contact our support team.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/checkout')}
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
          Return to Checkout
        </button>
        <button
          onClick={() => navigate('/products')}
          style={{
            padding: '14px 32px',
            backgroundColor: 'white',
            color: '#635BFF',
            border: '2px solid #635BFF',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F9FAFB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          Continue Shopping
        </button>
      </div>

      <style>{`
        @keyframes cancelPulse {
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

export default StripeCancel;
