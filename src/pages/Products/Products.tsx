import React, {useEffect, useRef, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {type Product, type ProductVariant} from '../../data/productData';
import {hybridProductService} from '../../services/hybridProductService';
import {useCart} from '../../context/useCart';
import ProductCard from '../../components/ProductCard/ProductCard';
import OptimizedImage from '../../components/OptimizedImage/OptimizedImage';
import { productGalleryService } from '../../services/productGalleryService';
import VariantSelectorModal from '../../components/VariantSelectorModal/VariantSelectorModal';
import './Products.css';

const Products: React.FC = () => {
    const {addToCart} = useCart();
    const {t, i18n} = useTranslation('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');

    type Popup = { visible: boolean; message: string; variant: 'success' | 'warning' };
    const [popups, setPopups] = useState<Record<string, Popup>>({});
    const timersRef = useRef<Record<string, number>>({});

    // Variant Selector Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Load products with database gallery from hybrid service
    useEffect(() => {
        const loadProductsWithGallery = async () => {
            try {
                setLoading(true);
                setError(null);
                const productsList = await hybridProductService.getProducts();
                
                // Load gallery for each product from database
                const productsWithGallery = await Promise.all(
                    productsList.map(async (product) => {
                        try {
                            const galleryData = await productGalleryService.getProductImages(product.masterProductId.toString());

                            // Sort: PRIMARY image first, then by order
                            const sortedGallery = galleryData.sort((a, b) => {
                                // Primary image always goes first
                                if (a.isPrimary && !b.isPrimary) return -1;
                                if (!a.isPrimary && b.isPrimary) return 1;
                                // Otherwise sort by order
                                return (a.order || 0) - (b.order || 0);
                            });
                            const galleryUrls = sortedGallery.map(img => img.cdnUrl || img.url).filter(Boolean);

                            if (import.meta.env.DEV) {
                                console.log(`🏷️ Product ${product.masterProductId} (${product.name}) gallery loaded:`, {
                                    galleryCount: galleryUrls.length,
                                    mainImage: galleryUrls[0] || 'none',
                                    orderInfo: sortedGallery.slice(0, 3).map(img => ({
                                        fileName: img.fileName,
                                        order: img.order
                                    }))
                                });
                            }

                            return {
                                ...product,
                                gallery: galleryUrls // Replace empty gallery with database gallery
                            };
                        } catch (galleryError) {
                            console.warn(`Failed to load gallery for product ${product.masterProductId}:`, galleryError);
                            return {
                                ...product,
                                gallery: [] // Keep empty gallery if loading fails
                            };
                        }
                    })
                );
                
                setProducts(productsWithGallery);
            } catch (err) {
                console.error('Failed to load products:', err);
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadProductsWithGallery();
    }, [i18n.language]); // Reload products when language changes

    // Update search term when URL search param changes
    useEffect(() => {
        const urlSearchTerm = searchParams.get('search') || '';
        setSearchTerm(urlSearchTerm);
    }, [searchParams]);

    useEffect(() => {
        return () => {
            // cleanup all timers on unmount
            Object.values(timersRef.current).forEach(id => window.clearTimeout(id));
            timersRef.current = {};
        };
    }, []);

    // Handle "Add to Cart" button click
    const handleAdd = (p: Product) => () => {
        const hasMultipleVariants = p.availableVariants && p.availableVariants.length > 1;

        if (hasMultipleVariants) {
            // Open modal for variant selection
            setSelectedProduct(p);
            setIsModalOpen(true);
        } else {
            // Direct add to cart for single variant products
            const status = addToCart(p);
            showPopup(p.variantId.toString(), status);
        }
    };

    // Handle add to cart from modal (with selected variant and quantity)
    const handleAddFromModal = (selectedVariant: ProductVariant, quantity: number) => {
        if (!selectedProduct) return;

        // Create a temporary product object with the selected variant data
        const productWithVariant: Product = {
            ...selectedProduct,
            variantId: selectedVariant.variantId,
            variantName: selectedVariant.variantName,
            sku: selectedVariant.sku,
            priceWithVat: selectedVariant.priceWithVat,
            priceWithoutVat: selectedVariant.priceWithoutVat,
            currency: selectedVariant.currency,
            variantType: selectedVariant.variantType,
            stockQuantity: selectedVariant.stockQuantity,
            availabilityStatus: selectedVariant.availabilityStatus
        };

        // Add to cart multiple times for quantity
        let overallStatus: 'added' | 'limit' | 'out_of_stock' | 'discontinued' | 'pre_order' = 'added';
        for (let i = 0; i < quantity; i++) {
            const status = addToCart(productWithVariant);
            if (status !== 'added') {
                overallStatus = status;
                break;
            }
        }

        showPopup(selectedVariant.variantId.toString(), overallStatus);
    };

    // Show popup notification
    const showPopup = (key: string, status: 'added' | 'limit' | 'out_of_stock' | 'discontinued' | 'pre_order') => {
        const isLimit = status === 'limit';
        const message = isLimit ? t('cart.add_limit') : t('cart.add_success');
        const variant: Popup['variant'] = isLimit ? 'warning' : 'success';

        setPopups(prev => ({...prev, [key]: {visible: true, message, variant}}));

        const existing = timersRef.current[key];
        if (existing) window.clearTimeout(existing);

        timersRef.current[key] = window.setTimeout(() => {
            setPopups(prev => ({
                ...prev,
                [key]: {...(prev[key] || {message: '', variant: 'success'}), visible: false}
            }));
            delete timersRef.current[key];
        }, 2000);
    };


    // Filter and sort products
    const filteredProducts = products
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price':
                    return a.priceWithVat - b.priceWithVat;
                case 'newest':
                    return b.variantId - a.variantId;
                default:
                    return 0;
            }
        });

    // Show loading state
    if (loading) {
        return (
            <div className="products-page">
                <div className="products-container">
                    <div className="loading-message">{t('loading')}</div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="products-page">
                <div className="products-container">
                    <div className="error-message">
                        <p>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="retry-button"
                        >
                            {t('actions.retry')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="products-page">
            <div className="products-container">
                {/* Toolbar */}
                <div className="products-toolbar">
                    <div className="search-container">
                        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => {
                                const newSearchTerm = e.target.value;
                                setSearchTerm(newSearchTerm);
                                // Update URL parameter
                                if (newSearchTerm.trim()) {
                                    setSearchParams({search: newSearchTerm});
                                } else {
                                    setSearchParams({});
                                }
                            }}
                            className="search-input"
                        />
                    </div>

                    <div className="sort-container">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="sort-select"
                        >
                            <option value="newest">{t('sort_options.newest')}</option>
                            <option value="name">{t('sort_options.name')}</option>
                            <option value="price">{t('sort_options.price')}</option>
                        </select>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="products-grid-container">
                    {filteredProducts.length > 0 ? (
                        <div className="products-grid">
                            {filteredProducts.map((p, index) => {
                                const popupKey = p.variantId.toString();
                                return (
                                    <ProductCard
                                        key={p.variantId}
                                        product={p}
                                        onAddToCart={handleAdd(p)}
                                        popupState={popups[popupKey]}
                                        priority={index < 6}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-products">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <h3>No products found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Floating Products Cassandra */}
            <div className="products-floating-mascot">
                <OptimizedImage
                    src="/cassandra/Products-Cass.png"
                    alt="Cassandra - váš sprievodca produktmi"
                    className="floating-mascot-image-products"
                    priority={true} // Mascot je vždy viditeľný, má prioritu
                />
            </div>

            {/* Variant Selector Modal */}
            {selectedProduct && (
                <VariantSelectorModal
                    product={selectedProduct}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onAddToCart={handleAddFromModal}
                />
            )}
        </div>
    );
};

export default Products;