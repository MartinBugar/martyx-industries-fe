import React from 'react';
import type { LucideProps } from 'lucide-react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentType<LucideProps>;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const classes = [
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      fullWidth ? 'btn-full-width' : '',
      loading ? 'btn-loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="btn-spinner" aria-hidden="true" />
        )}
        {!loading && Icon && iconPosition === 'left' && (
          <Icon className="btn-icon btn-icon-left" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
        )}
        {children && <span className="btn-text">{children}</span>}
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className="btn-icon btn-icon-right" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
