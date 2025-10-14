import React, { Component, ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <AlertTriangle className="error-boundary-icon" size={48} />
            <h2 className="error-boundary-title">Niečo sa pokazilo</h2>
            <p className="error-boundary-message">
              Vyskytla sa neočakávaná chyba. Skúste obnoviť stránku alebo sa vráťte späť.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary-details">
                <summary>Podrobnosti o chybe</summary>
                <pre className="error-boundary-stack">
                  <strong>Chyba:</strong> {this.state.error.toString()}
                  {'\n\n'}
                  <strong>Stack trace:</strong>
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button onClick={this.handleReset} className="error-boundary-button">
                <RefreshCcw size={16} />
                Skúsiť znova
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="error-boundary-button error-boundary-button-secondary"
              >
                Späť na hlavnú stránku
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  message?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  message = 'Vyskytla sa chyba pri načítavaní obsahu.',
}) => {
  return (
    <div className="error-fallback">
      <AlertTriangle className="error-fallback-icon" size={32} />
      <h3 className="error-fallback-title">Chyba</h3>
      <p className="error-fallback-message">{message}</p>
      {error && import.meta.env.DEV && (
        <pre className="error-fallback-error">{error.toString()}</pre>
      )}
      {resetError && (
        <button onClick={resetError} className="error-fallback-button">
          <RefreshCcw size={16} />
          Skúsiť znova
        </button>
      )}
    </div>
  );
};
