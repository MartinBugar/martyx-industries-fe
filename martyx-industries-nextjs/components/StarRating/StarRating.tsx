'use client';

import React from 'react';
import styles from './StarRating.module.css';

interface StarRatingProps {
  rating: number;
  totalReviews: number;
  size?: 'small' | 'medium' | 'large';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, totalReviews, size = 'medium' }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Size classes
  const sizeClass = size === 'small' ? styles.starRatingSmall :
    size === 'large' ? styles.starRatingLarge : styles.starRatingMedium;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      // Full star
      stars.push(
        <span key={i} className={`${styles.star} ${styles.starFull} ${sizeClass}`}>★</span>
      );
    } else if (i === fullStars && hasHalfStar) {
      // Half star
      stars.push(
        <span key={i} className={`${styles.star} ${styles.starHalf} ${sizeClass}`}>★</span>
      );
    } else {
      // Empty star
      stars.push(
        <span key={i} className={`${styles.star} ${styles.starEmpty} ${sizeClass}`}>★</span>
      );
    }
  }

  return (
    <div className={styles.productRating}>
      <div className={styles.starsContainer}>
        {stars}
      </div>
      <span className={styles.ratingText}>
        {rating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
};

export default StarRating;
