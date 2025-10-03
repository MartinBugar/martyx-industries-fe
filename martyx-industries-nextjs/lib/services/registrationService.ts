// Registration service for Next.js
import { apiClient } from './api';

export interface RegistrationData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptTerms?: boolean;
  acceptMarketing?: boolean;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  userId?: string;
  requiresEmailVerification?: boolean;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

export const registrationService = {
  // Register new user
  register: async (userData: RegistrationData): Promise<RegistrationResponse> => {
    try {
      const data = await apiClient.post('/api/v1/auth/register', userData);
      return {
        success: true,
        message: data.message || 'Registration successful',
        userId: data.userId,
        requiresEmailVerification: data.requiresEmailVerification !== false
      };
    } catch (error: unknown) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      const err = error as Error & { status?: number; data?: { message?: string; code?: string } };
      if (err.status === 409 || err.data?.code === 'EMAIL_ALREADY_EXISTS') {
        return {
          success: false,
          message: 'This email address is already registered. Please use a different email or try logging in.'
        };
      }
      
      if (err.status === 400) {
        return {
          success: false,
          message: err.data?.message || 'Invalid registration data. Please check your information and try again.'
        };
      }
      
      return {
        success: false,
        message: err.data?.message || (error as Error)?.message || 'Registration failed. Please try again.'
      };
    }
  },

  // Verify email address
  verifyEmail: async (token: string): Promise<EmailVerificationResponse> => {
    try {
      const data = await apiClient.post('/api/v1/auth/verify-email', { token });
      return {
        success: true,
        message: data.message || 'Email verified successfully'
      };
    } catch (error: unknown) {
      console.error('Email verification error:', error);
      
      const err = error as Error & { status?: number; data?: { message?: string } };
      if (err.status === 400 || err.status === 404) {
        return {
          success: false,
          message: 'Invalid or expired verification token. Please request a new verification email.'
        };
      }
      
      return {
        success: false,
        message: err.data?.message || (error as Error)?.message || 'Email verification failed. Please try again.'
      };
    }
  },

  // Resend verification email
  resendVerificationEmail: async (email: string): Promise<EmailVerificationResponse> => {
    try {
      const data = await apiClient.post('/api/v1/auth/resend-verification', { email });
      return {
        success: true,
        message: data.message || 'Verification email sent successfully'
      };
    } catch (error: unknown) {
      console.error('Resend verification error:', error);
      
      const err = error as Error & { status?: number; data?: { message?: string } };
      if (err.status === 404) {
        return {
          success: false,
          message: 'Email address not found. Please check your email or register a new account.'
        };
      }
      
      if (err.status === 409) {
        return {
          success: false,
          message: 'Email address is already verified.'
        };
      }
      
      return {
        success: false,
        message: err.data?.message || (error as Error)?.message || 'Failed to send verification email. Please try again.'
      };
    }
  },

  // Check if email is available
  checkEmailAvailability: async (email: string): Promise<{ available: boolean; message?: string }> => {
    try {
      const data = await apiClient.get(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`);
      return {
        available: data.available !== false,
        message: data.message
      };
    } catch (error: unknown) {
      console.error('Email availability check error:', error);
      
      const err = error as Error & { status?: number; data?: { message?: string } };
      if (err.status === 409) {
        return {
          available: false,
          message: 'Email address is already registered'
        };
      }
      
      // If the endpoint doesn't exist or fails, assume email is available
      return {
        available: true
      };
    }
  },
};
