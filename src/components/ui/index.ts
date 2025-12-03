// UI Components exports
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps } from './Card';

export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

// Input components (from Input.tsx - with icons support)
export { Input, TextArea } from './Input';
export type { InputProps, TextAreaProps } from './Input';

// Skeleton components
export { Skeleton, SkeletonTable, SkeletonCard, ProductCardSkeleton, ProductGridSkeleton, OrderItemSkeleton, CheckoutSummarySkeleton, ProductDetailSkeleton } from './Skeleton';
export type { SkeletonProps, SkeletonTableProps, SkeletonCardProps, ProductGridSkeletonProps } from './Skeleton';

export { ErrorBoundary, ErrorFallback } from './ErrorBoundary';
export type { ErrorFallbackProps } from './ErrorBoundary';

export { ConfirmDialog, useConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps, UseConfirmDialogOptions, UseConfirmDialogReturn } from './ConfirmDialog';

// Form components (from FormField.tsx - basic form building blocks)
export { FormField, FormSection, FormRow, FormActions } from './FormField';
export {
  Input as FormInput,
  Select as FormSelect,
  Textarea as FormTextarea,
  Checkbox as FormCheckbox,
  Radio as FormRadio
} from './FormField';
export type { FormFieldProps, FormSectionProps, FormRowProps, FormActionsProps } from './FormField';
export type {
  InputProps as FormInputProps,
  SelectProps as FormSelectProps,
  TextareaProps as FormTextareaProps,
  CheckboxProps as FormCheckboxProps,
  RadioProps as FormRadioProps
} from './FormField';

// Empty state component
export { EmptyState, EmptyStateNoResults, EmptyStateNoData, EmptyStateError, EmptyStateOffline } from './EmptyState';
export type { EmptyStateProps, EmptyStateVariant } from './EmptyState';

// Status badge component (color-blind friendly)
export { StatusBadge, StatusDot, StatusText } from './StatusBadge';
export type { StatusVariant } from './StatusBadge';

// Responsive table component
export { ResponsiveTable } from './ResponsiveTable';
export type { ResponsiveTableProps, TableColumn } from './ResponsiveTable';

// Loading indicator components
export { LoadingSpinner, SkeletonBox, SkeletonText, LoadingPage, InlineLoader, LoadingOverlay, SkeletonAvatar } from './LoadingIndicator';
