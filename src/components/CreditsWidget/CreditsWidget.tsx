/**
 * Credits Widget Component
 *
 * Allows users to apply their referral credits during checkout
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userCreditsService, type UserCreditDto } from '../../services/referralService';
import { useAuth } from '../../context/useAuth';
import './CreditsWidget.css';
import { logError } from '../../services/logger';

interface CreditsWidgetProps {
  orderTotal: number;
  onCreditsApplied: (amount: number) => void;
  disabled?: boolean;
}

const CreditsWidget: React.FC<CreditsWidgetProps> = ({ orderTotal, onCreditsApplied, disabled = false }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const [credits, setCredits] = useState<UserCreditDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [creditsToApply, setCreditsToApply] = useState<string>('');
  const [appliedAmount, setAppliedAmount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      loadCredits();
    }
  }, [isAuthenticated]);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const data = await userCreditsService.getBalance();
      setCredits(data);
    } catch (error) {
      logError('Failed to load credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCredits = () => {
    setError('');

    const amount = parseFloat(creditsToApply);

    // Validation
    if (isNaN(amount) || amount <= 0) {
      setError(t('credits.error.invalidAmount'));
      return;
    }

    if (!credits || amount > credits.creditBalance) {
      setError(t('credits.error.insufficientBalance'));
      return;
    }

    if (amount > orderTotal - appliedAmount) {
      setError(t('credits.error.exceedsTotal'));
      return;
    }

    // Apply credits
    setAppliedAmount(appliedAmount + amount);
    onCreditsApplied(amount);
    setCreditsToApply('');
    setExpanded(false);
  };

  const handleApplyMax = () => {
    if (!credits) return;

    const maxApplicable = Math.min(
      credits.creditBalance,
      orderTotal - appliedAmount
    );

    setCreditsToApply(maxApplicable.toFixed(2));
  };

  const handleRemoveCredits = () => {
    setAppliedAmount(0);
    onCreditsApplied(-appliedAmount);
    setCreditsToApply('');
    setError('');
  };

  // Don't show widget if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't show if no credits available
  if (!loading && credits && credits.creditBalance <= 0) {
    return null;
  }

  return (
    <div className={`credits-widget ${expanded ? 'expanded' : ''} ${disabled ? 'disabled' : ''}`}>
      {/* Collapsed State */}
      {!expanded && (
        <div className="credits-header" onClick={() => !disabled && setExpanded(true)}>
          <div className="credits-icon">💰</div>
          <div className="credits-info">
            <h4>{t('credits.title')}</h4>
            {loading ? (
              <p>{t('common.loading')}</p>
            ) : (
              <p>
                {t('credits.availableBalance')}: <strong>€{credits?.creditBalance.toFixed(2) || '0.00'}</strong>
              </p>
            )}
          </div>
          {appliedAmount > 0 ? (
            <div className="applied-badge">
              -€{appliedAmount.toFixed(2)}
            </div>
          ) : (
            <div className="expand-arrow">›</div>
          )}
        </div>
      )}

      {/* Expanded State */}
      {expanded && (
        <div className="credits-expanded">
          <div className="credits-header-expanded">
            <h4>{t('credits.applyCredits')}</h4>
            <button
              className="close-btn"
              onClick={() => setExpanded(false)}
              aria-label={t('common.close')}
            >
              ×
            </button>
          </div>

          <div className="credits-balance">
            <div className="balance-item">
              <span>{t('credits.available')}:</span>
              <span className="balance-amount">€{credits?.creditBalance.toFixed(2) || '0.00'}</span>
            </div>
            {credits && credits.pendingBalance > 0 && (
              <div className="balance-item pending">
                <span>{t('credits.pending')}:</span>
                <span className="balance-amount">€{credits.pendingBalance.toFixed(2)}</span>
              </div>
            )}
          </div>

          {appliedAmount > 0 && (
            <div className="applied-credits">
              <div className="applied-info">
                <span>{t('credits.appliedCredits')}:</span>
                <span className="applied-amount">-€{appliedAmount.toFixed(2)}</span>
              </div>
              <button
                className="remove-btn"
                onClick={handleRemoveCredits}
              >
                {t('credits.remove')}
              </button>
            </div>
          )}

          <div className="credits-form">
            <div className="input-group">
              <span className="currency-symbol">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={credits?.creditBalance || 0}
                value={creditsToApply}
                onChange={(e) => setCreditsToApply(e.target.value)}
                placeholder="0.00"
                className="credits-input"
                disabled={disabled}
              />
              <button
                className="max-btn"
                onClick={handleApplyMax}
                disabled={disabled}
              >
                {t('credits.max')}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              className="apply-btn"
              onClick={handleApplyCredits}
              disabled={!creditsToApply || disabled}
            >
              {t('credits.apply')}
            </button>
          </div>

          <div className="credits-info-text">
            <p>{t('credits.infoText')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsWidget;
