import React, { useState, useEffect } from 'react';
import { toast, Toast } from '../../utils/toast';
import './ToastContainer.css';

/**
 * Toast Container Component
 * Displays toast notifications in the top-right corner
 */
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toast.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => toast.remove(t.id)}
        >
          <div className="toast-icon">
            {t.type === 'success' && '✓'}
            {t.type === 'error' && '✕'}
            {t.type === 'info' && 'ℹ'}
            {t.type === 'warning' && '⚠'}
          </div>
          <div className="toast-message">{t.message}</div>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              toast.remove(t.id);
            }}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
