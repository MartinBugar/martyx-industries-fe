import React, { useEffect, useState } from 'react';
import { Gift, Lock, CheckCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { giftTierService, type GiftTierDTO } from '../../services/giftTierService';
import './GiftProgressBar.css';

interface GiftProgressBarProps {
  cartTotal: number;
  compact?: boolean; // New prop for compact mode
}

const GiftProgressBar: React.FC<GiftProgressBarProps> = ({ cartTotal, compact = false }) => {
  const [tiers, setTiers] = useState<GiftTierDTO[]>([]);
  const [currentTier, setCurrentTier] = useState<GiftTierDTO | null>(null);
  const [nextTier, setNextTier] = useState<GiftTierDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false); // For compact mode expansion

  useEffect(() => {
    loadTiers();
  }, []);

  useEffect(() => {
    if (tiers.length > 0) {
      updateProgress();
    }
  }, [cartTotal, tiers]);

  const loadTiers = async () => {
    try {
      const activeTiers = await giftTierService.getActiveGiftTiers();
      setTiers(activeTiers);
    } catch (error) {
      console.error('Failed to load gift tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async () => {
    try {
      const [applicable, next] = await Promise.all([
        giftTierService.getApplicableGift(cartTotal),
        giftTierService.getNextGift(cartTotal),
      ]);

      setCurrentTier(applicable);
      setNextTier(next);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  // Don't render if no tiers or still loading
  if (loading || tiers.length === 0) {
    return null;
  }

  // Calculate progress percentage for the next tier
  const getProgressPercentage = (): number => {
    if (!nextTier) {
      return 100; // All tiers unlocked
    }

    const prevThreshold = currentTier?.thresholdAmount || 0;
    const range = nextTier.thresholdAmount - prevThreshold;
    const progress = cartTotal - prevThreshold;

    return Math.min(Math.max((progress / range) * 100, 0), 100);
  };

  const getAmountToNextTier = (): number => {
    if (!nextTier) return 0;
    return Math.max(nextTier.thresholdAmount - cartTotal, 0);
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const progressPercentage = getProgressPercentage();
  const amountToNext = getAmountToNextTier();

  // COMPACT MODE - for Order Summary
  if (compact) {
    return (
      <div className="gift-progress-compact">
        {/* Compact Header */}
        <div className="gift-compact-header">
          <div className="gift-compact-title">
            <Gift size={16} className="gift-icon-small" />
            <span>Progress to Gifts</span>
          </div>
        </div>

        {/* Compact Progress Bar */}
        {nextTier && (
          <div className="gift-compact-bar-wrapper">
            <div className="gift-compact-bar">
              <div
                className="gift-compact-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="gift-compact-percentage">{Math.round(progressPercentage)}%</span>
          </div>
        )}

        {/* Compact Message */}
        <div className="gift-compact-message">
          {nextTier && amountToNext > 0 ? (
            <p>
              {formatCurrency(amountToNext)} more to unlock <strong>{nextTier.name}</strong>
            </p>
          ) : !nextTier && currentTier ? (
            <p>
              🎉 Unlocked: <strong>{currentTier.name}</strong>
            </p>
          ) : nextTier && amountToNext === 0 ? (
            <p>
              🎉 Unlocked: <strong>{nextTier.name}</strong>
            </p>
          ) : null}
        </div>

        {/* Expandable Tiers List */}
        <button
          className="gift-compact-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span>View all tiers</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isExpanded && (
          <div className="gift-compact-tiers">
            {tiers.map((tier) => {
              const isUnlocked = cartTotal >= tier.thresholdAmount;
              const isCurrent = currentTier?.id === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`gift-compact-tier ${isUnlocked ? 'unlocked' : ''} ${
                    isCurrent ? 'current' : ''
                  }`}
                >
                  <div className="compact-tier-icon">
                    {isUnlocked ? (
                      <CheckCircle className="icon-unlocked" size={16} />
                    ) : (
                      <Lock className="icon-locked" size={16} />
                    )}
                  </div>
                  <div className="compact-tier-content">
                    <div className="compact-tier-name">{tier.name}</div>
                    <div className="compact-tier-threshold">
                      {formatCurrency(tier.thresholdAmount)}
                    </div>
                  </div>
                  {tier.imageUrl && (
                    <div className="compact-tier-image">
                      <img src={tier.imageUrl} alt={tier.name} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // FULL MODE - original design
  return (
    <div className="gift-progress-container">
      <div className="gift-progress-header">
        <Gift className="gift-icon" size={24} />
        <h3>Your Progress to Free Gifts</h3>
      </div>

      {/* Current Status */}
      <div className="gift-current-status">
        <div className="gift-current-amount">
          <span className="amount-label">Cart Total:</span>
          <span className="amount-value">{formatCurrency(cartTotal)}</span>
        </div>

        {nextTier && (
          <div className="gift-next-goal">
            <TrendingUp size={16} />
            <span>Next: {formatCurrency(nextTier.thresholdAmount)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {nextTier && (
        <>
          <div className="gift-progress-bar">
            <div
              className="gift-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            >
              <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
            </div>
          </div>

          <div className="gift-progress-message">
            {amountToNext > 0 ? (
              <p>
                <strong>Add {formatCurrency(amountToNext)} more</strong> to unlock{' '}
                <strong>{nextTier.name}</strong>!
              </p>
            ) : (
              <p>
                🎉 <strong>Congratulations!</strong> You've unlocked{' '}
                <strong>{currentTier?.name}</strong>!
              </p>
            )}
          </div>
        </>
      )}

      {!nextTier && currentTier && (
        <div className="gift-all-unlocked">
          <CheckCircle className="unlock-icon" size={20} />
          <p>
            🎉 <strong>Amazing!</strong> You've unlocked the highest tier:{' '}
            <strong>{currentTier.name}</strong>!
          </p>
        </div>
      )}

      {/* All Tiers List */}
      <div className="gift-tiers-list">
        {tiers.map((tier) => {
          const isUnlocked = cartTotal >= tier.thresholdAmount;
          const isCurrent = currentTier?.id === tier.id;
          const isNext = nextTier?.id === tier.id;

          return (
            <div
              key={tier.id}
              className={`gift-tier-item ${isUnlocked ? 'unlocked' : ''} ${
                isCurrent ? 'current' : ''
              } ${isNext ? 'next' : ''}`}
            >
              <div className="tier-icon">
                {isUnlocked ? (
                  <CheckCircle className="icon-unlocked" size={20} />
                ) : isNext ? (
                  <TrendingUp className="icon-next" size={20} />
                ) : (
                  <Lock className="icon-locked" size={20} />
                )}
              </div>

              <div className="tier-content">
                <div className="tier-name">{tier.name}</div>
                <div className="tier-threshold">
                  {formatCurrency(tier.thresholdAmount)}
                </div>
              </div>

              {tier.imageUrl && (
                <div className="tier-image">
                  <img src={tier.imageUrl} alt={tier.name} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GiftProgressBar;
