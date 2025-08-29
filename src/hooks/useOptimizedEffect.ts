/**
 * Optimized useEffect hook with better dependency management
 * Prevents unnecessary re-renders and provides better performance
 */

import { useEffect, useCallback, useRef, DependencyList } from 'react';

/**
 * useStableCallback - Creates a stable callback reference that doesn't change on every render
 */
export const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  const callbackRef = useRef<T>(callback);
  
  // Update the ref if callback changes
  callbackRef.current = callback;
  
  // Return a stable callback that calls the current callback
  return useCallback(((...args: any[]) => {
    return callbackRef.current(...args);
  }) as T, []);
};

/**
 * useDebouncedEffect - Debounced useEffect to prevent excessive API calls
 */
export const useDebouncedEffect = (
  callback: () => void | (() => void),
  deps: DependencyList,
  delay: number = 300
) => {
  useEffect(() => {
    const handler = setTimeout(() => {
      const cleanup = callback();
      return cleanup;
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [...deps, delay]);
};

/**
 * useAsyncEffect - Better async effect handling
 */
export const useAsyncEffect = (
  effect: () => Promise<void | (() => void)>,
  deps: DependencyList
) => {
  useEffect(() => {
    let cleanup: (() => void) | void;
    let cancelled = false;

    const runEffect = async () => {
      try {
        cleanup = await effect();
      } catch (error) {
        if (!cancelled) {
          console.error('Async effect error:', error);
        }
      }
    };

    runEffect();

    return () => {
      cancelled = true;
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
};

/**
 * useEffectOnce - Effect that runs only once
 */
export const useEffectOnce = (effect: () => void | (() => void)) => {
  useEffect(effect, []);
};
