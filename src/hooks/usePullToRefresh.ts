import { useState, useEffect, useRef, useCallback } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Distance to pull before triggering refresh (default: 80px)
  resistance?: number; // How much to resist pulling (default: 2.5)
  disabled?: boolean;
}

interface PullToRefreshReturn {
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for implementing pull-to-refresh gesture on mobile devices.
 *
 * Usage:
 * ```tsx
 * const { pullDistance, isRefreshing, isPulling, containerRef } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchProducts();
 *   }
 * });
 *
 * return (
 *   <div ref={containerRef}>
 *     {isPulling && <PullIndicator distance={pullDistance} />}
 *     <ProductList />
 *   </div>
 * );
 * ```
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  disabled = false,
}: PullToRefreshOptions): PullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    // Only start if scrolled to top
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) return;

    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || startYRef.current === 0) return;

    // Only pull if scrolled to top
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) {
      startYRef.current = 0;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    currentYRef.current = e.touches[0].clientY;
    const distance = (currentYRef.current - startYRef.current) / resistance;

    if (distance > 0) {
      // Prevent default scroll behavior while pulling
      e.preventDefault();
      setIsPulling(true);
      // Apply diminishing returns as you pull further
      const dampedDistance = Math.min(distance, threshold * 1.5);
      setPullDistance(dampedDistance);
    }
  }, [disabled, isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    startYRef.current = 0;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Keep indicator visible during refresh

      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    // Animate back to 0
    setPullDistance(0);
    setIsPulling(false);
  }, [disabled, isRefreshing, onRefresh, pullDistance, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    // Use passive: false to allow preventDefault in touchmove
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    containerRef,
  };
}

export default usePullToRefresh;
