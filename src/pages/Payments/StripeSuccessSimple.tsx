import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Simplified Stripe Success page for debugging
 */
const StripeSuccessSimple: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [debug, setDebug] = useState<string>('Initializing...');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    setDebug(`Session ID: ${sessionId || 'MISSING'}`);

    if (!sessionId) {
      setDebug('ERROR: No session_id parameter found in URL');
      return;
    }

    // Test API call
    setDebug('Fetching payment details...');
    fetch(`http://localhost:8080/api/stripe/payment-details?session_id=${sessionId}`)
      .then(response => {
        setDebug(`Response status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        setDebug(`Success! Data: ${JSON.stringify(data, null, 2)}`);
      })
      .catch(error => {
        setDebug(`ERROR: ${error.message}`);
      });
  }, [sessionId]);

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#059669' }}>✓ Payment Successful (Debug Mode)</h1>

      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        fontSize: '14px'
      }}>
        {debug}
      </div>

      <button
        onClick={() => navigate('/products')}
        style={{
          marginTop: '32px',
          padding: '14px 32px',
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
};

export default StripeSuccessSimple;
