/**
 * Advanced Memoization Hooks
 * Optimized memoization with custom comparison functions
 */

import { useMemo, useRef, useState, useEffect, type DependencyList } from 'react';
import { logInfo, logWarn, logError } from '../services/logger';

// Deep comparison for objects
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
    }

    return true;
  }

  return false;
};

// Shallow comparison for arrays
const shallowEqual = (a: readonly unknown[], b: readonly unknown[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// Custom comparison hook
export const useCustomMemo = <T>(
  factory: () => T,
  deps: DependencyList,
  compareFn: (prev: readonly unknown[], next: readonly unknown[]) => boolean = deepEqual
): T => {
  const ref = useRef<{ deps: DependencyList; value: T } | undefined>(undefined);

  if (!ref.current || !compareFn(ref.current.deps as readonly unknown[], deps as readonly unknown[])) {
    ref.current = { deps, value: factory() };
  }

  return ref.current!.value;
};

// Shallow array comparison memo
export const useShallowArrayMemo = <T>(
  factory: () => T,
  deps: readonly unknown[]
): T => {
  return useCustomMemo(factory, deps, shallowEqual);
};

// Object property comparison memo
export const useObjectMemo = <T>(
  factory: () => T,
  obj: Record<string, unknown>,
  keys: string[]
): T => {
  const relevantDeps = useMemo(() =>
    keys.map(key => obj[key]),
    [obj, keys]
  );

  return useCustomMemo(factory, relevantDeps, shallowEqual);
};

// Stable callback with custom comparison
export const useStableCallback = <T extends (...args: never[]) => unknown>(
  callback: T,
  deps: DependencyList,
  compareFn: (prev: readonly unknown[], next: readonly unknown[]) => boolean = deepEqual
): T => {
  const ref = useRef<{ deps: DependencyList; callback: T } | undefined>(undefined);

  if (!ref.current || !compareFn(ref.current.deps as readonly unknown[], deps as readonly unknown[])) {
    ref.current = { deps, callback };
  }

  return ref.current!.callback;
};

// Memoized style object
export const useMemoizedStyle = (
  styleFactory: () => React.CSSProperties,
  deps: DependencyList
): React.CSSProperties => {
  return useCustomMemo(styleFactory, deps, deepEqual);
};

// Memoized className
export const useMemoizedClassName = (
  classNameFactory: () => string,
  deps: DependencyList
): string => {
  return useCustomMemo(classNameFactory, deps, shallowEqual);
};

// Debounced memo for expensive calculations
export const useDebouncedMemo = <T>(
  factory: () => T,
  deps: DependencyList,
  delay: number = 300
): T => {
  const [debouncedDeps, setDebouncedDeps] = useState(deps);
  const timeoutRef = useRef<number | undefined>(undefined);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      setDebouncedDeps(deps);
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps);
  
  return useMemo(factory, debouncedDeps);
};

// Conditional memo - only memoize when condition is true
export const useConditionalMemo = <T>(
  factory: () => T,
  deps: DependencyList,
  condition: boolean
): T => {
  if (condition) {
    return useMemo(factory, deps);
  }
  return factory();
};

// Performance monitoring memo
export const usePerformanceMemo = <T>(
  factory: () => T,
  deps: DependencyList,
  name: string = 'usePerformanceMemo'
): T => {
  return useMemo(() => {
    const start = performance.now();
    const result = factory();
    const end = performance.now();
    
    if (import.meta.env.DEV) {
      logInfo(`${name} took ${end - start}ms`);
    }
    
    return result;
  }, deps);
};
