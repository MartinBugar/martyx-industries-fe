import React from 'react';
import type { LucideProps } from 'lucide-react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ComponentType<LucideProps>;
  rightIcon?: React.ComponentType<LucideProps>;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const wrapperClasses = [
      'input-wrapper',
      fullWidth ? 'input-wrapper-full-width' : '',
      hasError ? 'input-wrapper-error' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      'input',
      LeftIcon ? 'input-with-left-icon' : '',
      RightIcon ? 'input-with-right-icon' : '',
      hasError ? 'input-error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <div className="input-container">
          {LeftIcon && (
            <LeftIcon className="input-icon input-icon-left" size={18} />
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...props}
          />
          {RightIcon && (
            <RightIcon className="input-icon input-icon-right" size={18} />
          )}
        </div>
        {error && <span className="input-error-text">{error}</span>}
        {!error && helperText && (
          <span className="input-helper-text">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const wrapperClasses = [
      'input-wrapper',
      fullWidth ? 'input-wrapper-full-width' : '',
      hasError ? 'input-wrapper-error' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const textareaClasses = [
      'textarea',
      hasError ? 'textarea-error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={textareaId} className="input-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          {...props}
        />
        {error && <span className="input-error-text">{error}</span>}
        {!error && helperText && (
          <span className="input-helper-text">{helperText}</span>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
