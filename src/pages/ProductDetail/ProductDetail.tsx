import React from 'react';
import {useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import DOMPurify from 'dompurify';
import {type Product} from '../../data/productData';
import {hybridProductService} from '../../services/hybridProductService';
import ProductView from '../../components/ProductView/ProductView';
import './ProductDetail.css';
import {DetailsTab, DownloadTab, FeaturesTab, ReviewsTab, PrintInfoTab, IncludedTab, BuildInfoTab} from '../../components/ProductTabs';
import ProductDownloads from '../../components/ProductTabs/ProductDownloads';
import {useCart} from '../../context/useCart';
import WishlistButton from '../../components/WishlistButton';
import { getLCPPreloadAttributes, getBaseNameFromPath, isCDNEnabled } from '../../utils/cdnImages';
import { productGalleryService } from '../../services/productGalleryService';
import VariantSelector from '../../components/VariantSelector/VariantSelector';
import SingleVariantDisplay from '../../components/VariantSelector/SingleVariantDisplay';
import { getTabsForVariant, canViewTab, renderTabContent } from '../../services/productTabService';
import type { ProductTabDto } from '../../types/api';
import { useAuth } from '../../context/useAuth';
import { trackProductView, extractUTMParams } from '../../services/backendAnalyticsService';
import { debounce } from '../../utils/debounce';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { logInfo, logWarn, logError } from '../../services/logger';
import { stockService } from '../../services/stockService';
import { useSeo } from '../../hooks/useSeo';
import { ProductDetailSkeleton } from '../../components/ui/Skeleton';

// Local inlined ProductDetails component (previously in components/ProductDetails/ProductDetails.tsx)
interface ProductDetailsProps {
    product: Product;
    onVariantChange?: (variantId: number) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({product, onVariantChange}) => {
    const {addToCart} = useCart();
    const {t} = useTranslation('products');

    const [popup, setPopup] = React.useState<{ visible: boolean; message: string; variant: 'success' | 'warning' }>({
        visible: false,
        message: '',
        variant: 'success'
    });
    const timerRef = React.useRef<number | null>(null);

    // Stock state
    const [stockInfo, setStockInfo] = React.useState<{ availableStock: number; loading: boolean } | null>(null);

    // Fetch stock information when product variant changes
    React.useEffect(() => {
        const fetchStock = async () => {
            if (!product.variantId) return;

            try {
                setStockInfo({ availableStock: 0, loading: true });
                const stockData = await stockService.getAvailableStock(product.variantId);
                setStockInfo({ availableStock: stockData.availableStock, loading: false });
                logInfo(`📦 Stock for variant ${product.variantId}:`, stockData.availableStock);
            } catch (error) {
                logError('Failed to fetch stock:', error);
                setStockInfo(null);
            }
        };

        fetchStock();
    }, [product.variantId]);

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

            {/* Variant Selector - Multiple Variants */}
            {product.availableVariants && product.availableVariants.length > 1 && onVariantChange && (
                <VariantSelector
                    variants={product.availableVariants}
                    currentVariantId={product.variantId}
                    onVariantChange={onVariantChange}
                    difficultyLevel={product.difficultyLevel}
                />
            )}

            {/* Single Variant Display */}
            {product.availableVariants && product.availableVariants.length === 1 && (
                <SingleVariantDisplay
                    variant={product.availableVariants[0]}
                    difficultyLevel={product.difficultyLevel}
                />
            )}

            <div
                className="price">{product.priceWithVat.toFixed(2)} {product.currency === 'EUR' ? '€' : product.currency}</div>
            <p className="description">{product.description}</p>

            {/* Low Stock Warning */}
            {!stockInfo?.loading && stockInfo && stockInfo.availableStock > 0 && stockInfo.availableStock <= 10 && (
                <div className="stock-warning" style={{
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    margin: '16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#856404'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span style={{ fontSize: '0.95rem' }}>
                        <strong>{t('stock.low_stock', 'Low Stock')}:</strong> {`${t('stock.only_left_prefix', 'Only')} ${stockInfo.availableStock} ${t('stock.only_left_suffix', 'left in stock!')}`}
                    </span>
                </div>
            )}

            {/* Out of Stock Warning */}
            {!stockInfo?.loading && stockInfo && stockInfo.availableStock === 0 && (
                <div className="stock-warning" style={{
                    backgroundColor: '#f8d7da',
                    border: '1px solid #dc3545',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    margin: '16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#721c24'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span style={{ fontSize: '0.95rem' }}>
                        <strong>{t('stock.out_of_stock', 'Out of Stock')}</strong>
                    </span>
                </div>
            )}

            <div className="whats-included-section">
                <h3 id="features">What's Included</h3>
                <div className="features-grid">
                    {product.components && product.components.length > 0 ? (
                        product.components
                            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                            .map((component) => (
                                <div key={component.id} className="feature-item">
                                    <span className="feature-icon">✓</span>
                                    <span className="feature-text">
                                        {component.quantity && component.quantity > 1 ? `${component.quantity}× ` : ''}
                                        {component.label || component.componentType}
                                    </span>
                                </div>
                            ))
                    ) : (
                        product.features.map((feature, index) => (
                            <div key={index} className="feature-item">
                                <span className="feature-icon">✓</span>
                                <span className="feature-text">{feature}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>


            <div className="product-actions">
                <WishlistButton
                    productId={product.masterProductId}
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

// REMOVED: buildTabs() function - tabs now loaded from backend API per variant

const ProductDetail: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const { i18n, t } = useTranslation('products');
    const { user, isLoading: isAuthLoading } = useAuth();
    const [product, setProduct] = React.useState<Product | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isProductInactive, setIsProductInactive] = React.useState(false);
    const [galleryImages, setGalleryImages] = React.useState<Array<{ url: string; thumbnailUrl?: string }>>([]);
    const [hasLoadedGallery, setHasLoadedGallery] = React.useState(false);

    // SEO: Fetch and apply meta tags + JSON-LD schema for AI search optimization
    // Use product.slug (not URL id) because URL uses numeric ID, but SEO API expects slug
    useSeo({
        type: 'product',
        slug: product?.slug,
        skip: !product?.slug || loading,
        includeSchema: true
    });

    // Backend tabs state
    const [backendTabs, setBackendTabs] = React.useState<ProductTabDto[]>([]);
    const [tabsLoading, setTabsLoading] = React.useState(false);
    const [active, setActive] = React.useState<string>(''); // Now using tabKey from backend instead of ProductTabId

    // Load tabs from backend API when variant changes
    React.useEffect(() => {
        // Skip while auth is still loading to avoid race conditions
        if (isAuthLoading) return;

        const loadTabs = async () => {
            if (!product?.variantId) return;

            setTabsLoading(true);
            try {
                logInfo(`📋 Loading tabs for variant ${product.variantId}`);
                const tabs = await getTabsForVariant(product.variantId, i18n.language);

                // Filter tabs based on user authentication
                const visibleTabs = tabs.filter(tab => canViewTab(tab, !!user));

                // FEATURE: Always add Reviews tab if not already present
                const hasReviewsTab = visibleTabs.some(tab => tab.tabKey === 'reviews');
                if (!hasReviewsTab) {
                    // Create default Reviews tab
                    const reviewsTab: ProductTabDto = {
                        id: -1, // Temporary ID for frontend-only tab
                        masterProductId: product.masterProductId,
                        variantId: product.variantId,
                        tabKey: 'reviews',
                        tabLabel: i18n.language === 'sk' ? 'Recenzie' : 'Reviews',
                        contentType: 'COMPONENT',
                        contentHtml: null,
                        contentMarkdown: null,
                        contentJson: null,
                        componentName: 'ReviewsTab',
                        displayOrder: 999, // Place at end
                        iconName: null,
                        isActive: true,
                        showForVariantType: null,
                        requiresAuthentication: false,
                        locale: i18n.language,
                        description: null,
                        cssClass: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        createdBy: null,
                        updatedBy: null
                    };
                    visibleTabs.push(reviewsTab);
                    logInfo('✨ Added default Reviews tab');
                }

                logInfo(`✅ Loaded ${visibleTabs.length} tabs (${tabs.length} total, +Reviews)`);
                setBackendTabs(visibleTabs);

                // Set first tab as active
                if (visibleTabs.length > 0 && !active) {
                    setActive(visibleTabs[0].tabKey);
                }
            } catch (err) {
                logError('❌ Failed to load tabs:', err);
                setBackendTabs([]);
            } finally {
                setTabsLoading(false);
            }
        };

        loadTabs();
    }, [product?.variantId, i18n.language, user, isAuthLoading]);

    // Handle variant change
    const handleVariantChange = React.useCallback(async (variantId: number) => {
        if (!product || variantId === product.variantId) return;

        try {
            logInfo(`🔄 Switching to variant ${variantId}`);
            setLoading(true);

            // Fetch product with the selected variant
            const updatedProduct = await hybridProductService.getProductByVariantId(variantId);
            setProduct(updatedProduct);

            // Clear gallery and reload for new variant
            setHasLoadedGallery(false);
            setGalleryImages([]);

            // Reset active tab
            setActive('');

            logInfo('✅ Variant switched successfully:', updatedProduct.variantName);
        } catch (err) {
            logError('Failed to switch variant:', err);
            // Don't change product on error, keep current variant
        } finally {
            setLoading(false);
        }
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
                logError('Failed to load product:', err);
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

    // Create debounced product view tracker (memoized to prevent recreating on every render)
    const debouncedTrackView = React.useMemo(
        () => debounce(async (masterProductId: number, userId?: number) => {
            try {
                const utmParams = extractUTMParams();
                await trackProductView(masterProductId, userId, utmParams);
                logInfo('[Analytics] Product view tracked:', masterProductId);
            } catch (error) {
                logWarn('[Analytics] Failed to track product view:', error);
                // Don't block user experience if analytics fails
            }
        }, 2000), // Debounce for 2 seconds to prevent duplicate tracking on re-renders
        []
    );

    // Recently viewed products tracking
    const { addProduct: addToRecentlyViewed } = useRecentlyViewed();

    // Track product view analytics when product is loaded
    React.useEffect(() => {
        if (!product) return;

        debouncedTrackView(product.masterProductId, user?.id ? parseInt(user.id, 10) : undefined);

        // Track in recently viewed (using masterProductId)
        addToRecentlyViewed(product.masterProductId);
    }, [product?.masterProductId, user?.id, debouncedTrackView, addToRecentlyViewed]); // Track when product ID or user changes

    // Load gallery images from database (with metadata and proper ordering) - ONCE per product
    React.useEffect(() => {
        const loadGalleryImages = async () => {
            if (!product || !id || hasLoadedGallery) return;

            try {
                logInfo(`🖼️ Loading gallery images from database for product: ${id}`);

                // Load gallery images with metadata from database
                const galleryData = await productGalleryService.getProductImages(id);
                logInfo(`📊 Loaded ${galleryData.length} gallery records from database:`, galleryData);

                if (galleryData.length > 0) {
                    // Sort by order field (ascending)
                    const sortedGallery = galleryData.sort((a, b) => (a.order || 0) - (b.order || 0));

                    // Extract image data with both full URL and thumbnail URL
                    const imageData = sortedGallery.map(img => ({
                        url: img.cdnUrl || img.url,
                        thumbnailUrl: img.thumbnailUrl || img.cdnUrl || img.url
                    })).filter(img => img.url);

                    logInfo(`✅ Gallery images sorted by order:`, {
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
                    logInfo('📁 No gallery images found in database - no gallery will be shown');
                    // No fallback - if no database images, show empty gallery
                    setGalleryImages([]);
                }

                // Mark gallery as loaded to prevent infinite loop
                setHasLoadedGallery(true);

            } catch (error) {
                logError('❌ Failed to load gallery images from database:', error);
                // No fallback - if database fails, show empty gallery
                setGalleryImages([]);
                logInfo('🔄 Database gallery loading failed - showing empty gallery');
                
                // Mark as loaded even on error to prevent infinite retries
                setHasLoadedGallery(true);
            }
        };

        loadGalleryImages();
    }, [product, id, hasLoadedGallery]);

    // REMOVED: Setting active tab from hardcoded tabs - now handled in tab loading useEffect

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

    const activeTab = backendTabs.find(t => t.tabKey === active);
    if (import.meta.env.DEV && activeTab) {
        logInfo('📋 Active tab:', active, 'content type:', activeTab.contentType);
    }

    // Create an updated product object with database gallery images ONLY
    const productWithGallery = React.useMemo(() => {
        if (!product) return null;

        if (import.meta.env.DEV) {
            logInfo('🔄 productWithGallery updated (database-only):', {
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

    // Show loading state with skeleton
    if (loading) {
        return (
            <div className="product-detail-page">
                <div className="product-container">
                    <ProductDetailSkeleton />
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
                            <h1>{t('unavailable.title')}</h1>
                            <p>
                                {t('unavailable.description')}
                            </p>
                            <div className="unavailable-actions">
                                <button
                                    onClick={() => window.history.back()}
                                    className="back-button"
                                >
                                    {t('unavailable.back')}
                                </button>
                                <button
                                    onClick={() => window.location.href = '/products'}
                                    className="products-button"
                                >
                                    {t('unavailable.all_products')}
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
                <ProductDetails product={product} onVariantChange={handleVariantChange}/>

                {/* Tab Navigation */}
                <nav className="product-bookmarks" aria-label="Product sections" role="tablist">
                    {tabsLoading && (
                        <div className="tabs-loading-container">
                            <div className="tabs-loading-bar">
                                <div className="tabs-loading-progress"></div>
                            </div>
                        </div>
                    )}
                    {!tabsLoading && backendTabs.length === 0 && (
                        <div className="dev-warning">
                            ⚠️ No tabs configured for this variant. Please configure tabs in admin panel.
                        </div>
                    )}
                    {backendTabs.map((tab) => (
                        <button
                            key={tab.id}
                            id={`tab-${tab.tabKey}`}
                            type="button"
                            role="tab"
                            aria-selected={tab.tabKey === active}
                            aria-controls={`panel-${tab.tabKey}`}
                            onClick={() => setActive(tab.tabKey)}
                            className={tab.tabKey === active ? 'active' : ''}
                        >
                            {tab.tabLabel}
                        </button>
                    ))}
                </nav>

                {/* Tab Content */}
                {activeTab && (
                    <div
                        id={`panel-${activeTab.tabKey}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${activeTab.tabKey}`}
                        className="product-tab-panel"
                    >
                        <DynamicTabRenderer tab={activeTab} product={product} />
                    </div>
                )}

                {product.videoUrl && (
                    <div className="product-video-section">
                        <div className="video-wrapper">
                            <iframe
                                title="Product video"
                                src={toYouTubeEmbedUrl(product.videoUrl)}
                                className="video-iframe"
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

// Dynamic Tab Renderer - renders tabs based on backend configuration
interface DynamicTabRendererProps {
    tab: ProductTabDto;
    product: Product;
}

const DynamicTabRenderer: React.FC<DynamicTabRendererProps> = ({ tab, product }) => {
    const rendered = renderTabContent(tab);

    // If tab specifies a component name, try to render the matching component
    if (rendered.type === 'component' && typeof rendered.content === 'string') {
        const componentName = rendered.content;

        // Map component names to actual components
        switch (componentName) {
            case 'DetailsTab':
                return <DetailsTab content={{ kind: 'text', text: tab.contentHtml || '' }} />;
            case 'IncludedTab':
                return <IncludedTab content={{ kind: 'text', text: JSON.stringify(product.components || []) }} />;
            case 'PrintInfoTab':
                // Try to parse JSON content for print info
                try {
                    const printData = tab.contentJson ? JSON.parse(tab.contentJson) : null;
                    if (printData) {
                        return <PrintInfoTab content={{ kind: 'printInfo', data: printData }} />;
                    }
                } catch (e) {
                    logError('Failed to parse PrintInfo JSON:', e);
                }
                return <PrintInfoTab content={{ kind: 'text', text: tab.contentHtml || 'Print information not available.' }} />;
            case 'BuildInfoTab':
                if (product.buildInfo && product.difficultyLevel) {
                    return <BuildInfoTab content={{
                        kind: 'buildInfo',
                        data: product.buildInfo
                    }} />;
                }
                return <div>Build information not available.</div>;
            case 'DownloadTab':
                return <DownloadTab content={{ kind: 'text', text: '' }} variantId={product.variantId} />;
            case 'FeaturesTab':
                return <FeaturesTab content={{ kind: 'list', items: product.features || [] }} />;
            case 'ReviewsTab':
                return <ReviewsTab content={{ kind: 'text', text: '' }} productId={product.masterProductId} />;
            case 'ProductDownloads':
                return <ProductDownloads masterProductId={product.masterProductId} variantId={product.variantId} tabId={tab.id} />;
            default:
                logWarn(`Unknown component: ${componentName}, falling back to HTML render`);
                return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tab.contentHtml || '') }} />;
        }
    }

    // Render HTML content
    if (rendered.type === 'html' && typeof rendered.content === 'string') {
        return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rendered.content) }} />;
    }

    // Render Markdown content
    if (rendered.type === 'markdown' && typeof rendered.content === 'string') {
        // For now, just render as plain text - could add markdown parser later
        return <div>{rendered.content}</div>;
    }

    // Render JSON content
    if (rendered.type === 'json') {
        return <pre>{JSON.stringify(rendered.content, null, 2)}</pre>;
    }

    return <div>No content available for this tab.</div>;
};

export default ProductDetail;
