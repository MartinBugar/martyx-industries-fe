import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicPhoto } from '../../types/userGallery';
import type { User } from '../../context/authTypes';
import './Lightbox.css';

interface LightboxPhoto extends PublicPhoto {
  username?: string;
  user_id?: number;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onLike: (photoId: number, isLiked: boolean) => void;
  currentUser: User | null;
}

const Lightbox: React.FC<LightboxProps> = ({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  onLike,
  currentUser
}) => {
  const { t } = useTranslation('gallery');
  const currentPhoto = photos[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(photos.length - 1); // Loop to last
    }
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0); // Loop to first
    }
  }, [currentIndex, photos.length, onNavigate]);

  // Handle like
  const handleLike = () => {
    if (currentUser) {
      onLike(currentPhoto.id, currentPhoto.is_liked_by_user);
    }
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="lightbox-close-btn"
          onClick={onClose}
          aria-label={t('lightbox.close', 'Close')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Previous Button */}
        {photos.length > 1 && (
          <button
            className="lightbox-nav-btn lightbox-prev-btn"
            onClick={handlePrevious}
            aria-label={t('lightbox.previous', 'Previous')}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {/* Image Container */}
        <div className="lightbox-image-container">
          <img
            src={currentPhoto.cdn_url}
            alt={`Photo ${currentIndex + 1}`}
            className="lightbox-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = currentPhoto.thumbnail_url;
            }}
          />
        </div>

        {/* Image Info Footer */}
        <div className="lightbox-info">
          <div className="lightbox-counter">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Username in center */}
          {currentPhoto.username && (
            <div className="lightbox-username">
              {currentPhoto.username}
            </div>
          )}

          <div className="lightbox-actions">
            {/* Like Button */}
            <button
              className={`lightbox-like-btn ${currentPhoto.is_liked_by_user ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={!currentUser}
              title={currentUser ? (currentPhoto.is_liked_by_user ? t('unlike', 'Unlike') : t('like', 'Like')) : t('errors.login_required', 'Login required')}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={currentPhoto.is_liked_by_user ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>{currentPhoto.likes_count}</span>
            </button>

            {/* Future: Comments button */}
            {currentPhoto.comments_count !== undefined && currentPhoto.comments_count > 0 && (
              <button className="lightbox-comments-btn" disabled title={t('lightbox.comments_coming_soon', 'Comments coming soon')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>{currentPhoto.comments_count}</span>
              </button>
            )}
          </div>
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <button
            className="lightbox-nav-btn lightbox-next-btn"
            onClick={handleNext}
            aria-label={t('lightbox.next', 'Next')}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Lightbox;
