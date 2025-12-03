import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Inbox,
  Search,
  FileX,
  Users,
  ShoppingCart,
  Package,
  AlertCircle,
  Wifi,
  Database,
  Image,
  FileText,
  Calendar,
  Mail,
  CreditCard,
  Tag,
  BarChart3,
  MessageSquare,
  Settings,
} from 'lucide-react';
import '@/styles/admin-forms.css';

/**
 * EmptyState Component
 *
 * Unified empty state display for when there's no data to show.
 * Provides consistent UX across all admin panel tables and lists.
 *
 * Features:
 * - Pre-built icons for common scenarios
 * - Customizable title and description
 * - Optional action button
 * - Consistent styling
 */

export type EmptyStateVariant =
  | 'default'
  | 'search'
  | 'no-data'
  | 'no-users'
  | 'no-orders'
  | 'no-products'
  | 'error'
  | 'offline'
  | 'no-database'
  | 'no-images'
  | 'no-documents'
  | 'no-events'
  | 'no-messages'
  | 'no-payments'
  | 'no-discounts'
  | 'no-analytics'
  | 'no-tickets'
  | 'no-settings';

export interface EmptyStateProps {
  /** Predefined variant with icon */
  variant?: EmptyStateVariant;
  /** Custom icon (overrides variant icon) */
  icon?: LucideIcon;
  /** Main title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size of the empty state */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const variantIcons: Record<EmptyStateVariant, LucideIcon> = {
  'default': Inbox,
  'search': Search,
  'no-data': FileX,
  'no-users': Users,
  'no-orders': ShoppingCart,
  'no-products': Package,
  'error': AlertCircle,
  'offline': Wifi,
  'no-database': Database,
  'no-images': Image,
  'no-documents': FileText,
  'no-events': Calendar,
  'no-messages': Mail,
  'no-payments': CreditCard,
  'no-discounts': Tag,
  'no-analytics': BarChart3,
  'no-tickets': MessageSquare,
  'no-settings': Settings,
};

const variantColors: Record<EmptyStateVariant, string> = {
  'default': '#94A3B8',
  'search': '#64748B',
  'no-data': '#94A3B8',
  'no-users': '#3B82F6',
  'no-orders': '#8B5CF6',
  'no-products': '#F59E0B',
  'error': '#EF4444',
  'offline': '#EF4444',
  'no-database': '#EF4444',
  'no-images': '#10B981',
  'no-documents': '#6366F1',
  'no-events': '#EC4899',
  'no-messages': '#14B8A6',
  'no-payments': '#22C55E',
  'no-discounts': '#F6C845',
  'no-analytics': '#3B82F6',
  'no-tickets': '#8B5CF6',
  'no-settings': '#64748B',
};

const sizeConfig = {
  sm: {
    iconSize: 32,
    padding: '24px',
    titleSize: '0.9375rem',
    descSize: '0.8125rem',
    gap: '12px',
  },
  md: {
    iconSize: 48,
    padding: '40px',
    titleSize: '1.125rem',
    descSize: '0.875rem',
    gap: '16px',
  },
  lg: {
    iconSize: 64,
    padding: '60px',
    titleSize: '1.25rem',
    descSize: '1rem',
    gap: '20px',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className = '',
}) => {
  const IconComponent = icon || variantIcons[variant];
  const iconColor = variantColors[variant];
  const config = sizeConfig[size];

  const styles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: config.padding,
    gap: config.gap,
  };

  const iconWrapperStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: config.iconSize * 1.75,
    height: config.iconSize * 1.75,
    borderRadius: '50%',
    background: `${iconColor}15`,
    marginBottom: '8px',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: config.titleSize,
    fontWeight: 600,
    color: 'var(--admin-primary, #1E293B)',
    margin: 0,
    lineHeight: 1.4,
  };

  const descStyles: React.CSSProperties = {
    fontSize: config.descSize,
    color: 'var(--admin-secondary, #64748B)',
    margin: 0,
    maxWidth: '400px',
    lineHeight: 1.6,
  };

  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  return (
    <div className={`empty-state ${className}`} style={styles}>
      <div style={iconWrapperStyles}>
        <IconComponent
          size={config.iconSize}
          color={iconColor}
          strokeWidth={1.5}
        />
      </div>

      <h3 style={titleStyles}>{title}</h3>

      {description && (
        <p style={descStyles}>{description}</p>
      )}

      {(action || secondaryAction) && (
        <div style={actionsStyles}>
          {action && (
            <button
              onClick={action.onClick}
              className={`admin-btn ${action.variant === 'secondary' ? 'admin-btn--secondary' : 'admin-btn--primary'}`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="admin-btn admin-btn--ghost"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Pre-configured empty states for common scenarios
 */
export const EmptyStateNoResults: React.FC<{
  searchTerm?: string;
  onClear?: () => void;
}> = ({ searchTerm, onClear }) => (
  <EmptyState
    variant="search"
    title={searchTerm ? `No results for "${searchTerm}"` : 'No results found'}
    description="Try adjusting your search or filter criteria to find what you're looking for."
    action={onClear ? { label: 'Clear filters', onClick: onClear, variant: 'secondary' } : undefined}
  />
);

export const EmptyStateNoData: React.FC<{
  itemType?: string;
  onCreate?: () => void;
}> = ({ itemType = 'items', onCreate }) => (
  <EmptyState
    variant="no-data"
    title={`No ${itemType} yet`}
    description={`Get started by creating your first ${itemType.slice(0, -1) || 'item'}.`}
    action={onCreate ? { label: `Create ${itemType.slice(0, -1) || 'item'}`, onClick: onCreate } : undefined}
  />
);

export const EmptyStateError: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <EmptyState
    variant="error"
    title="Something went wrong"
    description={message || 'An error occurred while loading data. Please try again.'}
    action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
  />
);

export const EmptyStateOffline: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => (
  <EmptyState
    variant="offline"
    title="You're offline"
    description="Check your internet connection and try again."
    action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
  />
);

export default EmptyState;
