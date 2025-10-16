import React from 'react';
import { calculatePasswordStrength } from '../../utils/passwordStrength';
import './PasswordStrengthIndicator.css';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

/**
 * Password Strength Indicator Component
 * Visual feedback for password quality
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true
}) => {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);

  return (
    <div className="password-strength-indicator">
      <div className="strength-bar-container">
        <div
          className="strength-bar"
          style={{
            width: `${strength.percentage}%`,
            backgroundColor: strength.color
          }}
        />
      </div>

      <div className="strength-label" style={{ color: strength.color }}>
        Password Strength: {strength.label}
      </div>

      {showRequirements && (
        <div className="requirements-list">
          <RequirementItem
            met={strength.requirements.minLength}
            text="At least 8 characters"
          />
          <RequirementItem
            met={strength.requirements.hasUppercase}
            text="Contains uppercase letter"
          />
          <RequirementItem
            met={strength.requirements.hasLowercase}
            text="Contains lowercase letter"
          />
          <RequirementItem
            met={strength.requirements.hasDigit}
            text="Contains number"
          />
          <RequirementItem
            met={strength.requirements.hasSpecialChar}
            text="Contains special character"
          />
          <RequirementItem
            met={strength.requirements.recommendedLength}
            text="At least 12 characters (recommended)"
            optional
          />
        </div>
      )}
    </div>
  );
};

const RequirementItem: React.FC<{ met: boolean; text: string; optional?: boolean }> = ({
  met,
  text,
  optional = false
}) => (
  <div className={`requirement-item ${met ? 'met' : 'unmet'} ${optional ? 'optional' : ''}`}>
    <span className="requirement-icon">{met ? '✓' : '○'}</span>
    <span className="requirement-text">{text}</span>
  </div>
);

export default PasswordStrengthIndicator;
