/**
 * Zod validation schemas for all forms in the application
 * Provides type-safe validation with detailed error messages
 */

import { z } from 'zod';

// ===== COMMON SCHEMAS =====

/**
 * Email validation schema
 * - Must be a valid email format
 * - Required field
 */
export const emailSchema = z
  .string()
  .min(1, { message: 'Email je povinný' })
  .email({ message: 'Neplatný formát emailu' })
  .toLowerCase()
  .trim();

/**
 * Password validation schema
 * - Minimum 8 characters
 * - Required field
 */
export const passwordSchema = z
  .string()
  .min(8, { message: 'Heslo musí mať minimálne 8 znakov' });

/**
 * Phone number validation schema
 * - International format: +XXX XXX XXX XXX
 * - Allows spaces, dashes, parentheses
 */
export const phoneSchema = z
  .string()
  .min(1, { message: 'Phone number is required' })
  .regex(
    /^\+?[\d\s\-\(\)]{9,20}$/,
    { message: 'Please enter a valid phone number (e.g., +421 900 123 456)' }
  );

// ===== AUTH FORM SCHEMAS =====

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Heslo je povinné' })
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form schema
 * - Includes password confirmation
 * - GDPR consent required
 * - Marketing consent optional
 */
export const registrationSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    gdprConsent: z.boolean().refine((val) => val === true, {
      message: 'Musíte súhlasiť s podmienkami ochrany osobných údajov'
    }),
    marketingConsent: z.boolean().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Heslá sa nezhodujú',
    path: ['confirmPassword']
  });

export type RegistrationFormData = z.infer<typeof registrationSchema>;

/**
 * Forgot password form schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password form schema
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Heslá sa nezhodujú',
    path: ['confirmPassword']
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ===== CONTACT FORM SCHEMA =====

/**
 * Contact form schema
 * - Includes honeypot field for bot protection
 * - Email validation
 * - Message length validation
 */
export const contactSchema = z.object({
  email: emailSchema,
  subject: z
    .string()
    .min(3, { message: 'Predmet musí mať minimálne 3 znaky' })
    .max(200, { message: 'Predmet môže mať maximálne 200 znakov' }),
  text: z
    .string()
    .min(10, { message: 'Správa musí mať minimálne 10 znakov' })
    .max(5000, { message: 'Správa môže mať maximálne 5000 znakov' }),
  // Honeypot fields - should remain empty
  website: z.string().max(0, { message: 'Bot detection' }).optional(),
  formStartTime: z.number().optional(),
  verificationToken: z.string().optional()
});

export type ContactFormData = z.infer<typeof contactSchema>;

// ===== CHECKOUT FORM SCHEMAS =====

/**
 * Checkout form schema (flat structure matching Checkout.tsx)
 * - Contact information
 * - Billing address
 * - Optional shipping address
 * - B2B company fields
 * - Legal consents
 */
export const checkoutFormSchema = z.object({
  // Contact Information
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(1, { message: 'Phone number is required' }).regex(/^\+?[\d\s\-\(\)]{9,20}$/, { message: 'Please enter a valid phone number (e.g., +421 900 123 456)' }),

  // Billing Address
  billingStreet: z.string().min(1, { message: 'Street address is required' }),
  billingCity: z.string().min(1, { message: 'City is required' }),
  billingState: z.string().optional(),
  billingPostalCode: z.string().min(1, { message: 'Postal code is required' }),
  billingCountry: z.string().min(1, { message: 'Country is required' }),

  // Shipping Address (conditional)
  shipToDifferentAddress: z.boolean().optional(),
  shippingStreet: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),

  // B2B Customer fields
  isCompany: z.boolean().optional(),
  companyName: z.string().optional(),
  companyId: z.string().optional(),
  taxId: z.string().optional(),
  vatId: z.string().optional(),

  // Marketing
  newsletterOptIn: z.boolean().optional(),

  // Legal consents
  termsAccepted: z.boolean(), // REQUIRED
  privacyAccepted: z.boolean().optional() // OPTIONAL - newsletter consent
}).superRefine((data, ctx) => {
  // Validate legal consents - Only Terms & Conditions are REQUIRED for payment
  if (!data.termsAccepted || data.termsAccepted !== true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please accept the Terms & Conditions to continue',
      path: ['termsAccepted']
    });
  }

  // privacyAccepted is optional - removed validation

  // Validate shipping address if different
  if (data.shipToDifferentAddress) {
    if (!data.shippingStreet || data.shippingStreet.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shipping street address is required',
        path: ['shippingStreet']
      });
    }
    if (!data.shippingCity || data.shippingCity.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shipping city is required',
        path: ['shippingCity']
      });
    }
    if (!data.shippingPostalCode || data.shippingPostalCode.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shipping postal code is required',
        path: ['shippingPostalCode']
      });
    }
    if (!data.shippingCountry || data.shippingCountry.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shipping country is required',
        path: ['shippingCountry']
      });
    }
  }

  // Validate B2B fields if company
  if (data.isCompany) {
    if (!data.companyName || data.companyName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Company name is required',
        path: ['companyName']
      });
    }
    if (!data.companyId || data.companyId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Company ID (IČO) is required',
        path: ['companyId']
      });
    }
    if (!data.taxId || data.taxId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tax ID (DIČ) is required',
        path: ['taxId']
      });
    }
  }
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

/**
 * Step 1 validation (Information) - All contact and address fields
 */
export const checkoutStep1Schema = checkoutFormSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  billingStreet: true,
  billingCity: true,
  billingState: true,
  billingPostalCode: true,
  billingCountry: true,
  shipToDifferentAddress: true,
  shippingStreet: true,
  shippingCity: true,
  shippingState: true,
  shippingPostalCode: true,
  shippingCountry: true,
  isCompany: true,
  companyName: true,
  companyId: true,
  taxId: true,
  vatId: true,
  newsletterOptIn: true
}).superRefine((data, ctx) => {
  // Validate shipping address if different
  if (data.shipToDifferentAddress) {
    if (!data.shippingStreet || data.shippingStreet.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shipping street address is required',
        path: ['shippingStreet']
      });
    }
    if (!data.shippingCity || data.shippingCity.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shipping city is required',
        path: ['shippingCity']
      });
    }
    if (!data.shippingPostalCode || data.shippingPostalCode.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shipping postal code is required',
        path: ['shippingPostalCode']
      });
    }
    if (!data.shippingCountry || data.shippingCountry.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shipping country is required',
        path: ['shippingCountry']
      });
    }
  }

  // Validate B2B fields if company
  if (data.isCompany) {
    if (!data.companyName || data.companyName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Company name is required',
        path: ['companyName']
      });
    }
    if (!data.companyId || data.companyId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Company ID (IČO) is required',
        path: ['companyId']
      });
    }
    if (!data.taxId || data.taxId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tax ID (DIČ) is required',
        path: ['taxId']
      });
    }
  }
});

export type CheckoutStep1FormData = z.infer<typeof checkoutStep1Schema>;

// ===== HELPER FUNCTIONS =====

/**
 * Sanitize input string
 * - Trim whitespace
 * - Remove potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Format phone number to Slovak format
 * @param phone - Phone number in any format
 * @returns Formatted phone number in +421XXXXXXXXX format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If starts with 0, replace with +421
  if (digits.startsWith('0')) {
    return `+421${digits.substring(1)}`;
  }

  // If starts with 421, add +
  if (digits.startsWith('421')) {
    return `+${digits}`;
  }

  // If already has country code
  if (digits.startsWith('+')) {
    return digits;
  }

  // Default: assume Slovak number without prefix
  return `+421${digits}`;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with strength level and feedback
 */
export function validatePasswordStrength(password: string): {
  level: 'weak' | 'medium' | 'strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let strength = 0;

  // Length check
  if (password.length >= 8) {
    strength += 1;
  } else {
    feedback.push('Heslo by malo mať aspoň 8 znakov');
  }

  if (password.length >= 12) {
    strength += 1;
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('Pridajte aspoň jedno veľké písmeno');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('Pridajte aspoň jedno malé písmeno');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('Pridajte aspoň jedno číslo');
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('Pridajte aspoň jeden špeciálny znak');
  }

  // Determine level
  let level: 'weak' | 'medium' | 'strong' = 'weak';
  if (strength >= 5) {
    level = 'strong';
  } else if (strength >= 3) {
    level = 'medium';
  }

  return { level, feedback };
}
