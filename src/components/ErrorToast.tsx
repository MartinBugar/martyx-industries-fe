import React from 'react';
import { useErrors } from '../context/ErrorContext';

/**
 * ErrorToast component
 * Displays error messages as toasts
 */
export const ErrorToast: React.FC = () => {
  const { errors, removeError } = useErrors();

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {errors.map(error => (
        <div
          key={error.id}
          className={`rounded-lg shadow-lg p-4 flex items-start justify-between ${
            error.severity === 'error'
              ? 'bg-red-50 border border-red-200'
              : error.severity === 'warning'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
          role="alert"
        >
          <div className="flex-1">
            <div className="flex items-center">
              {/* Icon */}
              <div className="flex-shrink-0">
                {error.severity === 'error' ? (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : error.severity === 'warning' ? (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Message */}
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    error.severity === 'error'
                      ? 'text-red-800'
                      : error.severity === 'warning'
                      ? 'text-yellow-800'
                      : 'text-blue-800'
                  }`}
                >
                  {error.message}
                </p>
                {error.correlationId && (
                  <p className="mt-1 text-xs text-gray-500">
                    Correlation ID: {error.correlationId}
                  </p>
                )}
              </div>
            </div>

            {/* Retry button for recoverable errors */}
            {error.recoverable && error.action && (
              <button
                onClick={() => {
                  error.action?.();
                  removeError(error.id);
                }}
                className={`mt-2 text-sm font-medium underline ${
                  error.severity === 'error'
                    ? 'text-red-700 hover:text-red-600'
                    : error.severity === 'warning'
                    ? 'text-yellow-700 hover:text-yellow-600'
                    : 'text-blue-700 hover:text-blue-600'
                }`}
              >
                Retry
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => removeError(error.id)}
            className={`ml-4 flex-shrink-0 inline-flex ${
              error.severity === 'error'
                ? 'text-red-400 hover:text-red-500'
                : error.severity === 'warning'
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-blue-400 hover:text-blue-500'
            }`}
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
