import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
}

/**
 * Hook for showing confirmation dialogs.
 * Usage:
 * const { confirmDialog, confirm } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete User',
 *     message: 'Are you sure you want to delete this user?',
 *     variant: 'danger'
 *   });
 *   if (confirmed) {
 *     // Delete logic
 *   }
 * };
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
    onConfirm: () => {}
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        ...options,
        onConfirm: () => {
          setState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });

      // Store reject function for cancel
      const cancel = () => {
        setState(prev => ({ ...prev, isOpen: false }));
        resolve(false);
      };

      setState(prev => ({ ...prev, onCancel: cancel }));
    });
  }, []);

  const confirmDialog = {
    ...state,
    onCancel: () => setState(prev => ({ ...prev, isOpen: false }))
  };

  return { confirmDialog, confirm };
}
