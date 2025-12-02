import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import './ConfirmDialog.css';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Title of the dialog */
  title: string;
  /** Message to display in the dialog body */
  message: string | React.ReactNode;
  /** Text for confirm button */
  confirmText?: string;
  /** Text for cancel button */
  cancelText?: string;
  /** Variant affects styling and icon */
  variant?: 'danger' | 'warning' | 'info';
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels or closes dialog */
  onCancel: () => void;
  /** Whether confirm button is loading */
  isLoading?: boolean;
  /** Whether to show close button */
  showCloseButton?: boolean;
}

/**
 * Accessible confirmation dialog component.
 * Replaces window.confirm() with a keyboard-accessible modal.
 *
 * Features:
 * - Focus trap within dialog
 * - Escape key to close
 * - Click outside to close
 * - Screen reader announcements
 * - Keyboard navigation
 *
 * @example
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 *
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   variant="danger"
 *   onConfirm={() => { deleteItem(); setShowConfirm(false); }}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
  isLoading = false,
  showCloseButton = true,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Store previously focused element
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      // Small delay to ensure dialog is rendered
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 10);
    }

    // Return focus when closing
    return () => {
      if (!isOpen && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusableElements = dialogRef.current?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, []);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel();
    }
  }, [isLoading, onCancel]);

  // Get icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertCircle className="confirm-dialog-icon danger" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="confirm-dialog-icon warning" aria-hidden="true" />;
      case 'info':
        return <Info className="confirm-dialog-icon info" aria-hidden="true" />;
      default:
        return <AlertTriangle className="confirm-dialog-icon warning" aria-hidden="true" />;
    }
  };

  if (!isOpen) return null;

  const dialogContent = (
    <div
      className="confirm-dialog-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`confirm-dialog ${variant}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onKeyDown={handleKeyDown}
      >
        {showCloseButton && (
          <button
            type="button"
            className="confirm-dialog-close"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}

        <div className="confirm-dialog-content">
          {getIcon()}
          <div className="confirm-dialog-text">
            <h2 id="confirm-dialog-title" className="confirm-dialog-title">
              {title}
            </h2>
            <div id="confirm-dialog-message" className="confirm-dialog-message">
              {message}
            </div>
          </div>
        </div>

        <div className="confirm-dialog-actions">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            type="button"
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Loading...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  // Render in portal to ensure proper stacking
  return createPortal(dialogContent, document.body);
};

// =====================================================================
// Hook for easier usage
// =====================================================================

export interface UseConfirmDialogOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface UseConfirmDialogReturn {
  /** Open the confirm dialog */
  confirm: (options?: UseConfirmDialogOptions) => Promise<boolean>;
  /** ConfirmDialog component props to spread */
  dialogProps: ConfirmDialogProps;
  /** Current loading state */
  isLoading: boolean;
  /** Set loading state */
  setIsLoading: (loading: boolean) => void;
}

/**
 * Hook for using ConfirmDialog with promise-based API.
 *
 * @example
 * ```tsx
 * const { confirm, dialogProps } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure?',
 *     variant: 'danger'
 *   });
 *   if (confirmed) {
 *     await deleteItem();
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog {...dialogProps} />
 *   </>
 * );
 * ```
 */
export const useConfirmDialog = (
  defaultOptions: UseConfirmDialogOptions = {}
): UseConfirmDialogReturn => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [options, setOptions] = React.useState<UseConfirmDialogOptions>(defaultOptions);
  const resolveRef = React.useRef<(value: boolean) => void>(undefined);

  const confirm = useCallback((overrideOptions?: UseConfirmDialogOptions): Promise<boolean> => {
    setOptions({ ...defaultOptions, ...overrideOptions });
    setIsOpen(true);
    setIsLoading(false);

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, [defaultOptions]);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setIsOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setIsOpen(false);
  }, []);

  const dialogProps: ConfirmDialogProps = {
    isOpen,
    title: options.title || 'Confirm',
    message: options.message || 'Are you sure?',
    confirmText: options.confirmText,
    cancelText: options.cancelText,
    variant: options.variant,
    isLoading,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  return {
    confirm,
    dialogProps,
    isLoading,
    setIsLoading,
  };
};

export default ConfirmDialog;
