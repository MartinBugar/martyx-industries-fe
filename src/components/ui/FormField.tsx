import React, { forwardRef, useId } from 'react';
import '@/styles/admin-forms.css';

/**
 * FormField Component
 *
 * Unified form field wrapper that provides consistent styling,
 * accessibility, and validation display across all admin forms.
 *
 * Features:
 * - Automatic label-input association (accessibility)
 * - Required/optional field indicators
 * - Error and hint text display
 * - Character counter for text fields
 * - Consistent styling with Martyx design tokens
 */

export interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Field name for form handling */
  name: string;
  /** Whether the field is required */
  required?: boolean;
  /** Show "(optional)" after label */
  showOptional?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper/hint text */
  hint?: string;
  /** Success message */
  success?: string;
  /** Character count for counter display */
  charCount?: number;
  /** Maximum characters for counter */
  maxChars?: number;
  /** Additional className for the wrapper */
  className?: string;
  /** Layout direction */
  layout?: 'vertical' | 'horizontal';
  /** Children (the actual input element) */
  children: React.ReactElement;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      name,
      required = false,
      showOptional = false,
      error,
      hint,
      success,
      charCount,
      maxChars,
      className = '',
      layout = 'vertical',
      children,
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = `${name}-${generatedId}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    // Clone the child input element to add accessibility attributes
    const inputElement = React.cloneElement(children, {
      id: inputId,
      name,
      'aria-invalid': error ? 'true' : undefined,
      'aria-describedby': [errorId, hintId].filter(Boolean).join(' ') || undefined,
      'aria-required': required || undefined,
      className: `${children.props.className || ''} ${error ? 'admin-form-input--error' : ''} ${success ? 'admin-form-input--success' : ''}`.trim(),
    });

    // Determine character counter status
    const getCounterStatus = () => {
      if (!charCount || !maxChars) return '';
      const percentage = (charCount / maxChars) * 100;
      if (percentage >= 100) return 'admin-form-counter--error';
      if (percentage >= 80) return 'admin-form-counter--warning';
      return '';
    };

    return (
      <div
        ref={ref}
        className={`admin-form-group ${layout === 'horizontal' ? 'admin-form-group--horizontal' : ''} ${className}`.trim()}
      >
        <label
          htmlFor={inputId}
          className={`admin-form-label ${required ? 'admin-form-label--required' : ''} ${showOptional && !required ? 'admin-form-label--optional' : ''}`.trim()}
        >
          {label}
        </label>

        {inputElement}

        {/* Character counter */}
        {charCount !== undefined && maxChars && (
          <div className={`admin-form-counter ${getCounterStatus()}`}>
            {charCount} / {maxChars}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div id={errorId} className="admin-form-error" role="alert">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && !error && (
          <div className="admin-form-success">
            {success}
          </div>
        )}

        {/* Hint text */}
        {hint && !error && !success && (
          <div id={hintId} className="admin-form-hint">
            {hint}
          </div>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

/**
 * FormSection Component
 *
 * Groups related form fields with a title and optional description.
 */
export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => (
  <div className={`admin-form-section ${className}`.trim()}>
    <h3 className="admin-form-section-title">{title}</h3>
    {description && (
      <p className="admin-form-section-description">{description}</p>
    )}
    {children}
  </div>
);

/**
 * FormRow Component
 *
 * Arranges multiple form fields in a horizontal row.
 */
export interface FormRowProps {
  /** Number of columns (2, 3, or 4) */
  columns?: 2 | 3 | 4 | '1-2' | '2-1';
  children: React.ReactNode;
  className?: string;
}

export const FormRow: React.FC<FormRowProps> = ({
  columns = 2,
  children,
  className = '',
}) => {
  const columnClass = typeof columns === 'number'
    ? `admin-form-row--${columns}`
    : `admin-form-row--${columns}`;

  return (
    <div className={`admin-form-row ${columnClass} ${className}`.trim()}>
      {children}
    </div>
  );
};

/**
 * FormActions Component
 *
 * Container for form action buttons (submit, cancel, etc.)
 */
export interface FormActionsProps {
  /** Alignment of buttons */
  align?: 'left' | 'right' | 'center' | 'space-between';
  children: React.ReactNode;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  align = 'right',
  children,
  className = '',
}) => {
  const alignClass = align === 'left' ? '' :
    align === 'space-between' ? 'admin-form-actions--space-between' :
    align === 'center' ? 'admin-form-actions--center' :
    'admin-form-actions--right';

  return (
    <div className={`admin-form-actions ${alignClass} ${className}`.trim()}>
      {children}
    </div>
  );
};

/**
 * Input Components with proper styling
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => (
    <input
      ref={ref}
      className={`admin-form-input ${error ? 'admin-form-input--error' : ''} ${className}`.trim()}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={`admin-form-select ${error ? 'admin-form-select--error' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`admin-form-textarea ${error ? 'admin-form-textarea--error' : ''} ${className}`.trim()}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

/**
 * Checkbox Component
 */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || `checkbox-${generatedId}`;

    return (
      <div className={`admin-form-checkbox-group ${className}`.trim()}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className="admin-form-checkbox"
          {...props}
        />
        <label htmlFor={checkboxId} className="admin-form-checkbox-label">
          {label}
        </label>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

/**
 * Radio Component
 */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || `radio-${generatedId}`;

    return (
      <div className={`admin-form-radio-group ${className}`.trim()}>
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className="admin-form-radio"
          {...props}
        />
        <label htmlFor={radioId} className="admin-form-radio-label">
          {label}
        </label>
      </div>
    );
  }
);
Radio.displayName = 'Radio';

export default FormField;
