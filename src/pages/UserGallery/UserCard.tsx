import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PublicUser } from '../../types/userGallery';
import './UserCard.css';

interface UserCardProps {
  user: PublicUser;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const { t } = useTranslation('gallery');

  // Generate avatar placeholder from first letter of username
  const getAvatarPlaceholder = () => {
    return user.username?.charAt(0).toUpperCase() || '?';
  };

  return (
    <Link to={`/gallery/${user.user_id}`} className="user-card">
      {/* Avatar */}
      <div className="user-avatar">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`avatar-placeholder ${user.avatar_url ? 'hidden' : ''}`}>
          {getAvatarPlaceholder()}
        </div>
      </div>

      {/* User Info */}
      <div className="user-info">
        <h3 className="user-username">{user.username}</h3>
        <div className="user-stats">
          <span>{user.total_public_models} {t('card.models')}</span>
          <span className="divider">•</span>
          <span>{user.total_public_photos} {t('card.photos')}</span>
        </div>
        {user.total_likes !== undefined && user.total_likes > 0 && (
          <div className="user-likes">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="heart-icon"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>{user.total_likes}</span>
          </div>
        )}
      </div>

      {/* Photo Preview Grid (2x2 or up to 4 thumbnails) */}
      <div className="photo-preview-grid">
        {user.preview_photos && user.preview_photos.length > 0 ? (
          user.preview_photos.slice(0, 4).map((photo, index) => (
            <div key={index} className="preview-thumbnail">
              <img
                src={photo.thumbnail_url}
                alt={photo.product_name}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
              />
            </div>
          ))
        ) : (
          // Empty placeholders if no photos
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="preview-thumbnail empty">
              <div className="empty-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
                  <polyline points="21,15 16,10 5,21" strokeWidth="2"/>
                </svg>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Gallery Button */}
      <button className="view-gallery-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
        {t('card.view_gallery')}
      </button>
    </Link>
  );
};

export default UserCard;
