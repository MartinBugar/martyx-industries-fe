import { useCallback, useMemo } from 'react';

/**
 * Haptic feedback patterns for different interactions.
 * Uses the Vibration API which is supported on most mobile browsers.
 */
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

interface HapticFeedbackOptions {
  enabled?: boolean;
}

interface HapticFeedbackReturn {
  trigger: (pattern?: HapticPattern) => void;
  isSupported: boolean;
}

// Vibration patterns in milliseconds
// Single number = vibrate for that duration
// Array = alternating vibrate/pause durations
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,           // Quick tap
  medium: 25,          // Standard feedback
  heavy: 50,           // Strong feedback
  success: [10, 50, 20], // Short-pause-longer (positive)
  warning: [30, 30, 30], // Three equal pulses
  error: [50, 30, 50, 30, 50], // Three strong pulses
  selection: 5,        // Very light for selections
};

/**
 * Hook for providing haptic (vibration) feedback on mobile devices.
 *
 * Usage:
 * ```tsx
 * const { trigger, isSupported } = useHapticFeedback();
 *
 * const handleAddToCart = () => {
 *   trigger('success');
 *   // ... add to cart logic
 * };
 * ```
 *
 * Patterns:
 * - light: Quick tap for minor interactions
 * - medium: Standard button press feedback
 * - heavy: Important actions (checkout, confirm)
 * - success: Positive feedback (added to cart, order complete)
 * - warning: Attention needed
 * - error: Something went wrong
 * - selection: Very light for option selection
 */
export function useHapticFeedback(options: HapticFeedbackOptions = {}): HapticFeedbackReturn {
  const { enabled = true } = options;

  // Check if Vibration API is supported
  const isSupported = useMemo(() => {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }, []);

  const trigger = useCallback((pattern: HapticPattern = 'medium') => {
    if (!enabled || !isSupported) return;

    try {
      const vibrationPattern = HAPTIC_PATTERNS[pattern];
      navigator.vibrate(vibrationPattern);
    } catch (error) {
      // Silently fail - haptic is enhancement, not critical
      console.debug('Haptic feedback failed:', error);
    }
  }, [enabled, isSupported]);

  return {
    trigger,
    isSupported,
  };
}

/**
 * Standalone function to trigger haptic feedback without hook.
 * Useful for event handlers outside React components.
 */
export function triggerHaptic(pattern: HapticPattern = 'medium'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      const vibrationPattern = HAPTIC_PATTERNS[pattern];
      navigator.vibrate(vibrationPattern);
    } catch {
      // Silently fail
    }
  }
}

export default useHapticFeedback;
