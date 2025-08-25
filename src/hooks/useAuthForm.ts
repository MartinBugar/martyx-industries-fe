/**
 * Custom hook pre autentifikačné formuláre
 * Spravuje stav formulára, validáciu a submit handling
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  validateLoginForm, 
  validateRegistrationForm, 
  validateForgotPasswordForm,
  sanitizeInput,
  debounce 
} from '../utils/validation';

// ===== TYPY A INTERFACES =====
export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthFormState {
  data: AuthFormData;
  errors: Partial<Record<keyof AuthFormData, string>>;
  isProcessing: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

export interface AuthFormActions {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  togglePasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
  clearErrors: () => void;
  resetForm: () => void;
  setError: (field: keyof AuthFormData | 'general', message: string) => void;
  setProcessing: (processing: boolean) => void;
}

export type FormType = 'login' | 'registration' | 'forgot-password';

export interface UseAuthFormOptions {
  formType: FormType;
  onSubmit: (data: AuthFormData) => Promise<void>;
  initialData?: Partial<AuthFormData>;
  enableRealTimeValidation?: boolean;
}

// ===== CUSTOM HOOK =====

/**
 * Hook pre správu autentifikačných formulárov
 * Poskytuje kompletnú funkcionalitu pre login, registráciu a forgot password
 */
export const useAuthForm = ({
  formType,
  onSubmit,
  initialData = {},
  enableRealTimeValidation = false
}: UseAuthFormOptions) => {
  // ===== STAV =====
  const [state, setState] = useState<AuthFormState>(() => ({
    data: {
      email: initialData.email || '',
      password: initialData.password || '',
      confirmPassword: initialData.confirmPassword || ''
    },
    errors: {},
    isProcessing: false,
    showPassword: false,
    showConfirmPassword: false
  }));

  // ===== VALIDAČNÉ FUNKCIE =====
  const validateForm = useCallback(() => {
    const { email, password, confirmPassword } = state.data;
    
    switch (formType) {
      case 'login':
        return validateLoginForm(email, password);
      case 'registration':
        return validateRegistrationForm(email, password, confirmPassword || '');
      case 'forgot-password':
        return validateForgotPasswordForm(email);
      default:
        throw new Error(`Neznámy typ formulára: ${formType}`);
    }
  }, [formType, state.data]);

  // ===== DEBOUNCED VALIDÁCIA =====
  const debouncedValidation = useCallback(
    debounce((fieldName: string, value: string, currentData: AuthFormData) => {
      if (!enableRealTimeValidation) return;
      
      let validation;
      switch (fieldName) {
        case 'email':
          validation = validateForgotPasswordForm(value);
          break;
        case 'password':
          if (formType === 'registration') {
            validation = validateRegistrationForm(value, value, currentData.confirmPassword || '');
          } else {
            validation = validateLoginForm(currentData.email, value);
          }
          break;
        case 'confirmPassword':
          validation = validateRegistrationForm(currentData.email, currentData.password, value);
          break;
        default:
          return;
      }
      
      if (!validation.isValid && validation.error) {
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [fieldName]: validation.error
          }
        }));
      } else {
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [fieldName]: undefined
          }
        }));
      }
    }, 300),
    [formType, enableRealTimeValidation]
  );

  // ===== AKCIE =====
  const actions: AuthFormActions = {
    /**
     * Spracovanie zmeny v input poli
     */
    handleInputChange: useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const sanitizedValue = sanitizeInput(value);
      
      setState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          [name]: sanitizedValue
        },
        errors: {
          ...prev.errors,
          [name]: undefined // Vyčistenie chyby pri písaní
        }
      }));
      
      // Real-time validácia
      debouncedValidation(name, sanitizedValue, prev.data);
    }, [debouncedValidation]),

    /**
     * Spracovanie submitu formulára
     */
    handleSubmit: useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validácia formulára
      const validation = validateForm();
      
      if (!validation.isFormValid) {
        setState(prev => ({
          ...prev,
          errors: {
            email: validation.email?.error,
            password: validation.password?.error,
            confirmPassword: validation.confirmPassword?.error
          }
        }));
        return;
      }
      
      // Nastavenie loading stavu
      setState(prev => ({ ...prev, isProcessing: true, errors: {} }));
      
      try {
        await onSubmit(state.data);
      } catch (error) {
        // Chyba bude spracovaná v parent komponente
        console.error('Chyba pri submite formulára:', error);
      } finally {
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    }, [validateForm, onSubmit, state.data]),

    /**
     * Prepnutie viditeľnosti hesla
     */
    togglePasswordVisibility: useCallback(() => {
      setState(prev => ({
        ...prev,
        showPassword: !prev.showPassword
      }));
    }, []),

    /**
     * Prepnutie viditeľnosti potvrdenia hesla
     */
    toggleConfirmPasswordVisibility: useCallback(() => {
      setState(prev => ({
        ...prev,
        showConfirmPassword: !prev.showConfirmPassword
      }));
    }, []),

    /**
     * Vyčistenie všetkých chýb
     */
    clearErrors: useCallback(() => {
      setState(prev => ({
        ...prev,
        errors: {}
      }));
    }, []),

    /**
     * Reset formulára do pôvodného stavu
     */
    resetForm: useCallback(() => {
      setState(prev => ({
        ...prev,
        data: {
          email: initialData.email || '',
          password: initialData.password || '',
          confirmPassword: initialData.confirmPassword || ''
        },
        errors: {},
        showPassword: false,
        showConfirmPassword: false
      }));
    }, [initialData]),

    /**
     * Nastavenie chyby pre konkrétne pole
     */
    setError: useCallback((field: keyof AuthFormData | 'general', message: string) => {
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: message
        }
      }));
    }, []),

    /**
     * Nastavenie processing stavu
     */
    setProcessing: useCallback((processing: boolean) => {
      setState(prev => ({
        ...prev,
        isProcessing: processing
      }));
    }, [])
  };

  // ===== COMPUTED VALUES =====
  const computed = useMemo(() => {
    const validation = validateForm();
    
    return {
      isFormValid: validation.isFormValid,
      hasErrors: Object.values(state.errors).some(error => Boolean(error)),
      firstError: validation.firstError || Object.values(state.errors).find(Boolean),
      isSubmitDisabled: state.isProcessing || !validation.isFormValid
    };
  }, [validateForm, state.errors, state.isProcessing]);

  // ===== RETURN =====
  return {
    // Stav
    ...state,
    // Akcie
    ...actions,
    // Computed hodnoty
    ...computed
  };
};
