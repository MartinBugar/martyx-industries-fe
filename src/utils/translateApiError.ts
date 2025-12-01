import type { TFunction } from 'i18next';
import type { ApiErrorResponse } from '../types/api';
import { API_ERROR_CODES } from '../types/api';

/**
 * Arguments that can be passed to translation functions
 */
export interface TranslationArgs {
  [key: string]: string | number | Date;
}

/**
 * Translates API error responses to user-friendly messages using i18next
 * Works with the unified error contract from backend
 * 
 * @param error - The error object, can be Error with errorData, Response, or parsed error data
 * @param t - The translation function from useTranslation
 * @param args - Optional arguments to pass to the translation function
 * @returns A translated error message
 */
interface ErrorWithData extends Error {
  errorData?: ApiErrorResponse;
}

function isErrorWithData(error: unknown): error is ErrorWithData {
  return error instanceof Error && 'errorData' in error;
}

export const translateApiError = (
  error: unknown,
  t: TFunction,
  args?: TranslationArgs
): string => {
  let errorCode: string = 'ERR_INTERNAL';
  let errorArgs: Record<string, unknown> = {};

  if (isErrorWithData(error)) {
    // Check if error has errorData attached (from handleResponse)
    if (error.errorData) {
      // Backend returns 'code' (new) or 'errorCode' (legacy)
      errorCode = error.errorData.code || error.errorData.errorCode || error.message || 'ERR_INTERNAL';
      errorArgs = error.errorData.args || {};
    } else {
      // Fallback: use error message as error code
      errorCode = error.message || 'ERR_INTERNAL';
    }
  } else if (error && typeof error === 'object') {
    // Already parsed error object
    const errorObj = error as Record<string, unknown>;
    errorCode = (errorObj.code || errorObj.errorCode || 'ERR_INTERNAL') as string;
    errorArgs = (errorObj.args || {}) as Record<string, unknown>;
  } else if (typeof error === 'string') {
    // String error code
    errorCode = error;
  }

  // Prepare translation arguments - filter out non-primitive values
  const translationArgs: TranslationArgs = {};

  // Copy errorArgs, filtering to only valid translation types
  for (const [key, value] of Object.entries(errorArgs)) {
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
      translationArgs[key] = value;
    }
  }

  // Merge with explicit args (these take precedence)
  if (args) {
    Object.assign(translationArgs, args);
  }

  // Try to find translation using API_ERROR_CODES mapping
  const translationKey = API_ERROR_CODES[errorCode as keyof typeof API_ERROR_CODES];

  if (translationKey) {
    const translatedMessage = t(translationKey, {
      defaultValue: '',
      ...translationArgs
    });

    // If translation exists and is not empty, use it
    if (translatedMessage && translatedMessage !== translationKey) {
      return translatedMessage;
    }
  }

  // Fallback: try direct mapping errors.{errorCode} (lowercase)
  const directKey = `errors.${errorCode.toLowerCase()}`;
  const directTranslation = t(directKey, {
    defaultValue: '',
    ...translationArgs
  });

  if (directTranslation && directTranslation !== directKey) {
    return directTranslation;
  }

  // Fallback: try nested path like errors.cart.out_of_stock for CART_003
  // Convert CART_003 -> errors.cart.out_of_stock pattern
  const parts = errorCode.split('_');
  if (parts.length >= 2) {
    const category = parts[0].toLowerCase();
    // Try the mapped key from API_ERROR_CODES
    const mappedKey = API_ERROR_CODES[errorCode as keyof typeof API_ERROR_CODES];
    if (mappedKey) {
      const nestedTranslation = t(mappedKey, {
        defaultValue: '',
        ...translationArgs
      });
      if (nestedTranslation && nestedTranslation !== mappedKey) {
        return nestedTranslation;
      }
    }
  }

  // Ultimate fallback to generic error message
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
        timestamp: new Date().toISOString(),
        path: error.url,
        errorCode: errorData.errorCode || 'ERR_INTERNAL',
        args: errorData.args || {},
        ...errorData,
      };
    } catch {
      return {
        timestamp: new Date().toISOString(),
        path: error.url,
        errorCode: 'ERR_INTERNAL',
        args: {},
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
        timestamp: new Date().toISOString(),
        path: '',
        errorCode: 'ERR_INTERNAL',
        args: {},
      };
    }
  }

  if (error && typeof error === 'object') {
    return error as ApiErrorResponse;
  }

  if (typeof error === 'string') {
    return {
      timestamp: new Date().toISOString(),
      path: '',
      errorCode: error,
      args: {},
    };
  }

  return {
    timestamp: new Date().toISOString(),
    path: '',
    errorCode: 'ERR_INTERNAL',
    args: {},
  };
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
