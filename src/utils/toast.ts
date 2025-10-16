/**
 * Simple, dependency-free Toast Notification System
 * Provides user feedback for actions throughout the application
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

class ToastManager {
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private toasts: Toast[] = [];

  /**
   * Subscribe to toast updates
   */
  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of toast changes
   */
  private notify(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  /**
   * Show a toast notification
   */
  show(type: ToastType, message: string, duration = 3000): void {
    const toast: Toast = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      duration
    };

    this.toasts.push(toast);
    this.notify();

    if (duration > 0) {
      setTimeout(() => this.remove(toast.id), duration);
    }
  }

  /**
   * Remove a toast by ID
   */
  remove(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toasts = [];
    this.notify();
  }

  // Convenience methods
  success(message: string, duration?: number): void {
    this.show('success', message, duration);
  }

  error(message: string, duration?: number): void {
    this.show('error', message, duration);
  }

  info(message: string, duration?: number): void {
    this.show('info', message, duration);
  }

  warning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }
}

// Export singleton instance
export const toast = new ToastManager();
