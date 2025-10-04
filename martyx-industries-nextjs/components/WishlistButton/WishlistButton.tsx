'use client';

import React, { useState } from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/useAuth';
import './WishlistButton.css';

interface WishlistButtonProps {
  productId: string | number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button' | 'text';
  className?: string;
  showTooltip?: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  size = 'medium',
  variant = 'icon',
  className = '',
  showTooltip = true
}) => {
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist, error, clearError } = useWishlist();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const inWishlist = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

    setIsProcessing(true);
    clearError();

    try {
      if (inWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (err) {
      console.error('Wishlist operation failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getIcon = () => {
    if (isProcessing) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" className="wishlist-spinner">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="31.416" strokeDashoffset="31.416">
            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
          </circle>
        </svg>
      );
    }

    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={inWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    );
  };

  const getTooltipText = () => {
    if (!isAuthenticated) return 'Login to add to wishlist';
    if (isProcessing) return inWishlist ? 'Removing...' : 'Adding...';
    return inWishlist ? 'Remove from wishlist' : 'Add to wishlist';
  };

  const baseClass = `wishlist-button wishlist-button--${variant} wishlist-button--${size}`;
  const stateClass = inWishlist ? 'wishlist-button--active' : '';
  const processingClass = isProcessing ? 'wishlist-button--processing' : '';

  if (variant === 'text') {
    return (
      <button
        type="button"
        className={`${baseClass} ${stateClass} ${processingClass} ${className}`}
        onClick={handleClick}
        disabled={isProcessing}
        title={showTooltip ? getTooltipText() : undefined}
        aria-label={getTooltipText()}
      >
        {getIcon()}
        <span className="wishlist-button-text">
          {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
        </span>

        {showLoginPrompt && (
          <div className="wishlist-login-prompt">
            Please login to use wishlist
          </div>
        )}

        {error && (
          <div className="wishlist-error-tooltip">
            {error}
          </div>
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        className={`${baseClass} ${stateClass} ${processingClass} ${className}`}
        onClick={handleClick}
        disabled={isProcessing}
        title={showTooltip ? getTooltipText() : undefined}
        aria-label={getTooltipText()}
      >
        {getIcon()}
        <span className="wishlist-button-text">
          {isProcessing ? (inWishlist ? 'Removing...' : 'Adding...') : (inWishlist ? 'Remove' : 'Add to Wishlist')}
        </span>

        {showLoginPrompt && (
          <div className="wishlist-login-prompt">
            Please login to use wishlist
          </div>
        )}

        {error && (
          <div className="wishlist-error-tooltip">
            {error}
          </div>
        )}
      </button>
    );
  }

  // Icon variant (default)
  return (
    <button
      type="button"
      className={`${baseClass} ${stateClass} ${processingClass} ${className}`}
      onClick={handleClick}
      disabled={isProcessing}
      title={showTooltip ? getTooltipText() : undefined}
      aria-label={getTooltipText()}
    >
      {getIcon()}

      {showLoginPrompt && (
        <div className="wishlist-login-prompt">
          Please login to use wishlist
        </div>
      )}

      {error && (
        <div className="wishlist-error-tooltip">
          {error}
        </div>
      )}
    </button>
  );
};

export default WishlistButton;
