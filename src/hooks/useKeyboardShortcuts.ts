import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logInfo } from '../services/logger';

interface KeyboardShortcutHandlers {
  onSearch?: () => void;
  onEscape?: () => void;
}

/**
 * Global keyboard shortcuts hook
 *
 * Shortcuts:
 * - Cmd/Ctrl + K: Open search (calls onSearch callback)
 * - Escape: Close modals/overlays (calls onEscape callback)
 * - Cmd/Ctrl + /: Show help (navigates to help page or shows shortcuts)
 *
 * @example
 * useKeyboardShortcuts({
 *   onSearch: () => setSearchOpen(true),
 *   onEscape: () => setModalOpen(false)
 * });
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers = {}) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, metaKey, ctrlKey, target } = event;
    const isModifierPressed = metaKey || ctrlKey;

    // Ignore shortcuts when typing in input fields
    const targetElement = target as HTMLElement;
    const isInputField = targetElement.tagName === 'INPUT' ||
                         targetElement.tagName === 'TEXTAREA' ||
                         targetElement.isContentEditable;

    // Cmd/Ctrl + K: Open search
    if (isModifierPressed && key.toLowerCase() === 'k') {
      event.preventDefault();
      if (handlers.onSearch) {
        handlers.onSearch();
        logInfo('[Keyboard] Search shortcut triggered');
      }
      return;
    }

    // Escape: Close modal/overlay (works even in input fields)
    if (key === 'Escape') {
      if (handlers.onEscape) {
        handlers.onEscape();
        logInfo('[Keyboard] Escape shortcut triggered');
      }
      return;
    }

    // Skip other shortcuts if in input field
    if (isInputField) return;

    // Cmd/Ctrl + /: Navigate to help/shortcuts
    if (isModifierPressed && key === '/') {
      event.preventDefault();
      navigate('/help');
      logInfo('[Keyboard] Help shortcut triggered');
      return;
    }
  }, [handlers, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Escape key only hook - for use in modals/overlays
 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, enabled]);
}

export default useKeyboardShortcuts;
