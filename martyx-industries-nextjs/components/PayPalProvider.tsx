'use client';

import React from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

interface PayPalProviderProps {
  children: React.ReactNode;
}

// PayPal configuration - memoized to prevent recreation
const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "Ae8bJdL8EaBJQtmDskm-esvEkUNfollfToURcmnNN4XCTl2j48YGAUQNUkUs6zthKZRndlKwSESyvFnh",
  currency: "EUR",
  intent: "capture"
} as const;

const PayPalProvider: React.FC<PayPalProviderProps> = ({ children }) => {
  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  );
};

export default PayPalProvider;
