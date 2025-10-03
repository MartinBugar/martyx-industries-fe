import { SkeletonProductDetail } from '@/components/Skeleton';
import styles from './loading.module.css';

export default function ProductDetailLoading() {
  return (
    <div className="main-content">
      <div className="container">
        {/* Breadcrumb Skeleton */}
        <div className={`mb-6 ${styles['breadcrumb-container']}`}>
          <div className={styles['breadcrumb-item']} />
          <span className={styles['breadcrumb-separator']}>/</span>
          <div className={styles['breadcrumb-item-medium']} />
          <span className={styles['breadcrumb-separator']}>/</span>
          <div className={styles['breadcrumb-item-large']} />
        </div>

        {/* Product Detail Skeleton */}
        <SkeletonProductDetail />
      </div>
    </div>
  );
}
