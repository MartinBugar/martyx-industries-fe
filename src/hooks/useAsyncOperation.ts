import { useState, useCallback, useEffect, useRef } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOperationResult<T> extends AsyncState<T> {
  execute: () => Promise<void>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Custom hook for managing async operations with loading/error/data states.
 * Reduces boilerplate for common async patterns in admin pages.
 *
 * @param asyncFn - Async function to execute
 * @param options.immediate - Execute immediately on mount (default: true)
 * @param options.deps - Dependencies that trigger re-execution
 */
export function useAsyncOperation<T>(
  asyncFn: () => Promise<T>,
  options: {
    immediate?: boolean;
    deps?: React.DependencyList;
  } = {}
): UseAsyncOperationResult<T> {
  const { immediate = true, deps = [] } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await asyncFn();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
    } catch (e) {
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: e instanceof Error ? e.message : 'Operation failed',
        }));
      }
    }
  }, deps);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [immediate, ...deps]);

  return { ...state, execute, reset, setData };
}

interface MutationState {
  saving: boolean;
  error: string | null;
  success: boolean;
}

interface UseAsyncMutationResult<T, P> extends MutationState {
  mutate: (params: P) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for managing async mutations (save, create, update, delete).
 * Reduces boilerplate for form submissions and data modifications.
 *
 * @param mutationFn - Async function that performs the mutation
 * @param options.onSuccess - Callback on successful mutation
 * @param options.onError - Callback on error
 */
export function useAsyncMutation<T, P = void>(
  mutationFn: (params: P) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  } = {}
): UseAsyncMutationResult<T, P> {
  const { onSuccess, onError } = options;

  const [state, setState] = useState<MutationState>({
    saving: false,
    error: null,
    success: false,
  });

  const mutate = useCallback(
    async (params: P): Promise<T | null> => {
      setState({ saving: true, error: null, success: false });
      try {
        const result = await mutationFn(params);
        setState({ saving: false, error: null, success: true });
        onSuccess?.(result);
        return result;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Operation failed';
        setState({ saving: false, error: errorMsg, success: false });
        onError?.(errorMsg);
        return null;
      }
    },
    [mutationFn, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ saving: false, error: null, success: false });
  }, []);

  return { ...state, mutate, reset };
}
