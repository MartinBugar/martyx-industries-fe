/**
 * Password Strength Calculator
 * Matches backend validation logic for consistency
 */

export interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Medium' | 'Strong';
  color: string;
  percentage: number;
  requirements: {
    minLength: boolean;
    recommendedLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasDigit: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Calculate password strength
 * Returns detailed analysis of password quality
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;

  const requirements = {
    minLength: password.length >= 8,
    recommendedLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~;']/.test(password)
  };

  // Scoring logic (matches backend)
  if (requirements.minLength) score++;
  if (requirements.recommendedLength) score++;
  if (requirements.hasUppercase) score++;
  if (requirements.hasLowercase) score++;
  if (requirements.hasDigit) score++;
  if (requirements.hasSpecialChar) score++;

  let label: 'Weak' | 'Medium' | 'Strong';
  let color: string;

  if (score >= 5) {
    label = 'Strong';
    color = '#10b981'; // green
  } else if (score >= 3) {
    label = 'Medium';
    color = '#f59e0b'; // orange
  } else {
    label = 'Weak';
    color = '#ef4444'; // red
  }

  const percentage = Math.min((score / 6) * 100, 100);

  return {
    score,
    label,
    color,
    percentage,
    requirements
  };
};

/**
 * Check if password meets minimum requirements
 */
export const isPasswordAcceptable = (password: string): boolean => {
  const strength = calculatePasswordStrength(password);
  return strength.label === 'Medium' || strength.label === 'Strong';
};

/**
 * Get user-friendly feedback for password
 */
export const getPasswordFeedback = (password: string): string[] => {
  const { requirements } = calculatePasswordStrength(password);
  const feedback: string[] = [];

  if (!requirements.minLength) {
    feedback.push('Password must be at least 8 characters long');
  }
  if (!requirements.hasUppercase) {
    feedback.push('Include at least one uppercase letter (A-Z)');
  }
  if (!requirements.hasLowercase) {
    feedback.push('Include at least one lowercase letter (a-z)');
  }
  if (!requirements.hasDigit) {
    feedback.push('Include at least one number (0-9)');
  }
  if (!requirements.hasSpecialChar) {
    feedback.push('Include at least one special character (!@#$%^&*...)');
  }
  if (!requirements.recommendedLength) {
    feedback.push('For better security, use at least 12 characters');
  }

  return feedback;
};
