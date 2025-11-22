import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthToken } from '../../utils/tokenUtils';
import { API_BASE_URL } from '../../services/apiUtils';
import { logInfo, logWarn, logError } from '../../services/logger';
import './ModelPhotoGallery.css';

interface ModelPhoto {
  id: number;
  originalFilename: string;
  fileName: string;
  fileSize: number;
  cdnUrl: string;
  thumbnailUrl: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  uploadDate: string;
  productId: string;
  productName: string;
}

interface PurchasedModel {
  order_id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  purchase_date: string;
  order_status: string;
  quantity: number;
  price: number;
  currency?: string;
  photos: ModelPhoto[];
  can_upload: boolean;
  max_photos: number;
}

interface ModelPhotoGalleryProps {
  model: PurchasedModel;
  onClose: () => void;
  onPhotoDeleted?: (photoId: number) => void;
}

const ModelPhotoGallery: React.FC<ModelPhotoGalleryProps> = ({ model, onClose, onPhotoDeleted }) => {
  const { t } = useTranslation('collection');
  const [photos, setPhotos] = useState<ModelPhoto[]>(model.photos || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ModelPhoto | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const navigationTimeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    // If model already has photos, use them, otherwise fetch
    if (model.photos && model.photos.length > 0) {
      logInfo('Using photos from model:', model.photos);
      setPhotos(model.photos);
      setLoading(false);
    } else {
      logInfo('No photos in model, fetching from API...');
      fetchPhotos();
    }
  }, [model.product_id, model.photos]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get auth token using utility function
      const token = getAuthToken();
      if (!token) {
        throw new Error('Nie ste prihlásený');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/user-photos/${model.product_id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Nepodarilo sa načítať fotky');
      }

      const data = await response.json();
      logInfo('Gallery API Response:', data);
      logInfo('Photos from response:', data.data?.photos || data.photos);
      
      // Try different possible structures
      const photos = data.data?.photos || data.photos || [];
      logInfo('Setting photos:', photos);
      setPhotos(photos);
    } catch (err: any) {
      logError('Error fetching photos:', err);
      setError(err.message || 'Nepodarilo sa načítať fotky');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // Don't show badge for approved photos (default state)
    if (status === 'approved') {
      return null;
    }
    
    const statusConfig = {
      pending: { text: 'Čaká na schválenie', class: 'status-pending' },
      rejected: { text: 'Zamietnuté', class: 'status-rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    
    // Fallback for unknown status (but not approved)
    if (!config) {
      return <span className="status-badge status-unknown">{status || t('gallery.unknown_status', 'Neznámy stav')}</span>;
    }
    
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openLightbox = (photo: ModelPhoto) => {
    const index = photos.findIndex(p => p.id === photo.id);
    setCurrentImageIndex(index);
    setSelectedPhoto(photo);
    // Prevent scrolling when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    // Restore scrolling when lightbox is closed
    document.body.style.overflow = 'auto';
  };

  const navigatePhoto = React.useCallback((direction: 'prev' | 'next') => {
    if (isNavigating || photos.length <= 1) return;
    
    setIsNavigating(true);
    
    setCurrentImageIndex((prevIndex) => {
      const newIndex = direction === 'prev' 
        ? (prevIndex === 0 ? photos.length - 1 : prevIndex - 1)
        : (prevIndex === photos.length - 1 ? 0 : prevIndex + 1);
      
      // Update selected photo
      setSelectedPhoto(photos[newIndex]);
      return newIndex;
    });

    // Clear previous timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Reset navigation lock after a short delay
    navigationTimeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
    }, 150);
  }, [photos, isNavigating]);

  const deletePhoto = async (photoId: number) => {
    if (!window.confirm('Naozaj chcete zmazať túto fotku?')) {
      return;
    }

    setDeletingPhotoId(photoId);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Nie ste prihlásený');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/user-photos/${photoId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 500) {
          logWarn(`Backend endpoint DELETE /api/user-photos/${photoId} not implemented yet`);
          
          // Mock delete for testing
          if (import.meta.env.VITE_MOCK_DELETES === 'true') {
            logInfo('🎭 Mock mode - simulating photo delete');
            setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));

            // Notify parent component
            if (onPhotoDeleted) {
              onPhotoDeleted(photoId);
            }

            // If deleted photo was selected in lightbox, close it
            if (selectedPhoto && selectedPhoto.id === photoId) {
              closeLightbox();
            }

            return;
          }
          
          throw new Error('Backend endpoint pre mazanie fotiek nie je implementovaný. Kontaktujte backend developera.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Nepodarilo sa zmazať fotku');
      }

      // Remove photo from local state
      setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));

      // Notify parent component
      if (onPhotoDeleted) {
        onPhotoDeleted(photoId);
      }

      // If deleted photo was selected in lightbox, close it
      if (selectedPhoto && selectedPhoto.id === photoId) {
        closeLightbox();
      }

      logInfo('Photo deleted successfully');
    } catch (err: any) {
      logError('Error deleting photo:', err);
      alert(err.message || 'Nepodarilo sa zmazať fotku. Skúste to znovu.');
    } finally {
      setDeletingPhotoId(null);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        navigatePhoto('prev');
      } else if (e.key === 'ArrowRight') {
        navigatePhoto('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPhoto, navigatePhoto]);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="photo-gallery-modal" onClick={(e) => e.stopPropagation()}>
          <div className="gallery-header">
            <div className="gallery-title">
              <h3>{model.product_name}</h3>
              <p>{t('gallery.title')}</p>
            </div>
            <button className="close-button" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="gallery-content">
            {loading && (
              <div className="gallery-loading">
                <div className="loading-spinner"></div>
                <p>{t('loading.photos')}</p>
              </div>
            )}

            {error && (
              <div className="gallery-error">
                <div className="error-icon">⚠️</div>
                <h4>{t('gallery.load_error', 'Chyba pri načítaní')}</h4>
                <p>{error}</p>
                <button onClick={fetchPhotos} className="retry-button">
                  {t('actions.retry')}
                </button>
              </div>
            )}

            {!loading && !error && photos.length === 0 && (
              <div className="gallery-empty">
                <div className="empty-icon">📷</div>
                <h4>{t('gallery.no_photos')}</h4>
                <p>{t('gallery.no_photos_description', 'Pre tento model ste ešte nenahrali žiadne fotky.')}</p>
              </div>
            )}

            {!loading && !error && photos.length > 0 && (
              <div className="photos-grid">
              {photos.map((photo) => (
                <div key={photo.id} className="photo-card">
                  <div className="photo-image" onClick={() => openLightbox(photo)}>
                    <img 
                      src={photo.thumbnailUrl || photo.cdnUrl} 
                      alt={photo.originalFilename}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />
                    <div className="photo-overlay">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      className="delete-photo-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto(photo.id);
                      }}
                      disabled={deletingPhotoId === photo.id}
                      title="Zmazať fotku"
                    >
                      {deletingPhotoId === photo.id ? (
                        <div className="delete-spinner"></div>
                      ) : (
                        <span className="delete-cross">×</span>
                      )}
                    </button>
                  </div>
                  <div className="photo-info">
                    <div className="photo-meta">
                      <span className="photo-name">{photo.originalFilename}</span>
                      <span className="photo-size">{formatFileSize(photo.fileSize)}</span>
                    </div>
                    <div className="photo-status">
                      {getStatusBadge(photo.verificationStatus)}
                    </div>
                    <div className="photo-date">
                      {formatDate(photo.uploadDate)}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox - Product Detail Gallery Style - Outside modal */}
      {selectedPhoto && (
        <div className="fullscreen-gallery">
          <div className="fullscreen-overlay" onClick={closeLightbox}></div>
          <div className="fullscreen-content">
            <button 
              className="gallery-close-btn" 
              onClick={closeLightbox}
              aria-label="Close gallery"
            >
              &times;
            </button>
            
            <button 
              className={`gallery-nav-btn prev-btn ${isNavigating ? 'disabled' : ''}`}
              onClick={() => navigatePhoto('prev')}
              disabled={isNavigating || photos.length <= 1}
              aria-label="Previous image"
            >
              &#10094;
            </button>
            
            <div className="fullscreen-image-container">
              <img
                src={selectedPhoto.cdnUrl}
                alt={selectedPhoto.originalFilename}
                className="fullscreen-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
              />
              <div className="image-counter">
                {currentImageIndex + 1} / {photos.length}
              </div>
            </div>
            
            <button 
              className={`gallery-nav-btn next-btn ${isNavigating ? 'disabled' : ''}`}
              onClick={() => navigatePhoto('next')}
              disabled={isNavigating || photos.length <= 1}
              aria-label="Next image"
            >
              &#10095;
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ModelPhotoGallery;
