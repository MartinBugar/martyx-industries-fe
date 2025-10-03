'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { Product, ProductTab, ProductTabId } from '@/lib/types/product';
import ProductView from '@/components/ProductView';
import styles from './ProductDetail.module.css';
import DetailsTab from '@/components/ProductTabs/DetailsTab';
import DownloadTab from '@/components/ProductTabs/DownloadTab';
import FeaturesTab from '@/components/ProductTabs/FeaturesTab';
import ReviewsTab from '@/components/ProductTabs/ReviewsTab';
import PrintInfoTab from '@/components/ProductTabs/PrintInfoTab';
import { useCart } from '@/context/useCart';
import WishlistButton from '@/components/WishlistButton';
import { reviewsService, type Review } from '@/lib/services/reviewsService';
import StarRating from '@/components/StarRating';
import { getHardcodedTabs } from '@/lib/data/hardcodedProductData';

// Local inlined ProductDetails component
interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { t } = useTranslation('products');

  const [popup, setPopup] = React.useState<{ visible: boolean; message: string; variant: 'success' | 'warning' }>({
    visible: false,
    message: '',
    variant: 'success'
  });
  const timerRef = React.useRef<number | null>(null);

  // Reviews state for rating display
  const [reviews, setReviews] = React.useState<Array<Review & { displayName: string; createdAt: string }>>([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(true);

  // Calculate average rating
  const averageRating = React.useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  // Load reviews for rating calculation
  React.useEffect(() => {
    let cancelled = false;
    setReviewsLoading(true);

    reviewsService.getReviews(product.id)
      .then((data) => {
        if (!cancelled) {
          setReviews(data);
          setReviewsLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          console.error('Failed to load reviews for rating:', e);
          setReviews([]);
          setReviewsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [product.id]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleAddToCart = () => {
    const status = addToCart(product);
    const isLimit = status === 'limit';
    const message = isLimit ? t('cart.add_limit') : t('cart.add_success');
    const variant = isLimit ? 'warning' : 'success';

    setPopup({ visible: true, message, variant });
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setPopup(p => ({ ...p, visible: false }));
    }, 2000);
  };

  return (
    <div id="details" className={styles['product-details']}>
      <h2>{product.name}</h2>
      <div className={styles['product-meta-row']}>
        {!reviewsLoading && reviews.length > 0 && (
          <StarRating
            rating={averageRating}
            totalReviews={reviews.length}
            size="small"
          />
        )}
        <div className={styles['product-type-compact']}>
          {product.productType === 'DIGITAL' ? 'DIGITAL' : (product.productType === 'PHYSICAL' ? 'PHYSICAL' : product.productType)}
        </div>
      </div>
      <div
        className={styles.price}>{product.price.toFixed(2)} {product.currency === 'EUR' ? '€' : product.currency}</div>
      <p className={styles.description}>{product.description}</p>

      <h3 id="features">Features:</h3>
      <ul className={styles['features-list']}>
        {(product.features || []).map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>

      <div className={styles['product-actions']}>
        <WishlistButton
          productId={product.id}
          variant="button"
          size="large"
        />
        <button
          className={`${styles['add-to-cart-btn']}${popup.visible ? ` ${styles['is-popup']} ${styles[popup.variant]}` : ''}`}
          onClick={handleAddToCart}
          disabled={popup.visible}
          aria-live="polite"
        >
          {popup.visible ? popup.message : t('cart.add_to_cart')}
        </button>
      </div>
    </div>
  );
};

const toYouTubeEmbedUrl = (url: string): string => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '');
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return url;
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch {
    return url;
  }
  return url;
};

const buildTabs = (p: Product): ProductTab[] => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Building tabs for product:', p.id, 'has custom tabs:', p.tabs?.length);
  }

  let tabs: ProductTab[];

  // First, try to get hardcoded tabs for this product ID
  const hardcodedTabs = getHardcodedTabs(p.id);

  if (hardcodedTabs && hardcodedTabs.length > 0) {
    // Use hardcoded tabs (includes full content like PrintInfo data)
    tabs = [...hardcodedTabs];
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Using hardcoded tabs for product', p.id, ':', tabs.map(t => `${t.id}(${t.content.kind})`));
    }
  } else if (p.tabs && p.tabs.length > 0) {
    // Use product's custom tabs from backend
    tabs = [...p.tabs];
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Using backend tabs:', tabs.map(t => `${t.id}(${t.content.kind})`));
    }
  } else {
    // Create default tabs for products without any tabs
    tabs = [
      { id: 'Details', label: 'Details', content: { kind: 'text', text: p.description } },
      { id: 'PrintInfo', label: 'Print Info', content: { kind: 'text', text: 'Print information not available for this product.' } },
      { id: 'Features', label: 'Features', content: { kind: 'list', items: p.features || [] } }
    ];

    if (p.productType === 'DIGITAL') {
      tabs.splice(2, 0, {
        id: 'Download',
        label: 'Download',
        content: { kind: 'text', text: 'Files available for download after purchase.' }
      });
    }
  }

  // ALWAYS ensure PrintInfo tab exists
  if (!tabs.some(t => t.id === 'PrintInfo')) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ PrintInfo tab missing, adding fallback for product', p.id);
    }
    const detailsIndex = tabs.findIndex(t => t.id === 'Details');
    if (detailsIndex !== -1) {
      tabs.splice(detailsIndex + 1, 0, {
        id: 'PrintInfo',
        label: 'Print Info',
        content: { kind: 'text', text: 'Print information not available for this product.' }
      });
    } else {
      tabs.unshift({
        id: 'PrintInfo',
        label: 'Print Info',
        content: { kind: 'text', text: 'Print information not available for this product.' }
      });
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      const printInfoTab = tabs.find(t => t.id === 'PrintInfo');
      console.log('✅ PrintInfo tab exists with content kind:', printInfoTab?.content.kind);
      if (printInfoTab?.content.kind === 'printInfo') {
        console.log('🎉 PrintInfo tab has real data!', printInfoTab.content.data);
      }
    }
  }

  // Ensure Reviews tab exists
  if (!tabs.some(t => t.id === 'Reviews')) {
    tabs.push({ id: 'Reviews', label: 'Reviews', content: { kind: 'text', text: '' } });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 Final tabs built:', tabs.map(t => `${t.id}(${t.content.kind})`));
  }
  return tabs;
};

const ProductDetail: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { i18n } = useTranslation('products');
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isProductInactive, setIsProductInactive] = React.useState(false);
  const [galleryImages, setGalleryImages] = React.useState<string[]>([]);
  const [hasLoadedGallery, setHasLoadedGallery] = React.useState(false);
  const [active, setActive] = React.useState<ProductTabId>('Details');

  const tabs = React.useMemo(() => {
    if (product) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Product loaded:', product.id, 'has tabs:', !!product.tabs);
      }
      return buildTabs(product);
    }
    return [];
  }, [product]);

  // Reset gallery loading flag when slug changes
  React.useEffect(() => {
    setHasLoadedGallery(false);
    setGalleryImages([]);
  }, [slug]);

  // Load product from API
  React.useEffect(() => {
    const loadProduct = async () => {
      if (!slug) {
        setError('Product ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setIsProductInactive(false);

        // Import getProductById from lib/api (supports both ID and slug)
        const { getProductBySlug } = await import('@/lib/api');
        const productData = await getProductBySlug(slug);

        // Check if product is inactive
        if (productData.active === false) {
          setIsProductInactive(true);
          setProduct(null);
        } else {
          setProduct(productData as any); // Type assertion for compatibility
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        // Any error should show unavailable state
        setIsProductInactive(true);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug, i18n.language]);

  // Load gallery images from database
  React.useEffect(() => {
    const loadGalleryImages = async () => {
      if (!product || !slug || hasLoadedGallery) return;

      try {
        console.log(`🖼️ Loading gallery images from database for product: ${slug}`);

        // Import getProductGallery from lib/api
        const { getProductGallery } = await import('@/lib/api');
        const galleryData = await getProductGallery(slug);

        console.log(`📊 Loaded ${galleryData.length} gallery records from database:`, galleryData);

        if (galleryData.length > 0) {
          // Sort by order field (ascending)
          const sortedGallery = galleryData.sort((a, b) => (a.order || 0) - (b.order || 0));

          // Extract URLs (prefer CDN URLs)
          const imageUrls = sortedGallery.map(img => img.cdnUrl || img.url).filter(Boolean) as string[];

          console.log(`✅ Gallery images sorted by order:`, {
            totalImages: imageUrls.length,
            imageUrls: imageUrls,
            orderInfo: sortedGallery.map(img => ({
              fileName: img.fileName,
              order: img.order,
              url: img.cdnUrl || img.url
            }))
          });

          setGalleryImages(imageUrls);

          // Update product with the loaded gallery images
          setProduct(prev => prev ? { ...prev, gallery: imageUrls } : null);
        } else {
          console.log('📁 No gallery images found in database - no gallery will be shown');
          setGalleryImages([]);
        }

        setHasLoadedGallery(true);
      } catch (error) {
        console.error('❌ Failed to load gallery images from database:', error);
        setGalleryImages([]);
        setHasLoadedGallery(true);
      }
    };

    loadGalleryImages();
  }, [product, slug, hasLoadedGallery]);

  React.useEffect(() => {
    const firstTabId = tabs[0]?.id ?? 'Details';
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Setting active tab to:', firstTabId, 'available tabs:', tabs.map(t => t.id));
    }
    setActive(firstTabId);
  }, [tabs]);

  const activeTab = tabs.find(t => t.id === active) ?? tabs[0];

  const productWithGallery = React.useMemo(() => {
    if (!product) return null;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 productWithGallery updated (database-only):', {
        productId: product.id,
        galleryImagesCount: galleryImages.length,
        hasLoadedGallery: hasLoadedGallery,
        galleryImages: galleryImages.slice(0, 3)
      });
    }

    return {
      ...product,
      gallery: galleryImages
    };
  }, [product, galleryImages, hasLoadedGallery]);

  // Show loading state
  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-container">
          <div className="loading-message">Loading product...</div>
        </div>
      </div>
    );
  }

  // Show product unavailable state
  if (isProductInactive) {
    return (
      <div className="product-detail-page">
        <div className="product-container">
          <div className="product-unavailable-overlay">
            <div className="product-unavailable-modal">
              <div className="unavailable-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="m15 9-6 6" stroke="currentColor" strokeWidth="2" />
                  <path d="m9 9 6 6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h1>Produkt je aktuálne nedostupný</h1>
              <p>
                Momentálne pracujeme na tomto produkte. <br />
                Prosím, skúste to neskôr alebo sa vráťte na hlavnú stránku.
              </p>
              <div className="unavailable-actions">
                <button
                  onClick={() => router.back()}
                  className="back-button"
                >
                  Späť
                </button>
                <button
                  onClick={() => router.push('/products')}
                  className="products-button"
                >
                  Všetky produkty
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="product-container">
          <div className="error-message">
            <p>{error || 'Product not found'}</p>
            <button onClick={() => router.back()} className="back-button">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['product-detail-page']}>
      <div className={styles['product-container']}>
        {productWithGallery && <ProductView product={productWithGallery} />}
        {product && <ProductDetails product={product} />}

        <nav className={styles['product-bookmarks']} aria-label="Product sections" role="tablist">
          {(tabs || []).map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={t.id === active}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={t.id === active ? styles.active : ''}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {activeTab && (
          <div
            id={`panel-${activeTab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab.id}`}
            className={styles['product-tab-panel']}
          >
            {activeTab.id === 'Details' && <DetailsTab content={activeTab.content} />}
            {activeTab.id === 'PrintInfo' && <PrintInfoTab content={activeTab.content} />}
            {activeTab.id === 'Download' && <DownloadTab content={activeTab.content} />}
            {activeTab.id === 'Features' && <FeaturesTab content={activeTab.content} />}
            {activeTab.id === 'Reviews' && product && <ReviewsTab content={activeTab.content} productId={product.id} />}
          </div>
        )}

        {product?.videoUrl && (
          <div className={styles['product-video-section']}>
            <div className={styles['video-wrapper']}>
              <iframe
                title="Product video"
                src={toYouTubeEmbedUrl(product?.videoUrl || '')}
                className={styles['video-iframe']}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;