/**
 * Debounce and Throttle utilities for performance optimization
 * Prevents excessive function calls on rapid events (scroll, resize, input, etc.)
 */

/**
 * Debounce function - delays execution until after wait period of inactivity
 * Perfect for: search inputs, window resize, form validation
 *
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per time period
 * Perfect for: scroll events, mouse movement, API polling
 *
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce with leading edge - executes immediately, then waits
 * Perfect for: button clicks that trigger API calls
 *
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const callNow = !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = null;
    }, wait);

    if (callNow) {
      func(...args);
    }
  };
}

/**
 * Create a debounced promise - useful for async operations
 *
 * @param func Async function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced async function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let resolveList: Array<(value: any) => void> = [];
  let rejectList: Array<(reason: any) => void> = [];

  return function executedFunction(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      resolveList.push(resolve);
      rejectList.push(reject);

      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolveList.forEach(r => r(result));
        } catch (error) {
          rejectList.forEach(r => r(error));
        } finally {
          resolveList = [];
          rejectList = [];
          timeout = null;
        }
      }, wait);
    });
  };
}
