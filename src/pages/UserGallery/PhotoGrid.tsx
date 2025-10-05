import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PublicPhotoWithUser } from '../../types/userGallery';
import './PhotoGrid.css';

interface PhotoGridProps {
  photos: PublicPhotoWithUser[];
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos }) => {
  const { t } = useTranslation('gallery');
  const [selectedPhoto, setSelectedPhoto] = useState<PublicPhotoWithUser | null>(null);

  const openLightbox = (photo: PublicPhotoWithUser) => {
    setSelectedPhoto(photo);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    document.body.style.overflow = 'auto';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="photo-card"
            onClick={() => openLightbox(photo)}
          >
            <img
              src={photo.cdn_url}
              alt={photo.product_name}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.png';
              }}
            />
            <div className="photo-overlay">
              <div className="photo-info">
                <Link
                  to={`/gallery/${photo.user_id}`}
                  className="photo-username"
                  onClick={(e) => e.stopPropagation()}
                >
                  {photo.username}
                </Link>
                <span className="photo-product">{photo.product_name}</span>
              </div>
              <div className="photo-likes">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span>{photo.likes_count ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <img
              src={selectedPhoto.cdn_url}
              alt={selectedPhoto.product_name}
            />

            <div className="lightbox-info">
              <div className="lightbox-user">
                <Link
                  to={`/gallery/${selectedPhoto.user_id}`}
                  className="lightbox-username"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  {selectedPhoto.username}
                </Link>
                <span className="lightbox-product">{selectedPhoto.product_name}</span>
              </div>
              <div className="lightbox-stats">
                <div className="lightbox-date">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {formatDate(selectedPhoto.upload_date)}
                </div>
                <div className="lightbox-likes">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {selectedPhoto.likes_count ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGrid;
