// Registration service
import { handleResponse, API_BASE_URL, defaultHeaders } from './apiUtils';

// Registration service
export const registrationService = {
  // Register a new user
    register: async (email: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: defaultHeaders as HeadersInit,
                body: JSON.stringify({ email, password }),
            });

            // Handle success
            if (response.ok) {
                // Consume response body if available to keep consistent behavior
                try { await response.json(); } catch { /* ignore JSON errors on success */ }
                return true;
            }

            // Attempt to read error message from body
            let message = 'An error occurred';
            try {
                const data = await response.json();
                if (data && typeof data.message === 'string') {
                    message = data.message;
                }
            } catch {
                // ignore JSON parse errors
            }

            // Detect duplicate email by HTTP status or response message
            if (response.status === 409 || /(already\s*(in)?\s*use|already.*(exist|registered))/i.test(message)) {
                const err = new Error(message || 'Email is already in use') as Error & { code?: string };
                err.code = 'EMAIL_ALREADY_REGISTERED';
                throw err;
            }

            throw new Error(message);
        } catch (error) {
            console.error('Registration API error:', error);
            throw error;
        }
  },

  // Confirm email with token
  confirmEmail: async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/confirm?token=${token}`, {
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      });
      
      const data = await handleResponse(response);
      return { success: true, message: data.message || 'Email confirmed successfully!' };
    } catch (error) {
      console.error('Email confirmation API error:', error);
      return { success: false, message: 'Email confirmation failed. Please try again or contact support.' };
    }
  },

  // Resend confirmation email
  resendConfirmation: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-confirmation`, {
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify({ email }),
      });
      
      const data = await handleResponse(response);
      return { success: true, message: data.message || 'Confirmation email sent successfully!' };
    } catch (error) {
      console.error('Resend confirmation API error:', error);
      return { success: false, message: 'Failed to resend confirmation email. Please try again.' };
    }
  },
};