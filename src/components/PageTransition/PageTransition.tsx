import React, { useEffect, useState, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Page Transition Component
 *
 * Wraps page content and provides smooth fade transitions
 * when navigating between routes.
 *
 * Uses CSS animations for performance (GPU-accelerated).
 * Respects prefers-reduced-motion accessibility setting.
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut' | 'idle'>('idle');
  const previousPathRef = useRef(location.pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip transition on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayChildren(children);
      return;
    }

    // Only trigger transition if pathname actually changed
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname;
      setTransitionStage('fadeOut');
    }
  }, [location.pathname, children]);

  const handleTransitionEnd = () => {
    if (transitionStage === 'fadeOut') {
      // After fade out, update content and fade in
      setDisplayChildren(children);
      setTransitionStage('fadeIn');
    } else if (transitionStage === 'fadeIn') {
      // After fade in completes, go to idle
      setTransitionStage('idle');
    }
  };

  // Update children immediately when not transitioning
  useEffect(() => {
    if (transitionStage === 'idle') {
      setDisplayChildren(children);
    }
  }, [children, transitionStage]);

  // Determine CSS class - 'idle' uses no animation
  const animationClass = transitionStage === 'idle'
    ? 'page-transition'
    : `page-transition page-transition-${transitionStage}`;

  return (
    <div
      className={animationClass}
      onAnimationEnd={handleTransitionEnd}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;
