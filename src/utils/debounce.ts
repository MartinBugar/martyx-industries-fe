/**
 * Debounce utility function
 * Delays function execution until after a specified wait time has elapsed
 * since the last time the function was invoked
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns The debounced function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  return function debounced(...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a debounced function with a leading edge option
 * If leading is true, func is invoked on the leading edge of the timeout
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param options - Options object with 'leading' flag
 * @returns The debounced function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounceLeading<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean } = {}
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;
  let lastCallTime: number = 0;

  return function debounced(...args: Parameters<T>): void {
    const now = Date.now();
    const isLeading = options.leading && now - lastCallTime > wait;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (isLeading) {
      func(...args);
      lastCallTime = now;
    }

    timeoutId = setTimeout(() => {
      if (!isLeading) {
        func(...args);
        lastCallTime = Date.now();
      }
      timeoutId = null;
    }, wait);
  };
}

export default debounce;
