import { Component, type ErrorInfo, type ReactNode } from 'react';
import './ErrorBoundary.css';
import { logInfo, logWarn, logError } from '../../services/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * Usage:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <BuildInfoTab content={content} />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.DEV) {
      logError('ErrorBoundary caught an error:', error);
      logError('Component stack:', errorInfo.componentStack);
    }

    // Call optional error handler (e.g., for logging to Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Log to error reporting service in production
    // logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-icon">⚠️</div>
          <h2 className="error-boundary-title">Niečo sa pokazilo</h2>
          <p className="error-boundary-message">
            Ospravedlňujeme sa, ale nastala chyba pri zobrazovaní tohto obsahu.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details className="error-boundary-details">
              <summary>Technické detaily (Development Mode)</summary>
              <pre className="error-boundary-stack">
                {this.state.error.toString()}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            className="error-boundary-reset-btn"
          >
            Skúsiť znova
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
