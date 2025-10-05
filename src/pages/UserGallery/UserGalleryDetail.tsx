import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userGalleryService } from '../../services/userGalleryService';
import { useAuth } from '../../context/useAuth';
import Lightbox from './Lightbox';
import type { UserProfile, PublicModel, PublicPhoto } from '../../types/userGallery';
import './UserGalleryDetail.css';

const UserGalleryDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation('gallery');
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // State
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [models, setModels] = useState<PublicModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<PublicPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Fetch user gallery
  const fetchUserGallery = useCallback(async () => {
    if (!userId) {
      setError('Invalid user ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await userGalleryService.getUserGallery(parseInt(userId, 10));
      setUserData(data.user);
      setModels(data.models);
    } catch (err) {
      console.error('Error fetching user gallery:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user gallery');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserGallery();
  }, [fetchUserGallery]);

  // Handle like photo
  const handleLikePhoto = async (photoId: number, isLiked: boolean) => {
    if (!currentUser) {
      alert(t('errors.login_required', 'Please log in to like photos'));
      return;
    }

    try {
      const response = isLiked
        ? await userGalleryService.unlikePhoto(photoId)
        : await userGalleryService.likePhoto(photoId);

      // Update local state
      setModels(prevModels =>
        prevModels.map(model => ({
          ...model,
          photos: model.photos.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  likes_count: response.likes_count,
                  is_liked_by_user: response.is_liked
                }
              : photo
          )
        }))
      );

      // Update lightbox photos if open
      if (lightboxOpen) {
        setLightboxPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  likes_count: response.likes_count,
                  is_liked_by_user: response.is_liked
                }
              : photo
          )
        );
      }
    } catch (err) {
      console.error('Error liking photo:', err);
      alert(err instanceof Error ? err.message : 'Failed to like photo');
    }
  };

  // Open lightbox with photos from specific model
  const openLightbox = (photos: PublicPhoto[], startIndex: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  // Close lightbox
  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get avatar placeholder
  const getAvatarPlaceholder = () => {
    return userData?.username?.charAt(0).toUpperCase() || '?';
  };

  // Loading state
  if (loading) {
    return (
      <div className="user-gallery-detail">
        <div className="detail-loading">
          <div className="loading-spinner"></div>
          <p>{t('loading.title', 'Loading gallery...')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !userData) {
    return (
      <div className="user-gallery-detail">
        <div className="detail-error">
          <div className="error-icon">⚠️</div>
          <h3>{t('errors.user_not_found', 'User not found')}</h3>
          <p>{error || t('errors.user_no_public', 'This user has no public galleries')}</p>
          <button onClick={() => navigate('/gallery')} className="back-to-gallery-btn">
            {t('back_to_gallery', 'Back to Gallery')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-gallery-detail">
      {/* User Header */}
      <div className="user-header">
        <Link to="/gallery" className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          {t('back_to_gallery', 'Back to Gallery')}
        </Link>

        <div className="user-profile">
          <div className="user-avatar-large">
            {userData.avatar_url ? (
              <img
                src={userData.avatar_url}
                alt={userData.username}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`avatar-placeholder-large ${userData.avatar_url ? 'hidden' : ''}`}>
              {getAvatarPlaceholder()}
            </div>
          </div>

          <div className="user-meta">
            <h1>{userData.username}</h1>
            <p className="member-since">
              {t('member_since').replace('{{date}}', formatDate(userData.member_since))}
            </p>
            <div className="user-stats-detail">
              <span>
                <strong>{userData.total_public_models}</strong> {t('stats.models', 'models')}
              </span>
              <span className="divider">•</span>
              <span>
                <strong>{userData.total_public_photos}</strong> {t('stats.photos', 'photos')}
              </span>
              {userData.total_likes !== undefined && userData.total_likes > 0 && (
                <>
                  <span className="divider">•</span>
                  <span>
                    <strong>{userData.total_likes}</strong> {t('stats.likes', 'likes')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Models with Photos */}
      {models.length === 0 ? (
        <div className="no-models">
          <p>{t('empty.no_models', 'No public models yet')}</p>
        </div>
      ) : (
        <div className="models-section">
          {models.map(model => (
            <div key={model.product_id} className="model-section">
              <div className="model-section-header">
                <h2>{model.product_name}</h2>
                {model.is_completed && (
                  <span className="completed-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {t('completed', 'Completed')}
                  </span>
                )}
                <span className="photo-count">
                  {model.photo_count} {t('photos', 'photos')}
                </span>
              </div>

              {/* Photo Grid */}
              <div className="photos-grid">
                {model.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="photo-item"
                    onClick={() => openLightbox(model.photos, index)}
                  >
                    <img
                      src={photo.thumbnail_url}
                      alt={`${model.product_name} - ${index + 1}`}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />

                    {/* Like button overlay - always visible */}
                    <div className="photo-overlay">
                      <button
                        className={`like-btn ${photo.is_liked_by_user ? 'liked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikePhoto(photo.id, photo.is_liked_by_user);
                        }}
                        disabled={!currentUser}
                        title={currentUser ? (photo.is_liked_by_user ? t('unlike', 'Unlike') : t('like', 'Like')) : t('errors.login_required', 'Login required')}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={photo.is_liked_by_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span>{photo.likes_count ?? 0}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {lightboxOpen && (
        <Lightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
          onLike={handleLikePhoto}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default UserGalleryDetail;
