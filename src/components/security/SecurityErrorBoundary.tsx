/**
 * Error Boundary pre bezpečnostné chyby
 * Zachytáva a bezpečne spracováva chyby bez odhalenia citlivých informácií
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import './SecurityErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
}

class SecurityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generovanie bezpečného error ID
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log chyby do konzoly (v produkcii by sa malo posielať na server)
    console.error('Security Error Boundary caught an error:', {
      errorId,
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    return {
      hasError: true,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Detailné logovanie pre development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', error);
      console.error('Error info:', errorInfo);
    }
    
    // V produkcii by sa chyba mala poslať na monitoring service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Implementácia posielania chýb na monitoring service
    // Napríklad Sentry, LogRocket, atď.
    if (process.env.NODE_ENV === 'production') {
      try {
        // Bezpečné logovanie bez citlivých údajov
        const safeError = {
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 10).join('\n'), // Obmedzenie stack trace
          componentStack: errorInfo.componentStack?.split('\n').slice(0, 5).join('\n'),
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        
        // Poslanie na monitoring endpoint
        // fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(safeError)
        // });
      } catch (logError) {
        console.error('Failed to log error to service:', logError);
      }
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, errorId: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Vlastný fallback UI alebo default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="security-error-boundary">
          <div className="error-content">
            <div className="error-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M12 9v3.75m0 1.5V15M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            <h2>Nastala neočakávaná chyba</h2>
            <p>
              Ospravedlňujeme sa za nepríjemnosti. Chyba bola automaticky nahlásená 
              a náš tím pracuje na jej riešení.
            </p>
            
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="btn btn-primary"
                type="button"
              >
                Skúsiť znovu
              </button>
              <button 
                onClick={this.handleReload}
                className="btn btn-secondary"
                type="button"
              >
                Obnoviť stránku
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.errorId && (
              <div className="error-debug">
                <p>Error ID: {this.state.errorId}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SecurityErrorBoundary;
