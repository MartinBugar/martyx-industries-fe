import React, { useEffect, useState, type ReactNode } from 'react';
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
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    // When route changes, start fade out
    setTransitionStage('fadeOut');
  }, [location.pathname]);

  const handleTransitionEnd = () => {
    if (transitionStage === 'fadeOut') {
      // After fade out, update content and fade in
      setDisplayChildren(children);
      setTransitionStage('fadeIn');
    }
  };

  // Also update children immediately if they change without route change
  useEffect(() => {
    if (transitionStage === 'fadeIn') {
      setDisplayChildren(children);
    }
  }, [children, transitionStage]);

  return (
    <div
      className={`page-transition page-transition-${transitionStage}`}
      onAnimationEnd={handleTransitionEnd}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;
