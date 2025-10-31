import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * Application error interface
 */
export interface AppError {
  id: string;
  code?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  correlationId?: string;
  recoverable: boolean;
  timestamp: number;
  action?: () => void; // Optional retry action
}

/**
 * Error context interface
 */
interface ErrorContextType {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

/**
 * ErrorProvider component
 * Provides global error state management
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<AppError[]>([]);

  /**
   * Add a new error to the queue
   */
  const addError = useCallback((error: Omit<AppError, 'id' | 'timestamp'>) => {
    const newError: AppError = {
      ...error,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setErrors(prev => [...prev, newError]);

    // Auto-dismiss non-critical errors after 5 seconds
    if (error.severity !== 'error') {
      setTimeout(() => {
        removeError(newError.id);
      }, 5000);
    }
  }, []);

  /**
   * Remove an error from the queue
   */
  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

/**
 * Hook to use error context
 */
export const useErrors = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrors must be used within an ErrorProvider');
  }
  return context;
};

/**
 * Helper function to create error from API response
 */
export const createErrorFromResponse = async (response: Response): Promise<Omit<AppError, 'id' | 'timestamp'>> => {
  try {
    const errorData = await response.json();
    return {
      code: errorData.code || `HTTP_${response.status}`,
      message: errorData.message || response.statusText || 'An error occurred',
      severity: response.status >= 500 ? 'error' : 'warning',
      correlationId: errorData.correlationId || response.headers.get('X-Correlation-ID') || undefined,
      recoverable: response.status < 500 && response.status !== 401 && response.status !== 403,
    };
  } catch {
    return {
      code: `HTTP_${response.status}`,
      message: response.statusText || 'An error occurred',
      severity: response.status >= 500 ? 'error' : 'warning',
      recoverable: response.status < 500 && response.status !== 401 && response.status !== 403,
    };
  }
};
