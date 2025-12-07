/**
 * ConfiguratorContext
 *
 * Provides shared state for the configurator components:
 * - ConfiguratorPreview (3D canvas in product view area)
 * - ConfiguratorOptions (slot selection in product details area)
 *
 * This enables the configurator UI to be split across different parts of the ProductDetail layout
 * while maintaining synchronized state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { configuratorService } from '../services/configuratorService';
import { logError, logInfo } from '../services/logger';
import type { Configurator, ConfiguratorOption, SelectedConfiguration } from '../types/configurator';

// =========================================================================
// TYPES
// =========================================================================

interface ConfiguratorContextValue {
  // State
  configurator: Configurator | null;
  loading: boolean;
  error: string | null;
  selectedOptions: Record<string, ConfiguratorOption>;
  autoRotate: boolean;

  // Computed
  totalModifier: number;
  selectedConfiguration: SelectedConfiguration;
  validSlotKeys: Set<string>;

  // Actions
  selectOption: (slotKey: string, option: ConfiguratorOption) => void;
  setAutoRotate: (value: boolean) => void;
  pauseAutoRotate: () => void;
  resumeAutoRotate: () => void;
}

interface ConfiguratorProviderProps {
  masterProductId: number;
  children: React.ReactNode;
  /** Optional: If configurator data was already fetched, pass it here to avoid duplicate API call */
  initialConfigurator?: Configurator;
}

// =========================================================================
// CONSTANTS
// =========================================================================

const LOADING_TIMEOUT_MS = 15000;
const AUTO_ROTATE_RESUME_DELAY_MS = 3000;
const AUTO_ROTATE_DEBOUNCE_MS = 100;

// =========================================================================
// CONTEXT
// =========================================================================

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

// =========================================================================
// HELPER: Initialize default options from configurator
// =========================================================================

const initializeDefaultOptions = (configurator: Configurator): Record<string, ConfiguratorOption> => {
  const defaults: Record<string, ConfiguratorOption> = {};
  configurator.slots.forEach((slot) => {
    const defaultOption = slot.options.find((o) => o.isDefault) || slot.options[0];
    if (defaultOption) {
      defaults[slot.slotKey] = defaultOption;
    }
  });
  return defaults;
};

// =========================================================================
// PROVIDER
// =========================================================================

export const ConfiguratorProvider: React.FC<ConfiguratorProviderProps> = ({
  masterProductId,
  children,
  initialConfigurator,
}) => {
  const [configurator, setConfigurator] = useState<Configurator | null>(initialConfigurator ?? null);
  const [loading, setLoading] = useState(!initialConfigurator);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, ConfiguratorOption>>(() => {
    if (initialConfigurator) {
      return initializeDefaultOptions(initialConfigurator);
    }
    return {};
  });
  const [autoRotate, setAutoRotate] = useState(true);

  // Refs for cleanup
  const autoRotateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load configurator data (skip if we have initial data)
  useEffect(() => {
    // Skip loading if we already have configurator data
    if (initialConfigurator) {
      return;
    }

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    let loadingTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadConfigurator = async () => {
      try {
        setLoading(true);
        setError(null);

        // Set timeout for loading
        loadingTimeoutId = setTimeout(() => {
          if (!signal.aborted) {
            setError('Loading took too long. Please try again.');
            setLoading(false);
            abortControllerRef.current?.abort();
          }
        }, LOADING_TIMEOUT_MS);

        const data = await configuratorService.getPublicConfigurator(masterProductId);

        // Check if request was aborted
        if (signal.aborted) return;

        if (data && data.enabled) {
          setConfigurator(data);
          setSelectedOptions(initializeDefaultOptions(data));
          logInfo('[Configurator] Loaded successfully for product', masterProductId);
        } else {
          setError('Configurator not available for this product');
        }
      } catch (e) {
        // Check if request was aborted
        if (signal.aborted) return;

        let message = 'Failed to load configurator';
        if (e instanceof Error) {
          // Don't log or show abort errors
          if (e.name === 'AbortError') return;

          if (e.message.includes('404') || e.message.includes('not found')) {
            message = 'This product does not have a configurator available';
          } else if (e.message.includes('network') || e.message.includes('Network')) {
            message = 'Network error. Please check your connection.';
          } else if (e.message.includes('timeout')) {
            message = 'Loading took too long. Please try again.';
          }
          logError('[Configurator] Load error:', e);
        }
        setError(message);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
        if (loadingTimeoutId) {
          clearTimeout(loadingTimeoutId);
        }
      }
    };

    loadConfigurator();

    // Cleanup function
    return () => {
      // Abort any pending request
      abortControllerRef.current?.abort();

      // Clear timeout
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
    };
  }, [masterProductId, initialConfigurator]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current);
      }
      if (pauseDebounceRef.current) {
        clearTimeout(pauseDebounceRef.current);
      }
    };
  }, []);

  // Computed: valid slot keys
  const validSlotKeys = useMemo(
    () => new Set(configurator?.slots.map((s) => s.slotKey) ?? []),
    [configurator]
  );

  // Computed: total price modifier
  const totalModifier = useMemo(
    () => Object.values(selectedOptions).reduce((sum, opt) => sum + opt.priceModifier, 0),
    [selectedOptions]
  );

  // Computed: selected configuration object
  const selectedConfiguration = useMemo(() => {
    const config: SelectedConfiguration = {};
    Object.entries(selectedOptions).forEach(([slotKey, option]) => {
      config[slotKey] = {
        optionId: option.id,
        optionKey: option.optionKey,
        displayName: option.displayName,
        priceModifier: option.priceModifier,
      };
    });
    return config;
  }, [selectedOptions]);

  // Action: select option
  const selectOption = useCallback((slotKey: string, option: ConfiguratorOption) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [slotKey]: option,
    }));
  }, []);

  // Action: pause auto-rotate (debounced to avoid rapid state changes)
  const pauseAutoRotate = useCallback(() => {
    // Clear any pending debounce
    if (pauseDebounceRef.current) {
      clearTimeout(pauseDebounceRef.current);
    }

    // Clear any pending resume
    if (autoRotateTimeoutRef.current) {
      clearTimeout(autoRotateTimeoutRef.current);
      autoRotateTimeoutRef.current = null;
    }

    // Debounce the pause to avoid rapid state changes during mouse movement
    pauseDebounceRef.current = setTimeout(() => {
      setAutoRotate(false);
    }, AUTO_ROTATE_DEBOUNCE_MS);
  }, []);

  // Action: resume auto-rotate after delay
  const resumeAutoRotate = useCallback(() => {
    // Clear any pending debounce
    if (pauseDebounceRef.current) {
      clearTimeout(pauseDebounceRef.current);
      pauseDebounceRef.current = null;
    }

    // Clear any existing resume timeout
    if (autoRotateTimeoutRef.current) {
      clearTimeout(autoRotateTimeoutRef.current);
    }

    autoRotateTimeoutRef.current = setTimeout(
      () => setAutoRotate(true),
      AUTO_ROTATE_RESUME_DELAY_MS
    );
  }, []);

  const value: ConfiguratorContextValue = useMemo(() => ({
    configurator,
    loading,
    error,
    selectedOptions,
    autoRotate,
    totalModifier,
    selectedConfiguration,
    validSlotKeys,
    selectOption,
    setAutoRotate,
    pauseAutoRotate,
    resumeAutoRotate,
  }), [
    configurator,
    loading,
    error,
    selectedOptions,
    autoRotate,
    totalModifier,
    selectedConfiguration,
    validSlotKeys,
    selectOption,
    pauseAutoRotate,
    resumeAutoRotate,
  ]);

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
};

// =========================================================================
// HOOK
// =========================================================================

export const useConfigurator = (): ConfiguratorContextValue => {
  const context = useContext(ConfiguratorContext);
  if (!context) {
    throw new Error('useConfigurator must be used within a ConfiguratorProvider');
  }
  return context;
};

export default ConfiguratorContext;
