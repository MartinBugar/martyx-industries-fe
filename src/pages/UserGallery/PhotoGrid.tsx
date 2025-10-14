import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';
import type { PublicPhotoWithUser } from '../../types/userGallery';
import { userGalleryService } from '../../services/userGalleryService';
import Lightbox from './Lightbox';
import './PhotoGrid.css';

interface PhotoGridProps {
  photos: PublicPhotoWithUser[];
  onPhotoLikeChange?: (photoId: number, isLiked: boolean, newLikesCount: number) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onPhotoLikeChange }) => {
  const { t } = useTranslation('gallery');
  const { user: currentUser } = useAuth();
  const [localPhotos, setLocalPhotos] = useState<PublicPhotoWithUser[]>(photos);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  // Sync local photos with props
  React.useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  // Handle like/unlike
  const handleLike = async (photoId: number, isLiked: boolean) => {
    if (!currentUser) {
      alert(t('errors.login_required', 'You must be logged in to like photos'));
      return;
    }

    try {
      const response = isLiked
        ? await userGalleryService.unlikePhoto(photoId)
        : await userGalleryService.likePhoto(photoId);

      // Update local state
      const updatePhoto = (photo: PublicPhotoWithUser) => {
        if (photo.id === photoId) {
          return {
            ...photo,
            is_liked_by_user: response.is_liked,
            likes_count: response.likes_count
          };
        }
        return photo;
      };

      setLocalPhotos(prev => prev.map(updatePhoto));

      // Notify parent component
      if (onPhotoLikeChange) {
        onPhotoLikeChange(photoId, response.is_liked, response.likes_count);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert(t('errors.like_failed', 'Failed to like photo. Please try again.'));
    }
  };

  // Convert PublicPhotoWithUser to LightboxPhoto
  const convertToLightboxPhoto = (photo: PublicPhotoWithUser) => ({
    id: photo.id,
    cdn_url: photo.cdn_url,
    thumbnail_url: photo.thumbnail_url,
    upload_date: photo.upload_date,
    is_liked_by_user: photo.is_liked_by_user,
    likes_count: photo.likes_count,
    comments_count: 0,
    username: photo.username,
    user_id: photo.user_id
  });

  if (photos.length === 0) {
    return (
      <div className="photos-empty">
        <p>{t('photos.empty', 'No photos yet')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="photos-grid">
        {localPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="photo-item"
            onClick={() => openLightbox(index)}
          >
            <img
              src={photo.thumbnail_url || photo.cdn_url}
              alt={photo.product_name}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = photo.cdn_url || '/placeholder-image.png';
              }}
            />
            <div className="photo-overlay">
              <button
                className={`like-btn ${photo.is_liked_by_user ? 'liked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(photo.id, photo.is_liked_by_user);
                }}
                disabled={!currentUser}
                title={currentUser ? (photo.is_liked_by_user ? t('actions.unlike', 'Unlike') : t('actions.like', 'Like')) : t('errors.login_required', 'Login required')}
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

      {/* Fullscreen Lightbox */}
      {lightboxOpen && (
        <Lightbox
          photos={localPhotos.map(convertToLightboxPhoto)}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
          onLike={handleLike}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default PhotoGrid;
