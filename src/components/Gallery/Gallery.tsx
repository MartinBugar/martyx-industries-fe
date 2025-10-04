import React, { useState } from 'react';
import './Gallery.css';
import OptimizedImage from '../OptimizedImage/OptimizedImage';
import { getImageSrcSet, getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '../../utils/cdnImages';
import { useImagePreload, useBatchImagePreload } from '../../hooks/useImagePreload';

interface GalleryProps {
  productName: string;
  images: string[];
}

const Gallery: React.FC<GalleryProps> = ({ productName, images }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Removed loaded state to prevent loading issues
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimeoutRef = React.useRef<number | null>(null);

  // Pre-compute optimized image URLs to avoid expensive calculations during navigation
  const optimizedImages = React.useMemo(() => {
    return images.map((image) => {
      const isCDNUrl = image.includes('digitaloceanspaces.com') || image.includes(import.meta.env.VITE_CDN_BASE || '');
      
      return {
        thumbnailSrc: isCDNUrl ? image : (isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(image), 800) : image),
        fullscreenSrc: isCDNUrl ? image : (isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(image), 1600) : image),
        srcSet: !isCDNUrl && isCDNEnabled() ? getImageSrcSet(getBaseNameFromPath(image)) : undefined,
        isCDNUrl
      };
    });
  }, [images]);

  // Debug: log received images
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🖼️ Gallery received images for', productName, ':', images.length, 'images');
      console.log('🔍 All image URLs:', images);
    }
  }, [images, productName]);

  // Preload obrázkov pomocou HTML link tags (rýchlejšie)
  const thumbnailUrls = React.useMemo(() => 
    optimizedImages.slice(0, 6).map(img => img.thumbnailSrc), 
    [optimizedImages]
  );
  
  useImagePreload(thumbnailUrls, 'high'); // High priority pre thumbnail obrázky
  
  // Batch preload zvyšných obrázkov
  const remainingUrls = React.useMemo(() => 
    optimizedImages.slice(6).map(img => img.thumbnailSrc), 
    [optimizedImages]
  );
  
  useBatchImagePreload(remainingUrls, 50); // Rýchlejší batch preload

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Removed loaded state management

  const openFullscreenGallery = (index: number) => {
    setCurrentImageIndex(index);
    setIsFullscreen(true);
    // Prevent scrolling when fullscreen gallery is open
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreenGallery = () => {
    setIsFullscreen(false);
    // Restore scrolling when fullscreen gallery is closed
    document.body.style.overflow = 'auto';
  };

  const navigateGallery = React.useCallback((direction: 'prev' | 'next') => {
    if (isNavigating || images.length <= 1) return;
    
    setIsNavigating(true);
    
    setCurrentImageIndex((prevIndex) => {
      if (direction === 'prev') {
        return prevIndex === 0 ? images.length - 1 : prevIndex - 1;
      } else {
        return prevIndex === images.length - 1 ? 0 : prevIndex + 1;
      }
    });

    // Clear previous timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Reset navigation lock after a short delay
    navigationTimeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
    }, 150);
  }, [images.length, isNavigating]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      
      if (e.key === 'Escape') {
        closeFullscreenGallery();
      } else if (e.key === 'ArrowLeft') {
        navigateGallery('prev');
      } else if (e.key === 'ArrowRight') {
        navigateGallery('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="product-gallery">
      <div className="gallery-thumbnails">
        {images.map((image, index) => (
          <div
            key={index}
            className="gallery-thumbnail"
            onClick={() => openFullscreenGallery(index)}
          >
            <OptimizedImage
              src={optimizedImages[index]?.thumbnailSrc || image}
              alt={`${productName} - Image ${index + 1}`}
              eager={true} // Všetky thumbnail obrázky sa načítajú okamžite
              className="gallery-thumbnail-image"
            />
          </div>
        ))}
      </div>

      {isFullscreen && (
        <div className="fullscreen-gallery">
          <div className="fullscreen-overlay" onClick={closeFullscreenGallery}></div>
          <div className="fullscreen-content">
            <button 
              className="gallery-close-btn" 
              onClick={closeFullscreenGallery}
              aria-label="Close gallery"
            >
              &times;
            </button>
            <button 
              className={`gallery-nav-btn prev-btn ${isNavigating ? 'disabled' : ''}`}
              onClick={() => navigateGallery('prev')}
              disabled={isNavigating || images.length <= 1}
              aria-label="Previous image"
            >
              &#10094;
            </button>
            <div className="fullscreen-image-container">
              <OptimizedImage
                src={optimizedImages[currentImageIndex]?.fullscreenSrc || images[currentImageIndex]}
                alt={`${productName} - Image ${currentImageIndex + 1}`}
                className="fullscreen-image"
                priority={true} // Fullscreen obrázok má vždy prioritu
              />
              <div className="image-counter">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
            <button 
              className={`gallery-nav-btn next-btn ${isNavigating ? 'disabled' : ''}`}
              onClick={() => navigateGallery('next')}
              disabled={isNavigating || images.length <= 1}
              aria-label="Next image"
            >
              &#10095;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;