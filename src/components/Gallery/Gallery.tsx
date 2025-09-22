import React, { useState } from 'react';
import './Gallery.css';
import Skeleton from '../Skeleton/Skeleton';
import { getImageSrcSet, getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '../../utils/cdnImages';

interface GalleryProps {
  productName: string;
  images: string[];
}

const Gallery: React.FC<GalleryProps> = ({ productName, images }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(() => images.map(() => false));
  const imgRefs = React.useRef<(HTMLImageElement | null)[]>([]);

  // Debug: log received images
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🖼️ Gallery received images for', productName, ':', images);
      console.log('🔍 First 3 image URLs:', images.slice(0, 3));
    }
  }, [images, productName]);

  // After mount, mark cached images as loaded (in case onLoad doesn't fire)
  React.useEffect(() => {
    setLoaded((prev) => {
      const next = [...prev];
      let changed = false;
      imgRefs.current.forEach((img, i) => {
        if (img && !next[i] && img.complete && img.naturalWidth > 0) {
          next[i] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
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

  const navigateGallery = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? images.length - 1 : prevIndex - 1
      );
    } else {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

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
            {!loaded[index] && (
              <Skeleton variant="rect" />
            )}
            <img
              ref={(el) => { imgRefs.current[index] = el; }}
              src={(() => {
                // If the image URL is already a CDN URL, use it directly
                const isCDNUrl = image.includes('digitaloceanspaces.com') || image.includes(import.meta.env.VITE_CDN_BASE || '');
                const finalSrc = isCDNUrl ? image : (isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(image), 400) : image);
                if (import.meta.env.DEV && index < 3) {
                  console.log(`🎯 Image ${index + 1} - Original:`, image, '→ Final:', finalSrc, '(CDN URL detected:', isCDNUrl, ')');
                }
                return finalSrc;
              })()}
              srcSet={(() => {
                const isCDNUrl = image.includes('digitaloceanspaces.com') || image.includes(import.meta.env.VITE_CDN_BASE || '');
                return !isCDNUrl && isCDNEnabled() ? getImageSrcSet(getBaseNameFromPath(image)) : undefined;
              })()}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 200px"
              alt={`${productName} - Image ${index + 1}`}
              decoding="async"
              loading={index < 6 ? "eager" : "lazy"}
              style={{ visibility: loaded[index] ? 'visible' : 'hidden' }}
              onLoad={() => {
                if (import.meta.env.DEV && index < 3) {
                  console.log(`✅ Image ${index + 1} loaded successfully`);
                }
                setLoaded(prev => {
                  const next = [...prev];
                  next[index] = true;
                  return next;
                });
              }}
              onError={(e) => {
                if (import.meta.env.DEV) {
                  console.error(`❌ Image ${index + 1} failed to load:`, e.currentTarget.src);
                }
                // Keep skeleton visible if there is an error
                setLoaded(prev => {
                  const next = [...prev];
                  next[index] = false;
                  return next;
                });
              }}
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
              className="gallery-nav-btn prev-btn" 
              onClick={() => navigateGallery('prev')}
              aria-label="Previous image"
            >
              &#10094;
            </button>
            <div className="fullscreen-image-container">
              <img
                src={isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(images[currentImageIndex]), 1600) : images[currentImageIndex]}
                srcSet={isCDNEnabled() ? getImageSrcSet(getBaseNameFromPath(images[currentImageIndex])) : undefined}
                sizes="100vw"
                alt={`${productName} - Image ${currentImageIndex + 1}`}
                className="fullscreen-image"
              />
              <div className="image-counter">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
            <button 
              className="gallery-nav-btn next-btn" 
              onClick={() => navigateGallery('next')}
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