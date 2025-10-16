import React from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * Confirmation dialog for destructive admin actions.
 * Replaces browser's window.confirm() with better UX.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning'
}) => {
  if (!isOpen) return null;

  const variantColors = {
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <div className="confirm-dialog-icon" style={{ backgroundColor: `${variantColors[variant]}20`, color: variantColors[variant] }}>
            {variant === 'danger' && '⚠️'}
            {variant === 'warning' && '⚠️'}
            {variant === 'info' && 'ℹ️'}
          </div>
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button
            className="confirm-dialog-button confirm-dialog-button-cancel"
            onClick={onCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            className="confirm-dialog-button confirm-dialog-button-confirm"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            style={{ backgroundColor: variantColors[variant] }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
