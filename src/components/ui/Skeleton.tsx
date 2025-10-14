import React from 'react';
import './Skeleton.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      animation = 'pulse',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const classes = [
      'skeleton',
      `skeleton-${variant}`,
      animation !== 'none' ? `skeleton-${animation}` : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const combinedStyle: React.CSSProperties = {
      width,
      height,
      ...style,
    };

    return <div ref={ref} className={classes} style={combinedStyle} {...props} />;
  }
);

Skeleton.displayName = 'Skeleton';

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="rectangular" height={16} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="rectangular" height={14} />
          ))}
        </div>
      ))}
    </div>
  );
};

export interface SkeletonCardProps {
  hasImage?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ hasImage = false, lines = 3 }) => {
  return (
    <div className="skeleton-card">
      {hasImage && <Skeleton variant="rectangular" height={200} className="skeleton-card-image" />}
      <div className="skeleton-card-content">
        <Skeleton variant="text" height={20} width="60%" className="skeleton-card-title" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={`line-${i}`}
            variant="text"
            height={14}
            width={i === lines - 1 ? '80%' : '100%'}
          />
        ))}
      </div>
    </div>
  );
};
