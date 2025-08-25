/**
 * Utility funkcie pre validáciu formulárov
 * Centralizované validačné pravidlá pre celú aplikáciu
 * Implementuje bezpečnostné opatrenia proti útokom
 */

import { 
  sanitizeText, 
  isValidEmail, 
  validatePassword as secureValidatePassword, 
  sanitizeHtml 
} from './security';

// ===== TYPY A INTERFACES =====
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FormValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => ValidationResult;
}

// ===== VALIDAČNÉ KONSTANTY =====
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^.{6,}$/, // Minimálne 6 znakov
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, // Minimálne 8 znakov, veľké, malé písmená a čísla
} as const;

export const VALIDATION_MESSAGES = {
  required: 'Toto pole je povinné',
  email: 'Zadajte platnú emailovú adresu',
  password: 'Heslo musí mať minimálne 6 znakov',
  passwordMatch: 'Heslá sa nezhodujú',
  minLength: (min: number) => `Minimálne ${min} znakov`,
  maxLength: (max: number) => `Maximálne ${max} znakov`,
  invalidFormat: 'Neplatný formát',
} as const;

// ===== ZÁKLADNÉ VALIDAČNÉ FUNKCIE =====

/**
 * Validácia emailovej adresy s bezpečnostnými kontrolami
 * @param email - Emailová adresa na validáciu
 * @returns ValidationResult s výsledkom validácie
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: VALIDATION_MESSAGES.required };
  }
  
  // Sanitizácia vstupu
  const sanitizedEmail = sanitizeText(email.trim());
  
  if (!sanitizedEmail) {
    return { isValid: false, error: VALIDATION_MESSAGES.required };
  }
  
  if (!isValidEmail(sanitizedEmail)) {
    return { isValid: false, error: VALIDATION_MESSAGES.email };
  }
  
  return { isValid: true };
};

/**
 * Validácia hesla s pokročilými bezpečnostnými kontrolami
 * @param password - Heslo na validáciu
 * @param isStrong - Či má byť heslo silné (voliteľné)
 * @returns ValidationResult s výsledkom validácie
 */
export const validatePassword = (password: string, isStrong = false): ValidationResult => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: VALIDATION_MESSAGES.required };
  }
  
  if (!password.trim()) {
    return { isValid: false, error: VALIDATION_MESSAGES.required };
  }
  
  // Použitie bezpečnej validácie hesla
  if (isStrong) {
    const secureValidation = secureValidatePassword(password);
    if (!secureValidation.isValid) {
      return { 
        isValid: false, 
        error: secureValidation.errors[0] || 'Heslo nespĺňa bezpečnostné požiadavky' 
      };
    }
  } else {
    // Základná validácia pre obyčajné heslá
    if (!VALIDATION_PATTERNS.password.test(password)) {
      return { isValid: false, error: VALIDATION_MESSAGES.password };
    }
  }
  
  return { isValid: true };
};

/**
 * Validácia zhody hesiel
 * @param password - Pôvodné heslo
 * @param confirmPassword - Potvrdenie hesla
 * @returns ValidationResult s výsledkom validácie
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword.trim()) {
    return { isValid: false, error: VALIDATION_MESSAGES.required };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: VALIDATION_MESSAGES.passwordMatch };
  }
  
  return { isValid: true };
};

/**
 * Validácia povinného poľa
 * @param value - Hodnota na validáciu
 * @param fieldName - Názov poľa (voliteľné)
 * @returns ValidationResult s výsledkom validácie
 */
export const validateRequired = (value: string, fieldName?: string): ValidationResult => {
  if (!value.trim()) {
    return { 
      isValid: false, 
      error: fieldName ? `${fieldName} je povinné` : VALIDATION_MESSAGES.required 
    };
  }
  
  return { isValid: true };
};

/**
 * Validácia dľžky textu
 * @param value - Hodnota na validáciu
 * @param minLength - Minimálna dĺžka
 * @param maxLength - Maximálna dĺžka (voliteľné)
 * @returns ValidationResult s výsledkom validácie
 */
export const validateLength = (
  value: string, 
  minLength: number, 
  maxLength?: number
): ValidationResult => {
  if (value.length < minLength) {
    return { isValid: false, error: VALIDATION_MESSAGES.minLength(minLength) };
  }
  
  if (maxLength && value.length > maxLength) {
    return { isValid: false, error: VALIDATION_MESSAGES.maxLength(maxLength) };
  }
  
  return { isValid: true };
};

// ===== KOMPOZITNÉ VALIDAČNÉ FUNKCIE =====

/**
 * Validácia login formulára
 * @param email - Emailová adresa
 * @param password - Heslo
 * @returns Objekt s výsledkami validácie pre všetky polia
 */
export const validateLoginForm = (email: string, password: string) => {
  const emailValidation = validateEmail(email);
  const passwordValidation = validateRequired(password, 'Heslo');
  
  return {
    email: emailValidation,
    password: passwordValidation,
    isFormValid: emailValidation.isValid && passwordValidation.isValid,
    firstError: !emailValidation.isValid ? emailValidation.error : 
                !passwordValidation.isValid ? passwordValidation.error : null
  };
};

/**
 * Validácia registračného formulára
 * @param email - Emailová adresa
 * @param password - Heslo
 * @param confirmPassword - Potvrdenie hesla
 * @returns Objekt s výsledkami validácie pre všetky polia
 */
export const validateRegistrationForm = (
  email: string, 
  password: string, 
  confirmPassword: string
) => {
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
  
  return {
    email: emailValidation,
    password: passwordValidation,
    confirmPassword: passwordMatchValidation,
    isFormValid: emailValidation.isValid && 
                 passwordValidation.isValid && 
                 passwordMatchValidation.isValid,
    firstError: !emailValidation.isValid ? emailValidation.error :
                !passwordValidation.isValid ? passwordValidation.error :
                !passwordMatchValidation.isValid ? passwordMatchValidation.error : null
  };
};

/**
 * Validácia forgot password formulára
 * @param email - Emailová adresa
 * @returns ValidationResult s výsledkom validácie
 */
export const validateForgotPasswordForm = (email: string) => {
  return validateEmail(email);
};

// ===== UTILITY FUNKCIE =====

/**
 * Sanitizácia vstupu - používa pokročilé bezpečnostné funkcie
 * @param input - Vstupný text
 * @returns Sanitizovaný text
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Použitie bezpečnej sanitizácie
  return sanitizeText(input);
};

/**
 * Debounce funkcia pre validáciu počas písania
 * @param func - Funkcia na vykonanie
 * @param delay - Oneskorenie v ms
 * @returns Debounced funkcia
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T, 
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Kontrola sily hesla
 * @param password - Heslo na kontrolu
 * @returns Objekt s informáciami o sile hesla
 */
export const getPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score <= 2) strength = 'weak';
  else if (score <= 3) strength = 'medium';
  else if (score <= 4) strength = 'strong';
  else strength = 'very-strong';
  
  return {
    score,
    strength,
    checks,
    isValid: score >= 3
  };
};
