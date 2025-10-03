'use client';

import React, { useState } from 'react';
import styles from './Gallery.module.css';
import { getImageSrcSet, getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '@/lib/utils/cdnImages';

interface GalleryProps {
  productName: string;
  images: string[];
}

const Gallery: React.FC<GalleryProps> = ({ productName, images }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const imgRefs = React.useRef<(HTMLImageElement | null)[]>([]);
  const navigationTimeoutRef = React.useRef<number | null>(null);

  // Pre-compute optimized image URLs to avoid expensive calculations during navigation
  const optimizedImages = React.useMemo(() => {
    return images.map((image) => {
      const isCDNUrl = image.includes('digitaloceanspaces.com') || image.includes(process.env.NEXT_PUBLIC_CDN_BASE || '');

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
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ Gallery received images for', productName, ':', images);
      console.log('🔍 First 3 image URLs:', images.slice(0, 3));
    }
  }, [images, productName]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

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
  }, [isFullscreen, navigateGallery]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={styles.productGallery}>
      <div className={styles.galleryThumbnails}>
        {images.map((image, index) => (
          <div
            key={index}
            className={styles.galleryThumbnail}
            onClick={() => openFullscreenGallery(index)}
          >
            <img
              ref={(el) => { imgRefs.current[index] = el; }}
              src={optimizedImages[index]?.thumbnailSrc || image}
              srcSet={optimizedImages[index]?.srcSet}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 200px"
              alt={`${productName} - Image ${index + 1}`}
              decoding="async"
              loading="eager"
            />
          </div>
        ))}
      </div>

      {isFullscreen && (
        <div className={styles.fullscreenGallery}>
          <div className={styles.fullscreenOverlay} onClick={closeFullscreenGallery}></div>
          <div className={styles.fullscreenContent}>
            <button
              className={styles.galleryCloseBtn}
              onClick={closeFullscreenGallery}
              aria-label="Close gallery"
            >
              &times;
            </button>
            <button
              className={`${styles.galleryNavBtn} ${styles.prevBtn} ${isNavigating ? styles.disabled : ''}`}
              onClick={() => navigateGallery('prev')}
              disabled={isNavigating || images.length <= 1}
              aria-label="Previous image"
            >
              &#10094;
            </button>
            <div className={styles.fullscreenImageContainer}>
              <img
                src={optimizedImages[currentImageIndex]?.fullscreenSrc || images[currentImageIndex]}
                srcSet={optimizedImages[currentImageIndex]?.srcSet}
                sizes="100vw"
                alt={`${productName} - Image ${currentImageIndex + 1}`}
                className={styles.fullscreenImage}
                onLoad={() => {
                  if (process.env.NODE_ENV === 'development' && currentImageIndex === 0) {
                    console.log(`✅ Fullscreen image ${currentImageIndex + 1} loaded successfully`);
                  }
                }}
                onError={(e) => {
                  if (process.env.NODE_ENV === 'development') {
                    console.error(`❌ Fullscreen image ${currentImageIndex + 1} failed to load:`, e.currentTarget.src);
                  }
                }}
              />
              <div className={styles.imageCounter}>
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
            <button
              className={`${styles.galleryNavBtn} ${styles.nextBtn} ${isNavigating ? styles.disabled : ''}`}
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
