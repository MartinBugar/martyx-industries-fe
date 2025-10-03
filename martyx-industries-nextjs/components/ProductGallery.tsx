'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './ProductGallery.module.css';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  order?: number;
}

interface ProductGalleryProps {
  gallery: GalleryImage[];
  title: string;
}

export default function ProductGallery({ gallery, title }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!gallery || gallery.length === 0) {
    return (
      <div className={styles.placeholder}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p>No images available</p>
      </div>
    );
  }

  const selectedImage = gallery[selectedImageIndex];

  return (
    <div className={styles.gallery}>
      {/* Main Image */}
      <div className={styles.mainImage}>
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt || title}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {gallery.length > 1 && (
        <div className={styles.thumbnails}>
          {gallery.map((image, index) => (
            <button
              key={image.id}
              className={`${styles.thumbnail} ${index === selectedImageIndex ? styles.active : ''}`}
              onClick={() => setSelectedImageIndex(index)}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${title} - Image ${index + 1}`}
                fill
                className={styles.thumbnailImage}
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
