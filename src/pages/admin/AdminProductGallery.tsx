import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminProductsService, type BaseProduct } from '../../services/adminProductsService';
import ProductGalleryUpload from '../../components/ProductGalleryUpload/ProductGalleryUpload';
import ProductCardPreviewEditor, { type ImageDisplaySettings } from '../../components/ProductCardPreviewEditor/ProductCardPreviewEditor';
import { productGalleryService, type GalleryImage } from '../../services/productGalleryService';
import { hybridProductService } from '../../services/hybridProductService';
import { type Product } from '../../data/productData';
import { logInfo, logWarn, logError } from '../../services/logger';

const AdminProductGallery: React.FC = () => {
  useTranslation('common');
  const { id } = useParams<{ id: string }>();

  // Debug: Log when component mounts
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      logInfo('🖼️ AdminProductGallery mounted with ID:', id);
      logInfo('🖼️ Current URL:', window.location.pathname);
    }
  }, [id]);

  const [product, setProduct] = useState<BaseProduct | null>(null);
  const [fullProduct, setFullProduct] = useState<Product | null>(null); // Full product data for ProductCard
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery images state
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // Load basic product data for admin info
      const data = await adminProductsService.getProductById(id);
      setProduct(data);

      // Load full product data for ProductCard preview
      try {
        const fullData = await hybridProductService.getProductById(Number(id));
        setFullProduct(fullData);
        if (import.meta.env.DEV) {
          logInfo('✅ Full product data loaded for preview:', {
            masterProductId: fullData.masterProductId,
            name: fullData.name,
            variantType: fullData.variantType,
            galleryLength: fullData.gallery?.length || 0,
            gallery: fullData.gallery?.slice(0, 3) || [],
            fullData
          });
        }
      } catch (e) {
        logWarn('Could not load full product data for preview:', e);
        // Continue without preview if hybrid service fails
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load product';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadGalleryImages = async () => {
    if (!id) return;
    setLoadingGallery(true);
    try {
      const images = await productGalleryService.getMasterProductGallery(Number(id));
      // Ensure images is always an array (API may return null)
      const safeImages = Array.isArray(images) ? images : [];
      setGalleryImages(safeImages);

      // Auto-select primary image or first image
      const primaryImage = safeImages.find(img => img.isPrimary);
      const defaultImage = primaryImage || safeImages[0] || null;
      setSelectedImage(defaultImage);

      // Reload full product data to update ProductCard preview with new gallery
      try {
        const refreshedProduct = await hybridProductService.getProductById(Number(id));
        setFullProduct(refreshedProduct);
        if (import.meta.env.DEV) {
          logInfo('✅ Product preview refreshed with new gallery:', {
            masterProductId: refreshedProduct.masterProductId,
            galleryLength: refreshedProduct.gallery?.length || 0,
            gallery: refreshedProduct.gallery?.slice(0, 5) || []
          });
        }
      } catch (e) {
        logWarn('Could not refresh product preview:', e);
      }

    } catch (e: unknown) {
      logError('Failed to load gallery images:', e);
    } finally {
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (id) {
      loadGalleryImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleGalleryRefresh = () => {
    loadGalleryImages();
  };

  const handleImageSelect = (imageId: string) => {
    if (!Array.isArray(galleryImages)) return;
    const image = galleryImages.find(img => img.id === imageId);
    if (image) {
      setSelectedImage(image);
    }
  };

  const handleSettingsSave = async (settings: ImageDisplaySettings) => {
    if (!selectedImage || !id) {
      throw new Error('No image selected');
    }

    try {
      const updated = await productGalleryService.updateImageDisplaySettings(
        Number(id),
        null, // variantId = null for master product
        selectedImage.id,
        {
          cardDisplayZoom: settings.zoom,
          cardDisplayOffsetX: settings.offsetX,
          cardDisplayOffsetY: settings.offsetY
        }
      );

      // Update local state
      setGalleryImages(prev =>
        prev.map(img => (img.id === updated.id ? updated : img))
      );
      setSelectedImage(updated);

      logInfo('✅ Display settings saved successfully');
    } catch (e) {
      logError('❌ Failed to save display settings:', e);
      throw e;
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!id) return;
    try {
      await productGalleryService.setPrimaryImage(Number(id), null, imageId);
      logInfo('✅ Primary image set successfully');
      await loadGalleryImages(); // Refresh gallery
    } catch (e) {
      logError('❌ Failed to set primary image:', e);
      setError('Failed to set primary image');
    }
  };

  const handleSetHover = async (imageId: string) => {
    if (!id) return;
    try {
      await productGalleryService.setHoverImage(Number(id), null, imageId);
      logInfo('✅ Hover image set successfully');
      await loadGalleryImages(); // Refresh gallery
    } catch (e) {
      logError('❌ Failed to set hover image:', e);
      setError('Failed to set hover image');
    }
  };

  // Navigation tabs
  const navTabs = (
    <div className="admin-nav-tabs">
      <Link
        to={`/admin/products/${id}`}
        className="admin-nav-tab"
      >
        📝 Product Detail
      </Link>
      <Link
        to={`/admin/products/${id}`}
        className="admin-nav-tab"
      >
        📦 Variants ({Array.isArray(product?.variants) ? product.variants.length : 0})
      </Link>
      <Link
        to={`/admin/products/${id}/tabs`}
        className="admin-nav-tab"
      >
        📋 Manage Tabs
      </Link>
      <Link
        to={`/admin/products/${id}/attachments`}
        className="admin-nav-tab"
      >
        📎 Manage Attachments
      </Link>
      <Link
        to={`/admin/products/${id}/gallery`}
        className="admin-nav-tab active"
      >
        📸 Gallery
      </Link>
      <Link
        to={`/admin/products/${id}/3d-model`}
        className="admin-nav-tab"
      >
        🎲 3D Model
      </Link>
      <Link
        to={`/admin/products/${id}/digital-file`}
        className="admin-nav-tab"
      >
        💾 Digital File
      </Link>
    </div>
  );

  return (
    <AdminLayout title="Product Gallery Management" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {loading ? (
            <div className="admin-card">Loading product...</div>
          ) : !product ? (
            <div className="admin-card">Product not found.</div>
          ) : (
            <div className="admin-card">
              {error && <div className="alert alert-error">{error}</div>}

              {/* Product Basic Info */}
              <div className="product-info-summary" style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
                      {product.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                      ID: {product.id} • Type: {product.productType} • Price: {product.price} {product.currency}
                    </p>
                    {product.description && (
                      <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#374151', maxWidth: 500 }}>
                        {product.description.length > 100
                          ? `${product.description.substring(0, 100)}...`
                          : product.description
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Gallery Management Section */}
              <div className="gallery-management-section">
                <div className="section-header" style={{ marginBottom: 16 }}>
                  <h3 className="section-title" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                    Image Gallery
                  </h3>
                  <p className="section-description" style={{ margin: '4px 0 0 0', fontSize: 14, color: '#6b7280' }}>
                    Upload and manage product images. Images are stored in DigitalOcean Spaces and organized by product ID.
                    The primary (main) image will be used as the main product image on the store.
                  </p>
                </div>
                <ProductGalleryUpload
                  productId={id || ''}
                  productName={product?.name || id || ''}
                  existingImages={[]}
                  onImagesChange={(images) => {
                    logInfo('Gallery images updated:', images);
                    // Refresh gallery images after upload
                    handleGalleryRefresh();
                  }}
                />
              </div>

              {/* Product Card Preview & Customization Section */}
              {Array.isArray(galleryImages) && galleryImages.length > 0 && fullProduct && (
                <div className="product-card-customization-section">
                  <div className="section-header" style={{ marginTop: 32, marginBottom: 16 }}>
                    <h3 className="section-title" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                      Product Card Preview & Customization
                    </h3>
                    <p className="section-description" style={{ margin: '4px 0 0 0', fontSize: 14, color: '#6b7280' }}>
                      Live preview of how the product card appears on your store (homepage, products page, wishlist).
                      Adjust zoom and position for perfect image framing.
                    </p>
                  </div>

                  {/* Image Picker */}
                  {!loadingGallery && (
                    <div className="image-picker-section" style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                        Select Image to Customize:
                      </label>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} role="group" aria-label="Product images gallery">
                        {galleryImages.map((image) => (
                          <div key={image.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleImageSelect(image.id)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleImageSelect(image.id);
                                }
                              }}
                              aria-label={`${image.originalName}${image.isPrimary ? ' - Main image' : ''}${selectedImage?.id === image.id ? ' - Currently selected' : ''}`}
                              aria-pressed={selectedImage?.id === image.id}
                              className="image-picker-button"
                              style={{
                                position: 'relative',
                                cursor: 'pointer',
                                border: selectedImage?.id === image.id ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                                borderRadius: 8,
                                overflow: 'hidden',
                                width: 120,
                                height: 120,
                                transition: 'all 0.2s',
                                padding: 0,
                                background: 'none'
                              }}
                            >
                              <img
                                src={image.cdnUrl || image.url}
                                alt=""
                                role="presentation"
                                loading="lazy"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block'
                                }}
                              />
                              {image.isPrimary && (
                                <div style={{
                                  position: 'absolute',
                                  top: 4,
                                  left: 4,
                                  background: '#f59e0b',
                                  color: '#fff',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 600
                                }}
                                aria-label="Main image badge">
                                  ⭐ Main
                                </div>
                              )}
                              {image.isHover && (
                                <div style={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  background: '#8b5cf6',
                                  color: '#fff',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 600
                                }}
                                aria-label="Hover image badge">
                                  👆 Hover
                                </div>
                              )}
                              {selectedImage?.id === image.id && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  background: 'rgba(59, 130, 246, 0.9)',
                                  color: '#fff',
                                  padding: 4,
                                  fontSize: 10,
                                  textAlign: 'center',
                                  fontWeight: 600
                                }}
                                aria-hidden="true">
                                  SELECTED
                                </div>
                              )}
                            </button>
                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: 4, width: 120 }}>
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(image.id)}
                                disabled={image.isPrimary || image.isHover}
                                title={image.isHover ? 'Cannot set hover image as primary' : image.isPrimary ? 'Already primary' : 'Set as primary image'}
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  fontSize: 9,
                                  fontWeight: 600,
                                  border: 'none',
                                  borderRadius: 4,
                                  background: (image.isPrimary || image.isHover) ? '#d1d5db' : '#f59e0b',
                                  color: '#fff',
                                  cursor: (image.isPrimary || image.isHover) ? 'not-allowed' : 'pointer',
                                  opacity: (image.isPrimary || image.isHover) ? 0.5 : 1
                                }}
                              >
                                ⭐
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetHover(image.id)}
                                disabled={image.isHover || image.isPrimary}
                                title={image.isPrimary ? 'Cannot set primary image as hover' : image.isHover ? 'Already hover' : 'Set as hover image'}
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  fontSize: 9,
                                  fontWeight: 600,
                                  border: 'none',
                                  borderRadius: 4,
                                  background: (image.isHover || image.isPrimary) ? '#d1d5db' : '#8b5cf6',
                                  color: '#fff',
                                  cursor: (image.isHover || image.isPrimary) ? 'not-allowed' : 'pointer',
                                  opacity: (image.isHover || image.isPrimary) ? 0.5 : 1
                                }}
                              >
                                👆
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Editor */}
                  {selectedImage && (
                    <ProductCardPreviewEditor
                      imageUrl={selectedImage.cdnUrl || selectedImage.url}
                      imageName={selectedImage.originalName}
                      product={fullProduct || undefined}
                      initialSettings={{
                        zoom: selectedImage.cardDisplayZoom || 1.0,
                        offsetX: selectedImage.cardDisplayOffsetX || 0,
                        offsetY: selectedImage.cardDisplayOffsetY || 0
                      }}
                      onSettingsChange={(settings) => {
                        logInfo('Settings changed:', settings);
                      }}
                      onSave={handleSettingsSave}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductGallery;
