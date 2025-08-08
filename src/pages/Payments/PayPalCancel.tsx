import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';

const PayPalCancel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>('Cancelling payment…');

  useEffect(() => {
    const run = async () => {
      const paymentId = searchParams.get('paymentId');
      if (!paymentId) {
        setMessage('Payment cancellation requested, but no paymentId was provided.');
        return;
      }
      try {
        await paymentService.cancelPayPalPayment(paymentId);
        setMessage('Payment cancelled successfully.');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to cancel payment';
        setMessage(msg);
      }
    };
    run();
  }, [searchParams]);

  return (
    <div className="page-container">
      <h2>Payment Cancelled</h2>
      <p>{message}</p>
      <button onClick={() => navigate('/checkout')}>Back to Checkout</button>
    </div>
  );
};

export default PayPalCancel;


