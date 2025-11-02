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
 * - Minimum 6 characters
 * - Required field
 */
export const passwordSchema = z
  .string()
  .min(6, { message: 'Heslo musí mať minimálne 6 znakov' });

/**
 * Phone number validation schema
 * - Slovak phone number format: +421XXXXXXXXX or 0XXXXXXXXX
 * - International formats also allowed
 */
export const phoneSchema = z
  .string()
  .min(1, { message: 'Telefónne číslo je povinné' })
  .regex(
    /^(\+421|0)?[0-9]{9}$/,
    { message: 'Neplatný formát telefónneho čísla (napr. +421901234567 alebo 0901234567)' }
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
 * Billing/Shipping address schema
 */
export const addressSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: 'Meno musí mať minimálne 2 znaky' })
    .max(50, { message: 'Meno môže mať maximálne 50 znakov' }),
  lastName: z
    .string()
    .min(2, { message: 'Priezvisko musí mať minimálne 2 znaky' })
    .max(50, { message: 'Priezvisko môže mať maximálne 50 znakov' }),
  email: emailSchema,
  phone: phoneSchema,
  street: z
    .string()
    .min(5, { message: 'Ulica musí mať minimálne 5 znakov' })
    .max(100, { message: 'Ulica môže mať maximálne 100 znakov' }),
  city: z
    .string()
    .min(2, { message: 'Mesto musí mať minimálne 2 znaky' })
    .max(100, { message: 'Mesto môže mať maximálne 100 znakov' }),
  postalCode: z
    .string()
    .min(5, { message: 'PSČ musí mať minimálne 5 znakov' })
    .max(10, { message: 'PSČ môže mať maximálne 10 znakov' })
    .regex(/^[0-9\s-]+$/, { message: 'PSČ môže obsahovať iba čísla, medzery a pomlčky' }),
  country: z
    .string()
    .min(2, { message: 'Krajina je povinná' })
    .max(100, { message: 'Krajina môže mať maximálne 100 znakov' })
});

export type AddressFormData = z.infer<typeof addressSchema>;

/**
 * Checkout form schema
 * - Billing address required
 * - Shipping address optional (if different from billing)
 * - Terms and conditions consent required
 * - Privacy policy consent required
 */
export const checkoutSchema = z.object({
  // Billing address
  billingAddress: addressSchema,

  // Shipping address (optional, used when different from billing)
  useDifferentShippingAddress: z.boolean().optional(),
  shippingAddress: addressSchema.optional(),

  // Legal consents
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Musíte súhlasiť s obchodnými podmienkami'
  }),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: 'Musíte súhlasiť so spracovaním osobných údajov'
  }),

  // Optional fields
  orderNotes: z.string().max(500, { message: 'Poznámka môže mať maximálne 500 znakov' }).optional()
}).refine((data) => {
  // If using different shipping address, it must be provided
  if (data.useDifferentShippingAddress && !data.shippingAddress) {
    return false;
  }
  return true;
}, {
  message: 'Dodacia adresa je povinná',
  path: ['shippingAddress']
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ===== PARTIAL SCHEMAS FOR MULTI-STEP FORMS =====

/**
 * Step 1: Billing info only
 */
export const billingStepSchema = z.object({
  billingAddress: addressSchema,
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Musíte súhlasiť s obchodnými podmienkami'
  }),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: 'Musíte súhlasiť so spracovaním osobných údajov'
  })
});

export type BillingStepFormData = z.infer<typeof billingStepSchema>;

/**
 * Step 2: Shipping info (if different from billing)
 */
export const shippingStepSchema = z.object({
  useDifferentShippingAddress: z.boolean(),
  shippingAddress: addressSchema.optional()
}).refine((data) => {
  if (data.useDifferentShippingAddress && !data.shippingAddress) {
    return false;
  }
  return true;
}, {
  message: 'Dodacia adresa je povinná',
  path: ['shippingAddress']
});

export type ShippingStepFormData = z.infer<typeof shippingStepSchema>;

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
