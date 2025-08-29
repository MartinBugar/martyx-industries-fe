import type { TFunction } from 'i18next';

/**
 * API Error structure expected from the backend
 */
export interface ApiErrorResponse {
  message?: string;
  errorCode?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Arguments that can be passed to translation functions
 */
export interface TranslationArgs {
  [key: string]: string | number | Date;
}

/**
 * Translates API error responses to user-friendly messages using i18next
 * 
 * @param error - The error object, can be Error, Response, or parsed error data
 * @param t - The translation function from useTranslation
 * @param args - Optional arguments to pass to the translation function
 * @returns A translated error message
 */
export const translateApiError = (
  error: unknown,
  t: TFunction,
  args?: TranslationArgs
): string => {
  // Handle different types of error input
  let errorData: ApiErrorResponse = {};
  
  if (error instanceof Error) {
    // Standard JavaScript Error
    try {
      // Try to parse error message as JSON (in case it contains API error data)
      errorData = JSON.parse(error.message);
    } catch {
      // If not JSON, use the message directly
      errorData = { message: error.message };
    }
  } else if (error && typeof error === 'object') {
    // Already parsed error object
    errorData = error as ApiErrorResponse;
  } else if (typeof error === 'string') {
    // String error message
    errorData = { message: error };
  }

  // Extract error code and details
  const { errorCode, message, details, ...otherProps } = errorData;

  // Prepare translation arguments
  const translationArgs: TranslationArgs = {
    ...args,
    ...(details as TranslationArgs),
    ...(otherProps as TranslationArgs),
  };

  // Map specific error codes to translation keys
  if (errorCode) {
    const errorKey = `errors.${errorCode}`;
    
    // Check if translation exists for this error code
    const translatedMessage = t(errorKey, { 
      defaultValue: '', 
      ...translationArgs 
    });
    
    // If translation exists and is not empty, use it
    if (translatedMessage && translatedMessage !== errorKey) {
      return translatedMessage;
    }
  }

  // Map common HTTP status-based errors
  if (message) {
    const lowerMessage = message.toLowerCase();
    
    // Common error patterns
    const errorMappings: Record<string, string> = {
      'unauthorized': 'errors.unauthorized',
      'forbidden': 'errors.unauthorized',
      'not found': 'errors.order_not_found',
      'validation': 'errors.validation',
      'invalid credentials': 'errors.invalid_credentials',
      'email already exists': 'errors.email_already_exists',
      'weak password': 'errors.weak_password',
      'session expired': 'errors.session_expired',
      'payment failed': 'errors.payment_failed',
      'insufficient stock': 'errors.insufficient_stock',
      'network error': 'errors.network',
      'server error': 'errors.server_error',
      'internal server error': 'errors.server_error',
    };

    // Find matching error pattern
    for (const [pattern, key] of Object.entries(errorMappings)) {
      if (lowerMessage.includes(pattern)) {
        const translatedMessage = t(key, {
          defaultValue: '',
          ...translationArgs
        });
        
        if (translatedMessage && translatedMessage !== key) {
          return translatedMessage;
        }
        break;
      }
    }

    // If no pattern matches, try to use the message directly
    return message;
  }

  // Fallback to generic error message
  return t('errors.generic', translationArgs);
};

/**
 * Simplified version for common use cases where you just need to translate an error code
 * 
 * @param errorCode - The error code from the API
 * @param t - The translation function from useTranslation
 * @param args - Optional arguments to pass to the translation function
 * @returns A translated error message
 */
export const translateErrorCode = (
  errorCode: string,
  t: TFunction,
  args?: TranslationArgs
): string => {
  const errorKey = `errors.${errorCode}`;
  const translatedMessage = t(errorKey, {
    defaultValue: t('errors.generic'),
    ...args
  });
  
  return translatedMessage;
};

/**
 * Utility to extract error information from various error sources
 * Useful for consistent error handling across the application
 * 
 * @param error - The error from API call, can be fetch Response, Error, or parsed data
 * @returns Normalized error information
 */
export const extractErrorInfo = async (error: unknown): Promise<ApiErrorResponse> => {
  if (error instanceof Response) {
    // Handle fetch Response objects
    try {
      const errorData = await error.json();
      return {
        ...errorData,
        statusCode: error.status,
        statusText: error.statusText,
      };
    } catch {
      return {
        message: error.statusText || 'Network error',
        statusCode: error.status,
      };
    }
  }

  if (error instanceof Error) {
    try {
      // Try to parse error message as JSON
      const parsed = JSON.parse(error.message);
      return parsed;
    } catch {
      return {
        message: error.message,
        name: error.name,
      };
    }
  }

  if (error && typeof error === 'object') {
    return error as ApiErrorResponse;
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: 'Unknown error occurred' };
};

/**
 * Hook-like helper for handling errors in components
 * Returns a function that can be used to handle and translate errors
 * 
 * @param t - The translation function from useTranslation
 * @param onError - Optional callback to handle the translated error (e.g., show toast)
 * @returns A function to handle errors
 */
export const createErrorHandler = (
  t: TFunction,
  onError?: (message: string) => void
) => {
  return async (error: unknown, args?: TranslationArgs) => {
    const errorInfo = await extractErrorInfo(error);
    const translatedMessage = translateApiError(errorInfo, t, args);
    
    if (onError) {
      onError(translatedMessage);
    }
    
    return translatedMessage;
  };
};

// Export types for better TypeScript support
export type { TFunction } from 'i18next';
