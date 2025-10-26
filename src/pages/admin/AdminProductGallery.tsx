import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminProductsService, type BaseProduct } from '../../services/adminProductsService';
import ProductGalleryUpload from '../../components/ProductGalleryUpload/ProductGalleryUpload';

const AdminProductGallery: React.FC = () => {
    useTranslation('common');
  const { id } = useParams<{ id: string }>();

  // Debug: Log when component mounts
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🖼️ AdminProductGallery mounted with ID:', id);
      console.log('🖼️ Current URL:', window.location.pathname);
    }
  }, [id]);

  const [product, setProduct] = useState<BaseProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminProductsService.getProductById(id);
      setProduct(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load product';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
        to={`/admin/products/${id}/gallery`}
        className="admin-nav-tab active"
      >
        📸 Gallery
      </Link>
    </div>
  );

  return (
    <AdminLayout title="Product Gallery Management" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h2 className="admin-title">📸 Product Gallery Management</h2>
              <p className="admin-subtitle">
                Manage product images for: <strong>{product?.name || `Product ${id}`}</strong>
              </p>
            </div>
            <div>
              <Link to="/admin/products" className="btn btn-outline">Back to Products</Link>
            </div>
          </div>

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
                    The first image will be used as the main product image on the store.
                  </p>
                </div>
                <ProductGalleryUpload
                  productId={id || ''}
                  productName={product?.name || id || ''}
                  existingImages={[]}
                  onImagesChange={(images) => {
                    console.log('Gallery images updated:', images);
                    // Gallery images are now managed separately from product data
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductGallery;