import { useTranslation } from 'react-i18next';

/**
 * Custom hook for translated validation messages
 * Provides consistent, localized validation error messages across forms
 */
export const useValidation = () => {
  const { t } = useTranslation('validation');

  return {
    /**
     * Required field validation
     * @param field - Optional field name for context
     */
    required: (field?: string): string => {
      if (field) {
        return t('required', { field: t(`fields.${field}`) });
      }
      return t('required_generic');
    },

    /**
     * Email validation
     */
    email: (): string => t('invalid_email'),

    /**
     * Phone validation
     */
    phone: (): string => t('invalid_phone'),

    /**
     * Postal code validation
     */
    postalCode: (): string => t('invalid_postal_code'),

    /**
     * Minimum length validation
     */
    minLength: (min: number, field?: string): string => {
      return t('min_length', {
        min,
        field: field ? t(`fields.${field}`) : ''
      });
    },

    /**
     * Maximum length validation
     */
    maxLength: (max: number, field?: string): string => {
      return t('max_length', {
        max,
        field: field ? t(`fields.${field}`) : ''
      });
    },

    /**
     * Minimum value validation
     */
    minValue: (min: number, field?: string): string => {
      return t('min_value', {
        min,
        field: field ? t(`fields.${field}`) : ''
      });
    },

    /**
     * Maximum value validation
     */
    maxValue: (max: number, field?: string): string => {
      return t('max_value', {
        max,
        field: field ? t(`fields.${field}`) : ''
      });
    },

    /**
     * Password mismatch
     */
    passwordMismatch: (): string => t('password_mismatch'),

    /**
     * Weak password
     */
    weakPassword: (): string => t('weak_password'),

    /**
     * Invalid URL
     */
    url: (): string => t('invalid_url'),

    /**
     * Invalid date
     */
    date: (): string => t('invalid_date'),

    /**
     * Future date required
     */
    futureDate: (): string => t('future_date'),

    /**
     * Past date required
     */
    pastDate: (): string => t('past_date'),

    /**
     * Numeric only
     */
    numericOnly: (field?: string): string => {
      return t('numeric_only', {
        field: field ? t(`fields.${field}`) : ''
      });
    },

    /**
     * Alphabetic only
     */
    alphaOnly: (field?: string): string => {
      return t('alpha_only', {
        field: field ? t(`fields.${field}`) : ''
      });
    },

    /**
     * Alphanumeric only
     */
    alphanumericOnly: (field?: string): string => {
      return t('alphanumeric_only', {
        field: field ? t(`fields.${field}`) : ''
      });
    },

    /**
     * Invalid format
     */
    invalidFormat: (field?: string): string => {
      return t('invalid_format', {
        field: field ? t(`fields.${field}`) : ''
      });
    },

    /**
     * Terms acceptance required
     */
    termsRequired: (): string => t('terms_required'),

    /**
     * Age requirement
     */
    ageRequirement: (age: number): string => {
      return t('age_requirement', { age });
    },

    /**
     * Invalid card number
     */
    invalidCard: (): string => t('invalid_card'),

    /**
     * Invalid CVV
     */
    invalidCvv: (): string => t('invalid_cvv'),

    /**
     * Card expired
     */
    cardExpired: (): string => t('card_expired'),

    /**
     * Invalid expiry date
     */
    invalidExpiry: (): string => t('invalid_expiry'),

    /**
     * Agreement required
     */
    agreementRequired: (): string => t('agreement_required'),

    /**
     * Get translated field name
     */
    fieldName: (field: string): string => {
      return t(`fields.${field}`);
    }
  };
};
