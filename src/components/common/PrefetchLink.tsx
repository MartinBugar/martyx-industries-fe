import React, { useCallback, useRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { useLinkPrefetch } from '../../hooks/useRoutePrefetch';

interface PrefetchLinkProps extends LinkProps {
  prefetchDelay?: number;
}

/**
 * Link component with hover-based route prefetching.
 * Prefetches the target route when user hovers over the link.
 *
 * @param prefetchDelay - Delay in ms before prefetch starts (default: 100ms)
 */
const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  to,
  children,
  prefetchDelay = 100,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const { prefetch } = useLinkPrefetch();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Start prefetch after delay
    const href = typeof to === 'string' ? to : to.pathname || '';
    if (href) {
      timeoutRef.current = setTimeout(() => {
        prefetch(href);
      }, prefetchDelay);
    }

    // Call original handler if provided
    onMouseEnter?.(e);
  }, [to, prefetch, prefetchDelay, onMouseEnter]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Cancel prefetch if user leaves before delay
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Call original handler if provided
    onMouseLeave?.(e);
  }, [onMouseLeave]);

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Link>
  );
};

export default PrefetchLink;
