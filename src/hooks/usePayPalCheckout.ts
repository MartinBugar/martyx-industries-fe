import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { paypalService } from '../services/paypalService';
import { translateApiError } from '../utils/translateApiError';
import type { CreateOrderResponse, PaymentDTO } from '../types/api';

interface CartItem {
  id: number;
  quantity: number;
  price: number;
  currency?: string;
}

interface PayPalCheckoutState {
  loading: boolean;
  error: string | null;
  orderData: CreateOrderResponse | null;
  paymentResult: PaymentDTO | null;
}

/**
 * Custom hook for PayPal checkout integration with new API contract
 * Demonstrates error handling with unified error translation
 */
export const usePayPalCheckout = () => {
  const { t } = useTranslation('common');
  const [state, setState] = useState<PayPalCheckoutState>({
    loading: false,
    error: null,
    orderData: null,
    paymentResult: null,
  });

  const createOrder = useCallback(async (
    cartItems: CartItem[],
    userEmail: string,
    currency: string = 'EUR'
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const paymentRequest = paypalService.createPaymentRequest(
        cartItems,
        userEmail,
        currency
      );

      console.log('📦 Creating PayPal order:', paymentRequest);

      const orderResponse = await paypalService.createOrder(paymentRequest);
      
      console.log('✅ PayPal order created:', orderResponse);

      setState(prev => ({
        ...prev,
        loading: false,
        orderData: orderResponse,
      }));

      return orderResponse;
    } catch (error) {
      console.error('❌ Failed to create PayPal order:', error);
      
      const errorMessage = translateApiError(error, t);
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      throw error;
    }
  }, [t]);

  const captureOrder = useCallback(async (paypalOrderId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('💳 Capturing PayPal order:', paypalOrderId);

      const paymentResult = await paypalService.captureOrder({
        orderId: paypalOrderId
      });

      console.log('✅ PayPal order captured:', paymentResult);

      setState(prev => ({
        ...prev,
        loading: false,
        paymentResult,
      }));

      return paymentResult;
    } catch (error) {
      console.error('❌ Failed to capture PayPal order:', error);
      
      const errorMessage = translateApiError(error, t);
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      throw error;
    }
  }, [t]);

  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      orderData: null,
      paymentResult: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    createOrder,
    captureOrder,
    resetState,
    clearError,
    // Helper methods
    isSuccess: !!state.paymentResult && state.paymentResult.status === 'COMPLETED',
    isOrderCreated: !!state.orderData,
  };
};

export default usePayPalCheckout;
