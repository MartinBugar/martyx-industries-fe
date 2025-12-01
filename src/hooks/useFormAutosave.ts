import { useEffect, useCallback, useRef, useState } from 'react';
import { logInfo, logWarn } from '../services/logger';

interface UseFormAutosaveOptions<T> {
  /** Unique key for localStorage */
  storageKey: string;
  /** Current form data to save */
  data: T;
  /** Debounce delay in milliseconds (default: 1000ms) */
  debounceMs?: number;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
  /** Fields to exclude from saving (e.g., passwords) */
  excludeFields?: (keyof T)[];
  /** Maximum age in hours before data is considered stale (default: 24h) */
  maxAgeHours?: number;
}

interface SavedFormData<T> {
  data: T;
  timestamp: number;
  version: number;
}

const CURRENT_VERSION = 1;

/**
 * Custom hook for auto-saving form data to localStorage
 *
 * Features:
 * - Debounced saves to prevent excessive writes
 * - Automatic expiration of stale data
 * - Field exclusion for sensitive data
 * - Version control for schema migrations
 *
 * @example
 * const { savedData, clearSavedData, hasSavedData } = useFormAutosave({
 *   storageKey: 'checkout-form',
 *   data: formValues,
 *   excludeFields: ['cardNumber', 'cvv']
 * });
 */
export function useFormAutosave<T extends Record<string, unknown>>({
  storageKey,
  data,
  debounceMs = 1000,
  enabled = true,
  excludeFields = [],
  maxAgeHours = 24
}: UseFormAutosaveOptions<T>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  // State for saved data - loaded once on mount
  const [savedData, setSavedData] = useState<Partial<T> | null>(null);
  const isInitializedRef = useRef(false);

  // Filter out excluded fields before saving
  const filterData = useCallback((formData: T): Partial<T> => {
    const filtered = { ...formData };
    for (const field of excludeFields) {
      delete filtered[field];
    }
    return filtered;
  }, [excludeFields]);

  // Save data to localStorage
  const saveData = useCallback((formData: T) => {
    if (!enabled) return;

    try {
      const filteredData = filterData(formData);
      const dataString = JSON.stringify(filteredData);

      // Skip if data hasn't changed
      if (dataString === lastSavedRef.current) {
        return;
      }

      const savePayload: SavedFormData<Partial<T>> = {
        data: filteredData,
        timestamp: Date.now(),
        version: CURRENT_VERSION
      };

      localStorage.setItem(storageKey, JSON.stringify(savePayload));
      lastSavedRef.current = dataString;
      logInfo(`[FormAutosave] Saved form data for: ${storageKey}`);
    } catch (error) {
      logWarn('[FormAutosave] Failed to save form data:', error);
    }
  }, [enabled, filterData, storageKey]);

  // Load saved data from localStorage
  const loadSavedData = useCallback((): Partial<T> | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed: SavedFormData<Partial<T>> = JSON.parse(stored);

      // Check version compatibility
      if (parsed.version !== CURRENT_VERSION) {
        logInfo(`[FormAutosave] Clearing outdated data (version mismatch) for: ${storageKey}`);
        localStorage.removeItem(storageKey);
        return null;
      }

      // Check if data is stale
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > maxAgeMs) {
        logInfo(`[FormAutosave] Clearing stale data for: ${storageKey}`);
        localStorage.removeItem(storageKey);
        return null;
      }

      return parsed.data;
    } catch (error) {
      logWarn('[FormAutosave] Failed to load saved data:', error);
      return null;
    }
  }, [storageKey, maxAgeHours]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      lastSavedRef.current = '';
      logInfo(`[FormAutosave] Cleared saved data for: ${storageKey}`);
    } catch (error) {
      logWarn('[FormAutosave] Failed to clear saved data:', error);
    }
  }, [storageKey]);

  // Check if there's saved data
  const hasSavedData = useCallback((): boolean => {
    return loadSavedData() !== null;
  }, [loadSavedData]);

  // Get timestamp of last save
  const getLastSaveTime = useCallback((): Date | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed: SavedFormData<Partial<T>> = JSON.parse(stored);
      return new Date(parsed.timestamp);
    } catch {
      return null;
    }
  }, [storageKey]);

  // Debounced save effect
  useEffect(() => {
    if (!enabled) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      saveData(data);
    }, debounceMs);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, saveData]);

  // Save immediately on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      // Clear timeout and save immediately
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      saveData(data);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [data, enabled, saveData]);

  // Load saved data only once on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      setSavedData(loadSavedData());
    }
  }, [loadSavedData]);

  // Clear savedData state when clearSavedData is called
  const clearSavedDataWithState = useCallback(() => {
    clearSavedData();
    setSavedData(null);
  }, [clearSavedData]);

  return {
    /** Saved form data (null if none exists or expired) - loaded once on mount */
    savedData,
    /** Clear all saved data for this form */
    clearSavedData: clearSavedDataWithState,
    /** Check if there's valid saved data */
    hasSavedData,
    /** Get the timestamp of the last save */
    getLastSaveTime,
    /** Manually trigger a save */
    saveNow: () => saveData(data),
    /** Reload saved data from storage */
    reloadSavedData: () => setSavedData(loadSavedData())
  };
}

export default useFormAutosave;
