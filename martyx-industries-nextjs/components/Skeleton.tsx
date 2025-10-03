import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  circle?: boolean;
  className?: string;
}

export default function Skeleton({ width, height, circle, className }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${circle ? styles.circle : ''} ${className || ''}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonProductCard() {
  return (
    <div className={styles.productCard}>
      <Skeleton height="250px" className={styles.image} />
      <div className={styles.content}>
        <Skeleton width="60px" height="20px" className={styles.category} />
        <Skeleton height="24px" className={styles.title} />
        <Skeleton height="48px" className={styles.description} />
        <div className={styles.footer}>
          <Skeleton width="80px" height="28px" />
          <Skeleton width="100px" height="20px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProductDetail() {
  return (
    <div className={styles.productDetail}>
      <div className={styles.gallery}>
        <Skeleton height="500px" className={styles.mainImage} />
        <div className={styles.thumbnails}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height="80px" />
          ))}
        </div>
      </div>
      <div className={styles.info}>
        <Skeleton width="80px" height="24px" className={styles.category} />
        <Skeleton height="40px" className={styles.title} />
        <Skeleton height="60px" className={styles.description} />
        <Skeleton width="150px" height="40px" className={styles.price} />
        <Skeleton height="200px" className={styles.addToCart} />
      </div>
    </div>
  );
}
