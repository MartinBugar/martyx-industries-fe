import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingIndicator Component
 *
 * Unified loading state display for consistency across admin panel.
 *
 * Features:
 * - Multiple variants (spinner, skeleton, overlay)
 * - Customizable size and text
 * - Accessible with aria-live
 */

interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Loading text */
  text?: string;
  /** Center in container */
  centered?: boolean;
  /** Full page overlay */
  overlay?: boolean;
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'light';
  /** Additional className */
  className?: string;
}

const sizeConfig = {
  sm: { iconSize: 16, fontSize: '0.75rem', gap: '6px' },
  md: { iconSize: 24, fontSize: '0.875rem', gap: '8px' },
  lg: { iconSize: 32, fontSize: '1rem', gap: '10px' },
  xl: { iconSize: 48, fontSize: '1.125rem', gap: '12px' },
};

const colorConfig = {
  primary: '#F6C845', // Martyx Gold
  secondary: '#64748B',
  light: '#FFFFFF',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  centered = true,
  overlay = false,
  variant = 'primary',
  className = '',
}) => {
  const config = sizeConfig[size];
  const color = colorConfig[variant];

  const wrapperStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: config.gap,
    ...(centered && !overlay && { padding: '40px' }),
    ...(overlay && {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
    }),
  };

  const textStyles: React.CSSProperties = {
    fontSize: config.fontSize,
    color: overlay ? '#FFFFFF' : 'var(--admin-secondary, #64748B)',
    fontWeight: 500,
  };

  return (
    <div
      className={`loading-indicator ${className}`}
      style={wrapperStyles}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        size={config.iconSize}
        color={color}
        style={{ animation: 'spin 1s linear infinite' }}
        aria-hidden="true"
      />
      {text && <span style={textStyles}>{text}</span>}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );
};

/**
 * SkeletonBox - Animated placeholder for content loading
 */
interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
}) => {
  const styles: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    background: 'linear-gradient(90deg, #E2E8F0 0%, #F1F5F9 50%, #E2E8F0 100%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.5s ease-in-out infinite',
  };

  return (
    <>
      <div className={`skeleton-box ${className}`} style={styles} aria-hidden="true" />
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
};

/**
 * SkeletonText - Text placeholder with multiple lines
 */
interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
  gap?: string | number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '60%',
  gap = '8px',
  className = '',
}) => {
  const wrapperStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: typeof gap === 'number' ? `${gap}px` : gap,
  };

  return (
    <div className={`skeleton-text ${className}`} style={wrapperStyles}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBox
          key={index}
          height="16px"
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonCard - Card placeholder
 */
interface SkeletonCardProps {
  showImage?: boolean;
  imageHeight?: string | number;
  lines?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = true,
  imageHeight = 160,
  lines = 3,
  className = '',
}) => {
  const cardStyles: React.CSSProperties = {
    background: 'var(--admin-bg-primary, #FFFFFF)',
    borderRadius: '12px',
    border: '1px solid var(--admin-border, #E2E8F0)',
    overflow: 'hidden',
  };

  const contentStyles: React.CSSProperties = {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  return (
    <div className={`skeleton-card ${className}`} style={cardStyles}>
      {showImage && (
        <SkeletonBox
          height={imageHeight}
          borderRadius="0"
        />
      )}
      <div style={contentStyles}>
        <SkeletonBox height="24px" width="70%" />
        <SkeletonText lines={lines} />
      </div>
    </div>
  );
};

/**
 * SkeletonTable - Table placeholder
 */
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
}) => {
  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const cellStyles: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--admin-border, #E2E8F0)',
  };

  const headerCellStyles: React.CSSProperties = {
    ...cellStyles,
    background: 'var(--admin-bg-secondary, #F8FAFC)',
  };

  return (
    <table className={`skeleton-table ${className}`} style={tableStyles}>
      {showHeader && (
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} style={headerCellStyles}>
                <SkeletonBox height="14px" width={`${60 + Math.random() * 40}%`} />
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} style={cellStyles}>
                <SkeletonBox height="16px" width={`${50 + Math.random() * 50}%`} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * SkeletonAvatar - Circle placeholder for avatars
 */
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  return (
    <SkeletonBox
      width={sizes[size]}
      height={sizes[size]}
      borderRadius="50%"
      className={className}
    />
  );
};

/**
 * LoadingPage - Full page loading state
 */
interface LoadingPageProps {
  text?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  text = 'Loading...',
}) => {
  const styles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '16px',
  };

  return (
    <div style={styles}>
      <LoadingSpinner size="xl" variant="primary" />
      <p style={{
        fontSize: '1rem',
        color: 'var(--admin-secondary, #64748B)',
        fontWeight: 500,
      }}>
        {text}
      </p>
    </div>
  );
};

/**
 * InlineLoader - Small inline loading indicator
 */
interface InlineLoaderProps {
  size?: 'sm' | 'md';
  className?: string;
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  size = 'sm',
  className = '',
}) => {
  const iconSize = size === 'sm' ? 14 : 18;

  return (
    <Loader2
      size={iconSize}
      className={className}
      style={{
        animation: 'spin 1s linear infinite',
        color: 'currentColor',
      }}
      aria-hidden="true"
    />
  );
};

/**
 * LoadingOverlay - Semi-transparent overlay with spinner
 */
interface LoadingOverlayProps {
  text?: string;
  visible?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  text,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(2px)',
        zIndex: 10,
      }}
    >
      <LoadingSpinner size="lg" text={text} variant="primary" />
    </div>
  );
};

export default LoadingSpinner;
