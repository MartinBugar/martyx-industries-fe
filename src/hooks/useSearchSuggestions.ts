import { useState, useCallback, useRef, useEffect } from 'react';
import { searchProductSuggestions } from '../services/productService';
import type { ProductSearchSuggestion } from '../services/productService';

interface UseSearchSuggestionsOptions {
  debounceMs?: number;
  minChars?: number;
  maxResults?: number;
}

const RECENT_SEARCHES_KEY = 'martyx:recent-searches';
const MAX_RECENT_SEARCHES = 5;

interface UseSearchSuggestionsResult {
  query: string;
  setQuery: (query: string) => void;
  suggestions: ProductSearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  clearSuggestions: () => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => ProductSearchSuggestion | null;
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

// Helper functions for recent searches
function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]): void {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing search suggestions with debouncing and keyboard navigation
 */
export function useSearchSuggestions(
  options: UseSearchSuggestionsOptions = {}
): UseSearchSuggestionsResult {
  const {
    debounceMs = 300,
    minChars = 2,
    maxResults = 5,
  } = options;

  const [query, setQueryState] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());

  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < minChars) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      saveRecentSearches(updated);
      return updated;
    });
  }, [minChars]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    saveRecentSearches([]);
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minChars) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);

    try {
      // Pass abort signal to the API call
      const results = await searchProductSuggestions(searchQuery, maxResults, signal);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      // Ignore AbortError - this is expected when cancelling previous requests
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        setSuggestions([]);
      }
    } finally {
      // Only set loading to false if this request wasn't aborted
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [minChars, maxResults]);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);

    // Clear existing timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Debounce the search
    debounceTimerRef.current = window.setTimeout(() => {
      fetchSuggestions(newQuery);
    }, debounceMs);
  }, [debounceMs, fetchSuggestions]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): ProductSearchSuggestion | null => {
    if (!isOpen || suggestions.length === 0) {
      return null;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return null;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return null;

      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          const selected = suggestions[selectedIndex];
          clearSuggestions();
          return selected;
        }
        return null;

      case 'Escape':
        e.preventDefault();
        clearSuggestions();
        return null;

      default:
        return null;
    }
  }, [isOpen, suggestions, selectedIndex, clearSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    isOpen,
    setIsOpen,
    clearSuggestions,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}
