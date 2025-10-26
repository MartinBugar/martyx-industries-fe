import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, Plus, X, Save, Trash2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminProductsService, type MasterProductDto, type ProductVariantDto, type VariantComponentDto } from '../../services/adminProductsService';
import { Button, Badge } from '../../components/ui';

const AdminProductDetail: React.FC = () => {
  const { t } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<MasterProductDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Active tab: product-info | variants
  const [activeTab, setActiveTab] = useState<'product-info' | 'variants'>('product-info');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminProductsService.getMasterProductById(id);
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

  const updateField = (key: keyof MasterProductDto, value: unknown) => {
    setSavedMsg(null);
    setProduct(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!product || !id) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const payload: MasterProductDto = { ...product };
      // Clean timestamps (read-only)
      delete (payload as Record<string, unknown>)['createdAt'];
      delete (payload as Record<string, unknown>)['updatedAt'];
      // Clean relationships (managed separately)
      delete (payload as Record<string, unknown>)['variants'];
      delete (payload as Record<string, unknown>)['gallery'];

      const updated = await adminProductsService.updateMasterProduct(id, payload);
      setProduct(updated);
      setSavedMsg('Master product updated successfully.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save product';
      setError(msg);
      setSavedMsg(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this master product and all its variants?')) return;
    setError(null);
    try {
      await adminProductsService.deleteMasterProduct(id);
      navigate('/admin/products');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete product';
      setError(msg);
    }
  };

  const getCategoryLabel = (cat?: string | null): string => {
    if (!cat) return '—';
    const labels: Record<string, string> = {
      MODEL_KIT: 'Model Kit',
      MERCHANDISE: 'Merchandise',
      ELECTRONICS: 'Electronics',
      ACCESSORIES: 'Accessories',
      DIGITAL_DOWNLOAD: 'Digital Download',
    };
    return labels[cat] || cat;
  };

  // Navigation tabs
  const navTabs = (
    <div className="admin-nav-tabs">
      <button
        onClick={() => setActiveTab('product-info')}
        className={`admin-nav-tab ${activeTab === 'product-info' ? 'active' : ''}`}
      >
        📝 Product Info
      </button>
      <button
        onClick={() => setActiveTab('variants')}
        className={`admin-nav-tab ${activeTab === 'variants' ? 'active' : ''}`}
      >
        <Package size={16} style={{ marginRight: 4 }} />
        Variants ({product?.variants?.length || 0})
      </button>
      <Link
        to={`/admin/products/${id}/gallery`}
        className="admin-nav-tab"
      >
        📸 Gallery
      </Link>
    </div>
  );

  return (
    <AdminLayout title={`Product: ${product?.name || 'Loading...'}`} navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h2 className="admin-title">{product?.name || 'Loading...'}</h2>
              <p className="admin-subtitle">Manage master product information and variants.</p>
            </div>
            <div>
              <Link to="/admin/products" className="btn btn-outline">← Back to Products</Link>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {savedMsg && <div className="alert alert-success">{savedMsg}</div>}

          {loading ? (
            <div className="admin-card">Loading product...</div>
          ) : !product ? (
            <div className="admin-card">Product not found.</div>
          ) : (
            <>
              {/* Product Info Tab */}
              {activeTab === 'product-info' && (
                <div className="admin-card">
                  <h3 className="section-title">Master Product Information</h3>
                  <div className="form-grid">
                    <div>
                      <label className="form-label">Name *</label>
                      <input
                        className="form-input"
                        value={product.name}
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">Slug (URL)</label>
                      <input
                        className="form-input"
                        value={product.slug || ''}
                        onChange={(e) => updateField('slug', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">Category</label>
                      <select
                        className="form-input"
                        value={product.productCategory || 'MODEL_KIT'}
                        onChange={(e) => updateField('productCategory', e.target.value)}
                      >
                        <option value="MODEL_KIT">Model Kit</option>
                        <option value="MERCHANDISE">Merchandise</option>
                        <option value="ELECTRONICS">Electronics</option>
                        <option value="ACCESSORIES">Accessories</option>
                        <option value="DIGITAL_DOWNLOAD">Digital Download</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Manufacturer</label>
                      <input
                        className="form-input"
                        value={product.manufacturer || ''}
                        onChange={(e) => updateField('manufacturer', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">Brand</label>
                      <input
                        className="form-input"
                        value={product.brand || ''}
                        onChange={(e) => updateField('brand', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">Warranty (months)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={product.warrantyMonths || 24}
                        onChange={(e) => updateField('warrantyMonths', Number(e.target.value))}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Short Description</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={product.shortDescription || ''}
                        onChange={(e) => updateField('shortDescription', e.target.value)}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Long Description</label>
                      <textarea
                        className="form-input"
                        rows={5}
                        value={product.longDescription || ''}
                        onChange={(e) => updateField('longDescription', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">Featured Image URL</label>
                      <input
                        className="form-input"
                        value={product.featuredImageUrl || ''}
                        onChange={(e) => updateField('featuredImageUrl', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="form-label">Video URL</label>
                      <input
                        className="form-input"
                        value={product.videoUrl || ''}
                        onChange={(e) => updateField('videoUrl', e.target.value)}
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div>
                      <label className="form-label">3D Model URL (.glb)</label>
                      <input
                        className="form-input"
                        value={product.model3dViewerUrl || ''}
                        onChange={(e) => updateField('model3dViewerUrl', e.target.value)}
                        placeholder="https://cdn.../model.glb"
                      />
                    </div>
                    <div>
                      <label className="form-label">Sort Order</label>
                      <input
                        type="number"
                        className="form-input"
                        value={product.sortOrder || 0}
                        onChange={(e) => updateField('sortOrder', Number(e.target.value))}
                      />
                    </div>

                    {/* Status Flags */}
                    <div style={{ gridColumn: '1 / -1', marginTop: 16 }}>
                      <h4 className="form-label" style={{ marginBottom: 12 }}>Status & Marketing</h4>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                          <input
                            type="checkbox"
                            checked={product.active ?? true}
                            onChange={(e) => updateField('active', e.target.checked)}
                            style={{ marginRight: 8 }}
                          />
                          Active
                        </label>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                          <input
                            type="checkbox"
                            checked={product.featured ?? false}
                            onChange={(e) => updateField('featured', e.target.checked)}
                            style={{ marginRight: 8 }}
                          />
                          Featured
                        </label>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                          <input
                            type="checkbox"
                            checked={product.bestseller ?? false}
                            onChange={(e) => updateField('bestseller', e.target.checked)}
                            style={{ marginRight: 8 }}
                          />
                          Bestseller
                        </label>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                          <input
                            type="checkbox"
                            checked={product.newProduct ?? false}
                            onChange={(e) => updateField('newProduct', e.target.checked)}
                            style={{ marginRight: 8 }}
                          />
                          New Product
                        </label>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                          <input
                            type="checkbox"
                            checked={product.requiresCeMarking ?? false}
                            onChange={(e) => updateField('requiresCeMarking', e.target.checked)}
                            style={{ marginRight: 8 }}
                          />
                          Requires CE Marking
                        </label>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div>
                      <label className="form-label">Created At</label>
                      <input
                        className="form-input"
                        value={product.createdAt ? new Date(product.createdAt).toLocaleString() : ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="form-label">Updated At</label>
                      <input
                        className="form-input"
                        value={product.updatedAt ? new Date(product.updatedAt).toLocaleString() : ''}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: 24 }}>
                    <Button variant="primary" onClick={handleSave} disabled={saving} loading={saving} icon={Save}>
                      Save Changes
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={saving} icon={Trash2}>
                      Delete Master Product
                    </Button>
                  </div>
                </div>
              )}

              {/* Variants Tab */}
              {activeTab === 'variants' && (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#6b7280' }}>
                      Manage product variants - different configurations with unique SKUs, pricing, and components.
                    </p>
                    <Button variant="primary" icon={Plus} disabled>
                      Add Variant (Coming Soon)
                    </Button>
                  </div>

                  {!product.variants || product.variants.length === 0 ? (
                    <div className="admin-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <Package size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
                      <h3 style={{ marginBottom: 8 }}>No Variants Yet</h3>
                      <p style={{ color: '#6b7280', marginBottom: 24 }}>
                        Create product variants to offer different configurations (e.g., Digital Edition, Full Kit).
                      </p>
                      <Button variant="primary" icon={Plus} disabled>
                        Create First Variant (Coming Soon)
                      </Button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {product.variants.map((variant, idx) => (
                        <VariantCard key={variant.id || idx} variant={variant} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

// Component to display a single variant with its components
const VariantCard: React.FC<{ variant: ProductVariantDto }> = ({ variant }) => {
  const [expanded, setExpanded] = useState(false);

  const getVariantTypeLabel = (type?: string | null): string => {
    if (!type) return '—';
    const labels: Record<string, string> = {
      DIGITAL_ONLY: 'Digital Only',
      PHYSICAL_ONLY: 'Physical Only',
      HYBRID: 'Hybrid (Digital + Physical)',
    };
    return labels[type] || type;
  };

  const getFulfillmentTypeLabel = (type?: string | null): string => {
    if (!type) return '—';
    const labels: Record<string, string> = {
      DIGITAL: 'Digital Delivery',
      PHYSICAL: 'Physical Shipping',
      MIXED: 'Mixed (Digital + Shipping)',
    };
    return labels[type] || type;
  };

  return (
    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{variant.variantName}</h4>
            <Badge variant="info" size="sm">{variant.sku}</Badge>
            <Badge variant={variant.active ? 'success' : 'warning'} size="sm">
              {variant.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: '14px', color: '#6b7280' }}>
            <span>€{variant.priceWithVat?.toFixed(2) || '0.00'} ({variant.currency})</span>
            <span>•</span>
            <span>{getVariantTypeLabel(variant.variantType)}</span>
            {variant.stockQuantity !== undefined && variant.stockQuantity !== null && (
              <>
                <span>•</span>
                <span>Stock: {variant.stockQuantity}</span>
              </>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm">
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ padding: '20px' }}>
          <div className="form-grid" style={{ marginBottom: 24 }}>
            <div>
              <label className="form-label">Variant Type</label>
              <div className="form-input" style={{ background: '#f9fafb' }}>
                {getVariantTypeLabel(variant.variantType)}
              </div>
            </div>
            <div>
              <label className="form-label">Fulfillment</label>
              <div className="form-input" style={{ background: '#f9fafb' }}>
                {getFulfillmentTypeLabel(variant.fulfillmentType)}
              </div>
            </div>
            <div>
              <label className="form-label">Price (with VAT)</label>
              <div className="form-input" style={{ background: '#f9fafb' }}>
                €{variant.priceWithVat?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <label className="form-label">Price (without VAT)</label>
              <div className="form-input" style={{ background: '#f9fafb' }}>
                €{variant.priceWithoutVat?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <label className="form-label">VAT Rate</label>
              <div className="form-input" style={{ background: '#f9fafb' }}>
                {variant.vatRate || 0}%
              </div>
            </div>
            <div>
              <label className="form-label">Currency</label>
              <div className="form-input" style={{ background: '#f9fafb' }}>
                {variant.currency || 'EUR'}
              </div>
            </div>
          </div>

          {/* Components - What's Included */}
          <div>
            <h4 style={{ marginBottom: 12, fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              📦 What's Included in This Variant
            </h4>
            {!variant.components || variant.components.length === 0 ? (
              <div style={{ padding: '12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '14px' }}>
                No components defined. Add components to specify what's included in this variant.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {variant.components.map((component, idx) => (
                  <div
                    key={component.id || idx}
                    style={{
                      padding: '12px 16px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>
                        {component.quantity && component.quantity > 1 ? `${component.quantity}× ` : ''}
                        {component.componentName}
                      </div>
                      {component.description && (
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {component.description}
                        </div>
                      )}
                    </div>
                    {component.componentType && (
                      <Badge
                        variant={component.componentType === 'DIGITAL' ? 'info' : 'success'}
                        size="sm"
                      >
                        {component.componentType}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
            <Button variant="outline" size="sm" disabled>
              Edit Variant (Coming Soon)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductDetail;
