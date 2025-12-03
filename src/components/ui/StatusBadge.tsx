import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  X,
  AlertTriangle,
  Clock,
  Loader2,
  Pause,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Zap,
  Package,
  Truck,
  Archive,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

/**
 * StatusBadge Component
 *
 * Color-blind friendly status indicator that combines color + icon + text.
 * Ensures WCAG 2.1 AA compliance by not relying solely on color.
 *
 * Features:
 * - Pre-built status variants for common use cases
 * - Icons for color-blind accessibility
 * - Consistent sizing and styling
 * - Support for custom statuses
 */

export type StatusVariant =
  // General statuses
  | 'success' | 'error' | 'warning' | 'info' | 'neutral'
  // System health
  | 'healthy' | 'degraded' | 'critical' | 'unknown'
  // Order statuses
  | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  // Content statuses
  | 'draft' | 'published' | 'archived' | 'scheduled'
  // User statuses
  | 'active' | 'inactive' | 'banned' | 'suspended'
  // Connection statuses
  | 'connected' | 'disconnected' | 'connecting'
  // Custom
  | 'custom';

interface StatusConfig {
  icon: LucideIcon;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const statusConfigs: Record<Exclude<StatusVariant, 'custom'>, StatusConfig> = {
  // General statuses
  success: {
    icon: CheckCircle,
    label: 'Success',
    bgColor: '#DCFCE7',
    textColor: '#166534',
    borderColor: '#86EFAC',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    borderColor: '#FCA5A5',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    borderColor: '#FCD34D',
  },
  info: {
    icon: Info,
    label: 'Info',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    borderColor: '#93C5FD',
  },
  neutral: {
    icon: Info,
    label: 'Neutral',
    bgColor: '#F1F5F9',
    textColor: '#475569',
    borderColor: '#CBD5E1',
  },

  // System health
  healthy: {
    icon: CheckCircle,
    label: 'Healthy',
    bgColor: '#DCFCE7',
    textColor: '#166534',
    borderColor: '#86EFAC',
  },
  degraded: {
    icon: AlertTriangle,
    label: 'Degraded',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    borderColor: '#FCD34D',
  },
  critical: {
    icon: XCircle,
    label: 'Critical',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    borderColor: '#FCA5A5',
  },
  unknown: {
    icon: AlertCircle,
    label: 'Unknown',
    bgColor: '#F1F5F9',
    textColor: '#475569',
    borderColor: '#CBD5E1',
  },

  // Order statuses
  pending: {
    icon: Clock,
    label: 'Pending',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    borderColor: '#FCD34D',
  },
  processing: {
    icon: Loader2,
    label: 'Processing',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    borderColor: '#93C5FD',
  },
  shipped: {
    icon: Truck,
    label: 'Shipped',
    bgColor: '#E0E7FF',
    textColor: '#3730A3',
    borderColor: '#A5B4FC',
  },
  delivered: {
    icon: Package,
    label: 'Delivered',
    bgColor: '#DCFCE7',
    textColor: '#166534',
    borderColor: '#86EFAC',
  },
  cancelled: {
    icon: X,
    label: 'Cancelled',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    borderColor: '#FCA5A5',
  },
  refunded: {
    icon: RefreshCw,
    label: 'Refunded',
    bgColor: '#F3E8FF',
    textColor: '#6B21A8',
    borderColor: '#C4B5FD',
  },

  // Content statuses
  draft: {
    icon: EyeOff,
    label: 'Draft',
    bgColor: '#F1F5F9',
    textColor: '#475569',
    borderColor: '#CBD5E1',
  },
  published: {
    icon: Eye,
    label: 'Published',
    bgColor: '#DCFCE7',
    textColor: '#166534',
    borderColor: '#86EFAC',
  },
  archived: {
    icon: Archive,
    label: 'Archived',
    bgColor: '#F1F5F9',
    textColor: '#475569',
    borderColor: '#CBD5E1',
  },
  scheduled: {
    icon: Clock,
    label: 'Scheduled',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    borderColor: '#93C5FD',
  },

  // User statuses
  active: {
    icon: Check,
    label: 'Active',
    bgColor: '#DCFCE7',
    textColor: '#166534',
    borderColor: '#86EFAC',
  },
  inactive: {
    icon: Pause,
    label: 'Inactive',
    bgColor: '#F1F5F9',
    textColor: '#475569',
    borderColor: '#CBD5E1',
  },
  banned: {
    icon: Ban,
    label: 'Banned',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    borderColor: '#FCA5A5',
  },
  suspended: {
    icon: AlertTriangle,
    label: 'Suspended',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    borderColor: '#FCD34D',
  },

  // Connection statuses
  connected: {
    icon: Zap,
    label: 'Connected',
    bgColor: '#DCFCE7',
    textColor: '#166534',
    borderColor: '#86EFAC',
  },
  disconnected: {
    icon: X,
    label: 'Disconnected',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    borderColor: '#FCA5A5',
  },
  connecting: {
    icon: Loader2,
    label: 'Connecting',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    borderColor: '#93C5FD',
  },
};

interface StatusBadgeProps {
  /** Predefined status variant */
  status: StatusVariant;
  /** Custom label (overrides default) */
  label?: string;
  /** Custom icon (overrides default) */
  icon?: LucideIcon;
  /** Custom colors for 'custom' variant */
  customColors?: {
    bgColor: string;
    textColor: string;
    borderColor?: string;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show icon */
  showIcon?: boolean;
  /** Show text label */
  showLabel?: boolean;
  /** Show border */
  showBorder?: boolean;
  /** Pulsing animation for active states */
  pulse?: boolean;
  /** Additional className */
  className?: string;
}

const sizeConfig = {
  sm: {
    padding: '2px 8px',
    fontSize: '0.6875rem',
    iconSize: 12,
    gap: '4px',
    borderRadius: '4px',
  },
  md: {
    padding: '4px 10px',
    fontSize: '0.8125rem',
    iconSize: 14,
    gap: '6px',
    borderRadius: '6px',
  },
  lg: {
    padding: '6px 14px',
    fontSize: '0.875rem',
    iconSize: 16,
    gap: '8px',
    borderRadius: '8px',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  icon,
  customColors,
  size = 'md',
  showIcon = true,
  showLabel = true,
  showBorder = true,
  pulse = false,
  className = '',
}) => {
  // Get config based on status
  const config = status === 'custom' && customColors
    ? {
        icon: icon || Check,
        label: label || 'Custom',
        bgColor: customColors.bgColor,
        textColor: customColors.textColor,
        borderColor: customColors.borderColor || customColors.bgColor,
      }
    : statusConfigs[status as Exclude<StatusVariant, 'custom'>];

  const IconComponent = icon || config.icon;
  const displayLabel = label || config.label;
  const sizeStyles = sizeConfig[size];

  const badgeStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeStyles.gap,
    padding: sizeStyles.padding,
    fontSize: sizeStyles.fontSize,
    fontWeight: 600,
    lineHeight: 1.4,
    borderRadius: sizeStyles.borderRadius,
    backgroundColor: config.bgColor,
    color: config.textColor,
    border: showBorder ? `1px solid ${config.borderColor}` : 'none',
    whiteSpace: 'nowrap',
    animation: pulse ? 'statusPulse 2s ease-in-out infinite' : undefined,
  };

  // Processing/Connecting spinner animation
  const shouldSpin = status === 'processing' || status === 'connecting';

  return (
    <>
      {/* Pulse animation keyframes */}
      {pulse && (
        <style>{`
          @keyframes statusPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}</style>
      )}
      {shouldSpin && (
        <style>{`
          @keyframes statusSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      )}

      <span
        className={`status-badge status-badge--${status} ${className}`}
        style={badgeStyles}
        role="status"
        aria-label={displayLabel}
      >
        {showIcon && (
          <IconComponent
            size={sizeStyles.iconSize}
            style={{
              flexShrink: 0,
              animation: shouldSpin ? 'statusSpin 1s linear infinite' : undefined,
            }}
            aria-hidden="true"
          />
        )}
        {showLabel && <span>{displayLabel}</span>}
      </span>
    </>
  );
};

/**
 * StatusDot - Minimal status indicator (just a colored dot with optional pulse)
 */
interface StatusDotProps {
  status: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const config = statusConfigs[status as Exclude<StatusVariant, 'custom'>] || statusConfigs.neutral;

  const dotSizes = {
    sm: 6,
    md: 8,
    lg: 10,
  };

  const dotStyles: React.CSSProperties = {
    display: 'inline-block',
    width: dotSizes[size],
    height: dotSizes[size],
    borderRadius: '50%',
    backgroundColor: config.textColor,
    animation: pulse ? 'statusPulse 2s ease-in-out infinite' : undefined,
  };

  return (
    <>
      {pulse && (
        <style>{`
          @keyframes statusPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
          }
        `}</style>
      )}
      <span
        className={`status-dot status-dot--${status} ${className}`}
        style={dotStyles}
        role="status"
        aria-label={config.label}
      />
    </>
  );
};

/**
 * StatusText - Just text with status color
 */
interface StatusTextProps {
  status: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

export const StatusText: React.FC<StatusTextProps> = ({
  status,
  children,
  className = '',
}) => {
  const config = statusConfigs[status as Exclude<StatusVariant, 'custom'>] || statusConfigs.neutral;

  return (
    <span
      className={`status-text status-text--${status} ${className}`}
      style={{ color: config.textColor }}
    >
      {children}
    </span>
  );
};

export default StatusBadge;
