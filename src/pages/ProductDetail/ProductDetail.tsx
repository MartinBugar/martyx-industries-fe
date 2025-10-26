import React from 'react';
import {useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {type Product, type ProductTab, type ProductTabId} from '../../data/productData';
import {hybridProductService} from '../../services/hybridProductService';
import ProductView from '../../components/ProductView/ProductView';
import './ProductDetail.css';
import {DetailsTab, DownloadTab, FeaturesTab, ReviewsTab, PrintInfoTab} from '../../components/ProductTabs';
import {useCart} from '../../context/useCart';
import WishlistButton from '../../components/WishlistButton';
import {reviewsService, type Review} from '../../services/reviewsService';
import { getLCPPreloadAttributes, getBaseNameFromPath, isCDNEnabled } from '../../utils/cdnImages';
import { productGalleryService } from '../../services/productGalleryService';

// StarRating component for displaying average rating
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
    const sizeClass = size === 'small' ? 'star-rating-small' : 
                     size === 'large' ? 'star-rating-large' : 'star-rating-medium';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            // Full star
            stars.push(
                <span key={i} className={`star star-full ${sizeClass}`}>★</span>
            );
        } else if (i === fullStars && hasHalfStar) {
            // Half star
            stars.push(
                <span key={i} className={`star star-half ${sizeClass}`}>★</span>
            );
        } else {
            // Empty star
            stars.push(
                <span key={i} className={`star star-empty ${sizeClass}`}>★</span>
            );
        }
    }
    
    return (
        <div className="product-rating">
            <div className="stars-container">
                {stars}
            </div>
            <span className="rating-text">
                {rating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
            </span>
        </div>
    );
};

// Local inlined ProductDetails component (previously in components/ProductDetails/ProductDetails.tsx)
interface ProductDetailsProps {
    product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({product}) => {
    const {addToCart} = useCart();
    const {t} = useTranslation('products');

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

        reviewsService.getReviews(product.masterProductId)
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
    }, [product.masterProductId]);

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

        setPopup({visible: true, message, variant});
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
            setPopup(p => ({...p, visible: false}));
        }, 2000);
    };

    return (
        <div id="details" className="product-details">
            <h2>{product.name}</h2>
            <div className="product-meta-row">
                {!reviewsLoading && reviews.length > 0 && (
                    <StarRating 
                        rating={averageRating} 
                        totalReviews={reviews.length}
                        size="small"
                    />
                )}
                <div className="product-type-compact">
                    {product.variantType === 'DIGITAL_ONLY' ? 'DIGITAL' : (product.variantType === 'PHYSICAL_ONLY' ? 'PHYSICAL' : product.variantType)}
                </div>
            </div>
            <div
                className="price">{product.priceWithVat.toFixed(2)} {product.currency === 'EUR' ? '€' : product.currency}</div>
            <p className="description">{product.description}</p>

            <h3 id="features">Features:</h3>
            <ul className="features-list">
                {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                ))}
            </ul>


            <div className="product-actions">
                <WishlistButton
                    productId={product.variantId}
                    variant="button"
                    size="large"
                />
                <button
                    className={`add-to-cart-btn${popup.visible ? ` is-popup ${popup.variant}` : ''}`}
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
    if (import.meta.env.DEV) {
        console.log('🔧 Building tabs for product:', p.masterProductId, 'has custom tabs:', p.tabs?.length);
    }
    let tabs: ProductTab[];
    if (p.tabs && p.tabs.length > 0) {
        // Use product's custom tabs as-is
        tabs = [...p.tabs];
        if (import.meta.env.DEV) {
            console.log('✅ Using custom tabs:', tabs.map(t => `${t.id}(${t.content.kind})`));
            // Debug: check if PrintInfo tab exists and what content it has
            const printInfoTab = tabs.find(t => t.id === 'PrintInfo');
            if (printInfoTab) {
                console.log('🔍 PrintInfo tab found in custom tabs:', printInfoTab.content.kind);
                if (printInfoTab.content.kind === 'printInfo') {
                    console.log('🎉 PrintInfo has correct data type!');
                } else {
                    console.log('❌ PrintInfo has wrong content type:', printInfoTab.content);
                }
            } else {
                console.log('❌ PrintInfo tab NOT found in custom tabs!');
            }
        }
    } else {
        // Create default tabs for products without custom tabs
        tabs = [
            {id: 'Details', label: 'Details', content: {kind: 'text', text: p.description}},
            {id: 'PrintInfo', label: 'Print Info', content: {kind: 'text', text: 'Print information not available for this product.'}},
            {id: 'Features', label: 'Features', content: {kind: 'list', items: p.features}}
        ];

        if (p.variantType === 'DIGITAL_ONLY') {
            tabs.splice(2, 0, {
                id: 'Download',
                label: 'Download',
                content: {kind: 'text', text: 'Files available for download after purchase.'}
            });
        }
    }

    // ALWAYS ensure PrintInfo tab exists - add it if missing (but only add fallback if no custom data exists)
    if (!tabs.some(t => t.id === 'PrintInfo')) {
        if (import.meta.env.DEV) {
            console.log('⚠️ PrintInfo tab missing, adding fallback for product', p.masterProductId);
        }
        // Find the index of Details tab and insert PrintInfo right after it
        const detailsIndex = tabs.findIndex(t => t.id === 'Details');
        if (detailsIndex !== -1) {
            tabs.splice(detailsIndex + 1, 0, {
                id: 'PrintInfo',
                label: 'Print Info',
                content: {kind: 'text', text: 'Print information not available for this product.'}
            });
        } else {
            // If no Details tab, add PrintInfo at the beginning
            tabs.unshift({
                id: 'PrintInfo',
                label: 'Print Info',
                content: {kind: 'text', text: 'Print information not available for this product.'}
            });
        }
    } else {
        if (import.meta.env.DEV) {
            const printInfoTab = tabs.find(t => t.id === 'PrintInfo');
            console.log('✅ PrintInfo tab exists with content kind:', printInfoTab?.content.kind);
            if (printInfoTab?.content.kind === 'printInfo') {
                console.log('🎉 PrintInfo tab has real data!', printInfoTab.content.data);
            }
        }
    }

    // Ensure Reviews tab exists but do not source its content from static data
    if (!tabs.some(t => t.id === 'Reviews')) {
        tabs.push({id: 'Reviews', label: 'Reviews', content: {kind: 'text', text: ''}});
    }

    if (import.meta.env.DEV) {
        console.log('🎯 Final tabs built:', tabs.map(t => `${t.id}(${t.content.kind})`));
    }
    return tabs;
};

const ProductDetail: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const { i18n } = useTranslation('products');
    const [product, setProduct] = React.useState<Product | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isProductInactive, setIsProductInactive] = React.useState(false);
    const [galleryImages, setGalleryImages] = React.useState<Array<{ url: string; thumbnailUrl?: string }>>([]);
    const [hasLoadedGallery, setHasLoadedGallery] = React.useState(false);
    const [active, setActive] = React.useState<ProductTabId>('Details');

    const tabs = React.useMemo(() => {
        if (product) {
            if (import.meta.env.DEV) {
                console.log('🔍 Product loaded:', product.masterProductId, 'has tabs:', !!product.tabs);
            }
            return buildTabs(product);
        }
        return [];
    }, [product]);

    // Reset gallery loading flag when product ID changes (not language)
    React.useEffect(() => {
        setHasLoadedGallery(false);
        setGalleryImages([]); // Also clear gallery images for new product
    }, [id]);

    // Load product from hybrid service
    React.useEffect(() => {
        const loadProduct = async () => {
            if (!id) {
                setError('Product ID is required');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                setIsProductInactive(false);
                const productData = await hybridProductService.getProductByStringId(id);
                setProduct(productData);
            } catch (err) {
                console.error('Failed to load product:', err);
                // Check if the error is for inactive product
                if ((err as any).code === 'PRODUCT_INACTIVE') {
                    setIsProductInactive(true);
                    setError(null);
                } else {
                    // Any other error from backend (404, etc.) should also show unavailable
                    // Only network errors should have been handled by fallback in service
                    setIsProductInactive(true);
                    setError(null);
                }
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id, i18n.language]); // Re-load product when language changes

    // Load gallery images from database (with metadata and proper ordering) - ONCE per product
    React.useEffect(() => {
        const loadGalleryImages = async () => {
            if (!product || !id || hasLoadedGallery) return;

            try {
                console.log(`🖼️ Loading gallery images from database for product: ${id}`);

                // Load gallery images with metadata from database
                const galleryData = await productGalleryService.getProductImages(id);
                console.log(`📊 Loaded ${galleryData.length} gallery records from database:`, galleryData);

                if (galleryData.length > 0) {
                    // Sort by order field (ascending)
                    const sortedGallery = galleryData.sort((a, b) => (a.order || 0) - (b.order || 0));

                    // Extract image data with both full URL and thumbnail URL
                    const imageData = sortedGallery.map(img => ({
                        url: img.cdnUrl || img.url,
                        thumbnailUrl: img.thumbnailUrl || img.cdnUrl || img.url
                    })).filter(img => img.url);

                    console.log(`✅ Gallery images sorted by order:`, {
                        totalImages: imageData.length,
                        orderInfo: sortedGallery.map(img => ({
                            fileName: img.fileName,
                            order: img.order,
                            url: img.cdnUrl || img.url,
                            thumbnailUrl: img.thumbnailUrl
                        }))
                    });

                    setGalleryImages(imageData);

                    // Update product with the loaded gallery images (URLs only for compatibility)
                    const imageUrls = imageData.map(img => img.url);
                    setProduct(prev => prev ? { ...prev, gallery: imageUrls } : null);
                } else {
                    console.log('📁 No gallery images found in database - no gallery will be shown');
                    // No fallback - if no database images, show empty gallery
                    setGalleryImages([]);
                }

                // Mark gallery as loaded to prevent infinite loop
                setHasLoadedGallery(true);

            } catch (error) {
                console.error('❌ Failed to load gallery images from database:', error);
                // No fallback - if database fails, show empty gallery
                setGalleryImages([]);
                console.log('🔄 Database gallery loading failed - showing empty gallery');
                
                // Mark as loaded even on error to prevent infinite retries
                setHasLoadedGallery(true);
            }
        };

        loadGalleryImages();
    }, [product, id, hasLoadedGallery]);

    React.useEffect(() => {
        const firstTabId = tabs[0]?.id ?? 'Details';
        if (import.meta.env.DEV) {
            console.log('🎯 Setting active tab to:', firstTabId, 'available tabs:', tabs.map(t => t.id));
        }
        setActive(firstTabId);
    }, [tabs]);

    // LCP preloading for hero image
    React.useEffect(() => {
        const heroImage = galleryImages[0] || product?.gallery?.[0];
        if (!heroImage || !isCDNEnabled()) return;

        const imageUrl = typeof heroImage === 'string' ? heroImage : heroImage.url;
        const baseName = getBaseNameFromPath(imageUrl);
        const preloadAttrs = getLCPPreloadAttributes(baseName);

        // Create and inject preload link
        const link = document.createElement('link');
        Object.entries(preloadAttrs).forEach(([key, value]) => {
            if (key === 'imageSrcset') {
                link.setAttribute('imagesrcset', value as string);
            } else if (key === 'imageSizes') {
                link.setAttribute('imagesizes', value as string);
            } else {
                link.setAttribute(key, value as string);
            }
        });

        document.head.appendChild(link);

        // Cleanup on unmount or product change
        return () => {
            if (link.parentNode) {
                document.head.removeChild(link);
            }
        };
    }, [galleryImages, product]);

    const activeTab = tabs.find(t => t.id === active) ?? tabs[0];
    if (import.meta.env.DEV && activeTab) {
        console.log('📋 Active tab:', active, 'content kind:', activeTab.content.kind);
    }

    // Create an updated product object with database gallery images ONLY
    const productWithGallery = React.useMemo(() => {
        if (!product) return null;

        if (import.meta.env.DEV) {
            console.log('🔄 productWithGallery updated (database-only):', {
                masterProductId: product.masterProductId,
                variantId: product.variantId,
                galleryImagesCount: galleryImages.length,
                hasLoadedGallery: hasLoadedGallery,
                galleryImages: galleryImages.slice(0, 3) // First 3 for debugging
            });
        }

        // Extract URL strings for Product.gallery property (which expects string[])
        const galleryUrls = galleryImages.map(img => img.url);

        return {
            ...product,
            gallery: galleryUrls // Use ONLY database images, no fallback to hardcoded
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

    // Show product unavailable state (when product is inactive)
    if (isProductInactive) {
        return (
            <div className="product-detail-page">
                <div className="product-container">
                    <div className="product-unavailable-overlay">
                        <div className="product-unavailable-modal">
                            <div className="unavailable-icon">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                    <path d="m15 9-6 6" stroke="currentColor" strokeWidth="2"/>
                                    <path d="m9 9 6 6" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </div>
                            <h1>Produkt je aktuálne nedostupný</h1>
                            <p>
                                Momentálne pracujeme na tomto produkte. <br />
                                Prosím, skúste to neskôr alebo sa vráťte na hlavnú stránku.
                            </p>
                            <div className="unavailable-actions">
                                <button 
                                    onClick={() => window.history.back()} 
                                    className="back-button"
                                >
                                    Späť
                                </button>
                                <button 
                                    onClick={() => window.location.href = '/products'} 
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
                        <button onClick={() => window.history.back()} className="back-button">
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="product-detail-page">
            <div className="product-container">
                {productWithGallery && <ProductView product={productWithGallery} galleryData={galleryImages}/>}
                <ProductDetails product={product}/>

                <nav className="product-bookmarks" aria-label="Product sections" role="tablist">
                    {import.meta.env.DEV && (() => {
                        console.log('🗂️ Rendering tabs:', tabs.map(t => `${t.id}:${t.label}`));
                        return null;
                    })()}
                    {tabs.length === 0 && import.meta.env.DEV && (
                        <div style={{color: 'red', padding: '1rem'}}>
                            ⚠️ No tabs found! Product: {product?.masterProductId}
                        </div>
                    )}
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            id={`tab-${t.id}`}
                            type="button"
                            role="tab"
                            aria-selected={t.id === active}
                            aria-controls={`panel-${t.id}`}
                            onClick={() => setActive(t.id)}
                            className={t.id === active ? 'active' : ''}
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
                        className="product-tab-panel"
                    >
                        {activeTab.id === 'Details' && <DetailsTab content={activeTab.content}/>}
                        {activeTab.id === 'PrintInfo' && <PrintInfoTab content={activeTab.content}/>}
                        {activeTab.id === 'Download' && <DownloadTab content={activeTab.content}/>}
                        {activeTab.id === 'Features' && <FeaturesTab content={activeTab.content}/>}
                        {activeTab.id === 'Reviews' && <ReviewsTab content={activeTab.content} productId={product.masterProductId}/>}
                    </div>
                )}

                {product.videoUrl && (
                    <div className="product-video-section" style={{marginTop: '24px'}}>
                        <div style={{
                            position: 'relative',
                            paddingBottom: '56.25%',
                            height: 0,
                            overflow: 'hidden',
                            borderRadius: '8px'
                        }}>
                            <iframe
                                title="Product video"
                                src={toYouTubeEmbedUrl(product.videoUrl)}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    border: 0
                                }}
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
