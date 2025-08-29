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
export const translateApiError = (
  error: unknown,
  t: TFunction,
  args?: TranslationArgs
): string => {
  let errorData: ApiErrorResponse | null = null;
  
  if (error instanceof Error) {
    // Check if error has errorData attached (from handleResponse)
    if ((error as any).errorData) {
      errorData = (error as any).errorData;
    } else {
      // Fallback: try to parse error message as error code
      const errorCode = error.message || 'ERR_INTERNAL';
      errorData = {
        timestamp: new Date().toISOString(),
        path: '',
        errorCode,
        args: {}
      };
    }
  } else if (error && typeof error === 'object') {
    // Already parsed error object with unified contract
    errorData = error as ApiErrorResponse;
  } else if (typeof error === 'string') {
    // String error code
    errorData = {
      timestamp: new Date().toISOString(),
      path: '',
      errorCode: error,
      args: {}
    };
  }

  if (!errorData) {
    return t('errors.generic', args);
  }

  // Prepare translation arguments from error args and additional args
  const translationArgs: TranslationArgs = {
    ...errorData.args,
    ...args,
  };

  // Map errorCode to translation key using the API_ERROR_CODES mapping
  const translationKey = API_ERROR_CODES[errorData.errorCode as keyof typeof API_ERROR_CODES];
  
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

  // Fallback: try direct mapping errors.{errorCode}
  const directKey = `errors.${errorData.errorCode.toLowerCase()}`;
  const directTranslation = t(directKey, {
    defaultValue: '',
    ...translationArgs
  });
  
  if (directTranslation && directTranslation !== directKey) {
    return directTranslation;
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
