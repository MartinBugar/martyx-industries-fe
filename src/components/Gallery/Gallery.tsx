import React, { useState } from 'react';
import './Gallery.css';

// Using actual images from the endavourGallery folder
const galleryImages = [
  '/endavourGallery/1.png',
  '/endavourGallery/2.png',
  '/endavourGallery/3.png',
  '/endavourGallery/4.png',
  '/endavourGallery/5.png',
  '/endavourGallery/6.png',
];

interface GalleryProps {
  productName: string;
}

const Gallery: React.FC<GalleryProps> = ({ productName }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
      );
    } else {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
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

  return (
    <div className="product-gallery">
      <h3 className="gallery-title">{productName} Gallery</h3>
      <div className="gallery-thumbnails">
        {galleryImages.map((image, index) => (
          <div 
            key={index} 
            className="gallery-thumbnail"
            onClick={() => openFullscreenGallery(index)}
          >
            <img 
              src={image} 
              alt={`${productName} - Image ${index + 1}`} 
              loading="lazy"
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
                src={galleryImages[currentImageIndex]} 
                alt={`${productName} - Image ${currentImageIndex + 1}`} 
                className="fullscreen-image"
              />
              <div className="image-counter">
                {currentImageIndex + 1} / {galleryImages.length}
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