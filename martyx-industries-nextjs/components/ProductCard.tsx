import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/api';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={styles.card}
    >
      {/* Product Image */}
      <div className={styles.imageWrapper}>
        {product.gallery && product.gallery.length > 0 ? (
          <Image
            src={product.gallery[0].url}
            alt={product.gallery[0].alt || product.title}
            fill
            className={styles.image}
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={false}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <svg
              width="48"
              height="48"
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
          </div>
        )}

        {/* Featured Badge */}
        {product.featured && (
          <span className={styles.featuredBadge}>
            Featured
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className={styles.content}>
        {/* Category */}
        {product.category && (
          <span className={styles.category}>
            {product.category}
          </span>
        )}

        {/* Title */}
        <h3 className={styles.title}>
          {product.title}
        </h3>

        {/* Description */}
        {product.shortDescription && (
          <p className={styles.description}>
            {product.shortDescription}
          </p>
        )}

        {/* Price */}
        <div className={styles.footer}>
          <span className={styles.price}>
            {product.price} {product.currency}
          </span>
          <span className={styles.viewLink}>
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}
