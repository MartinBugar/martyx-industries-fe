import { SkeletonProductCard } from '@/components/Skeleton';
import styles from './loading.module.css';

export default function ProductsLoading() {
  return (
    <div className="main-content">
      <div className="container">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className={styles['header-title-skeleton']} />
          <div className={styles['header-subtitle-skeleton']} />
        </div>

        {/* Product Grid Skeleton */}
        <div className={styles['products-grid-skeleton']}>
          {[...Array(8)].map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
