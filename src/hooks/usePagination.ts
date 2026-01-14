import { useState, useCallback } from 'react';

interface PaginationState {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

interface UsePaginationResult extends PaginationState {
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setTotalPages: (total: number) => void;
  setTotalElements: (total: number) => void;
  updateFromResponse: (response: { totalPages: number; totalElements: number }) => void;
  resetPagination: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Custom hook for managing pagination state.
 * Consolidates page, totalPages, totalElements state management.
 *
 * @param options.initialPage - Initial page (default: 0)
 * @param options.pageSize - Items per page (default: 20)
 */
export function usePagination(
  options: {
    initialPage?: number;
    pageSize?: number;
  } = {}
): UsePaginationResult {
  const { initialPage = 0, pageSize = 20 } = options;

  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    totalPages: 1,
    totalElements: 0,
    pageSize,
  });

  const setPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      page: Math.max(0, Math.min(page, prev.totalPages - 1)),
    }));
  }, []);

  const nextPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.min(prev.page + 1, prev.totalPages - 1),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.max(prev.page - 1, 0),
    }));
  }, []);

  const setTotalPages = useCallback((totalPages: number) => {
    setState((prev) => ({ ...prev, totalPages }));
  }, []);

  const setTotalElements = useCallback((totalElements: number) => {
    setState((prev) => ({ ...prev, totalElements }));
  }, []);

  const updateFromResponse = useCallback(
    (response: { totalPages: number; totalElements: number }) => {
      setState((prev) => ({
        ...prev,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      }));
    },
    []
  );

  const resetPagination = useCallback(() => {
    setState({
      page: initialPage,
      totalPages: 1,
      totalElements: 0,
      pageSize,
    });
  }, [initialPage, pageSize]);

  return {
    ...state,
    setPage,
    nextPage,
    prevPage,
    setTotalPages,
    setTotalElements,
    updateFromResponse,
    resetPagination,
    hasNextPage: state.page < state.totalPages - 1,
    hasPrevPage: state.page > 0,
  };
}
