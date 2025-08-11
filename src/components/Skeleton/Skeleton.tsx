import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  variant?: 'text' | 'rect';
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ variant = 'rect', width, height, style, className }) => {
  const styles: React.CSSProperties = { width, height, ...style };
  const cls = `skeleton ${variant === 'text' ? 'skeleton-text' : 'skeleton-rect'}${className ? ` ${className}` : ''}`;
  return <div className={cls} style={styles} aria-hidden="true" />;
};

export default Skeleton;
