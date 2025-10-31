import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { stripeService, type CreateCheckoutSessionRequest, type CreateCheckoutSessionResponse } from '../services/stripeService';
import { translateApiError } from '../utils/translateApiError';

interface StripeCheckoutState {
  loading: boolean;
  error: string | null;
  sessionData: CreateCheckoutSessionResponse | null;
}

/**
 * Custom hook for Stripe Checkout integration
 * Handles session creation and error management
 */
export const useStripeCheckout = () => {
  const { t } = useTranslation('common');
  const [state, setState] = useState<StripeCheckoutState>({
    loading: false,
    error: null,
    sessionData: null,
  });

  const createCheckoutSession = useCallback(async (request: CreateCheckoutSessionRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('Creating Stripe Checkout Session:', request);

      const sessionResponse = await stripeService.createCheckoutSession(request);

      console.log('Stripe Checkout Session created:', sessionResponse);

      setState(prev => ({
        ...prev,
        loading: false,
        sessionData: sessionResponse,
      }));

      return sessionResponse;
    } catch (error) {
      console.error('Failed to create Stripe Checkout Session:', error);

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
      sessionData: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    createCheckoutSession,
    resetState,
    clearError,
    isSessionCreated: !!state.sessionData,
  };
};

export default useStripeCheckout;
