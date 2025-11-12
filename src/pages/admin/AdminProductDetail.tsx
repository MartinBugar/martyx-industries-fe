import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Package, Plus, Save, Trash2, Edit } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import { adminProductsService, type MasterProductDto, type ProductVariantDto, type VariantComponentDto } from '../../services/adminProductsService';
import { Button, Badge } from '../../components/ui';
import VariantEditor from '../../components/admin/VariantEditor';
import ComponentEditor from '../../components/admin/ComponentEditor';

const AdminProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<MasterProductDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Active tab: product-info | variants
  const [activeTab, setActiveTab] = useState<'product-info' | 'variants'>('product-info');

  // Variant editor state
  const [showVariantEditor, setShowVariantEditor] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariantDto | null>(null);

  // Component editor state
  const [showComponentEditor, setShowComponentEditor] = useState(false);
  const [editingComponent, setEditingComponent] = useState<VariantComponentDto | null>(null);
  const [componentVariantId, setComponentVariantId] = useState<number | null>(null);

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
      // Clean timestamps (read-only) and relationships (managed separately)
      const cleanPayload: any = { ...payload };
      delete cleanPayload.createdAt;
      delete cleanPayload.updatedAt;
      delete cleanPayload.variants;
      delete cleanPayload.gallery;

      const updated = await adminProductsService.updateMasterProduct(id, cleanPayload);
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

  // Variant CRUD handlers
  const handleCreateVariant = () => {
    setEditingVariant(null);
    setShowVariantEditor(true);
  };

  const handleEditVariant = (variant: ProductVariantDto) => {
    setEditingVariant(variant);
    setShowVariantEditor(true);
  };

  const handleSaveVariant = async (variant: ProductVariantDto) => {
    try {
      if (variant.id) {
        await adminProductsService.updateVariant(variant.id, variant);
      } else {
        await adminProductsService.createVariant(Number(id), variant);
      }
      setShowVariantEditor(false);
      setEditingVariant(null);
      await load(); // Reload product to get updated variants
      setSavedMsg('Variant saved successfully!');
    } catch (e: any) {
      throw new Error(e.message || 'Failed to save variant');
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;
    try {
      await adminProductsService.deleteVariant(variantId);
      await load();
      setSavedMsg('Variant deleted successfully!');
    } catch (e: any) {
      setError(e.message || 'Failed to delete variant');
    }
  };

  // Component CRUD handlers
  const handleAddComponent = (variantId: number) => {
    setComponentVariantId(variantId);
    setEditingComponent(null);
    setShowComponentEditor(true);
  };

  const handleEditComponent = (component: VariantComponentDto, variantId: number) => {
    setComponentVariantId(variantId);
    setEditingComponent(component);
    setShowComponentEditor(true);
  };

  const handleSaveComponent = async (component: VariantComponentDto) => {
    if (componentVariantId === null) return;
    try {
      if (component.id) {
        await adminProductsService.updateComponent(component.id, component);
      } else {
        await adminProductsService.createComponent(componentVariantId, component);
      }
      setShowComponentEditor(false);
      setEditingComponent(null);
      setComponentVariantId(null);
      await load();
      setSavedMsg('Component saved successfully!');
    } catch (e: any) {
      throw new Error(e.message || 'Failed to save component');
    }
  };

  const handleDeleteComponent = async (componentId: number) => {
    if (!window.confirm('Are you sure you want to delete this component?')) return;
    try {
      await adminProductsService.deleteComponent(componentId);
      await load();
      setSavedMsg('Component deleted successfully!');
    } catch (e: any) {
      setError(e.message || 'Failed to delete component');
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
        className="admin-nav-tab"
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
    <AdminLayout title={`Product: ${product?.name || 'Loading...'}`} navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div className="header-actions">
              <Link to="/admin/products" className="btn btn-outline">
                ← Back to Products
              </Link>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error">{error}</div>
          )}
          {savedMsg && (
            <div className="alert alert-success">{savedMsg}</div>
          )}

          {loading ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '18px', color: '#666' }}>Loading product...</div>
            </div>
          ) : !product ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <h3 style={{ margin: '0 0 8px 0' }}>Product not found</h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                The product you're looking for doesn't exist or has been deleted.
              </p>
              <Link to="/admin/products" className="btn btn-primary">
                ← Back to Products
              </Link>
            </div>
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
                    <Button variant="primary" onClick={handleSave} disabled={saving} loading={saving}>
                      <Save size={14} style={{ marginRight: 4 }} />
                      Save Changes
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={saving}>
                      <Trash2 size={14} style={{ marginRight: 4 }} />
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
                      Manage product variants - different configurations with unique SKUs, pricing, components, and tabs.
                    </p>
                    <Button variant="primary" onClick={handleCreateVariant}>
                      <Plus size={14} style={{ marginRight: 4 }} />
                      Add Variant
                    </Button>
                  </div>

                  {!product.variants || product.variants.length === 0 ? (
                    <div className="admin-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <Package size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
                      <h3 style={{ marginBottom: 8 }}>No Variants Yet</h3>
                      <p style={{ color: '#6b7280', marginBottom: 24 }}>
                        Create product variants to offer different configurations (e.g., Digital Edition, Full Kit).
                      </p>
                      <Button variant="primary" onClick={handleCreateVariant}>
                        <Plus size={14} style={{ marginRight: 4 }} />
                        Create First Variant
                      </Button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {product.variants.map((variant, idx) => (
                        <VariantCard
                          key={variant.id || idx}
                          variant={variant}
                          productId={id!}
                          onEdit={() => handleEditVariant(variant)}
                          onDelete={() => variant.id && handleDeleteVariant(variant.id)}
                          onAddComponent={() => variant.id && handleAddComponent(variant.id)}
                          onEditComponent={(comp) => variant.id && handleEditComponent(comp, variant.id)}
                          onDeleteComponent={handleDeleteComponent}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showVariantEditor && (
        <VariantEditor
          variant={editingVariant}
          masterProductId={Number(id)}
          onSave={handleSaveVariant}
          onCancel={() => {
            setShowVariantEditor(false);
            setEditingVariant(null);
          }}
        />
      )}

      {showComponentEditor && componentVariantId && (
        <ComponentEditor
          component={editingComponent}
          variantId={componentVariantId}
          onSave={handleSaveComponent}
          onCancel={() => {
            setShowComponentEditor(false);
            setEditingComponent(null);
            setComponentVariantId(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

// Component to display a single variant with its components
interface VariantCardProps {
  variant: ProductVariantDto;
  productId: string;
  onEdit: () => void;
  onDelete: () => void;
  onAddComponent: () => void;
  onEditComponent: (component: VariantComponentDto) => void;
  onDeleteComponent: (componentId: number) => void;
}

const VariantCard: React.FC<VariantCardProps> = ({
  variant,
  productId,
  onEdit,
  onDelete,
  onAddComponent,
  onEditComponent,
  onDeleteComponent,
}) => {
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
    <div className="admin-card" style={{ marginBottom: '16px' }}>
      {/* Header - Clickable */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title & Badges Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                {variant.variantName}
              </h4>
              <Badge variant="info" size="sm">{variant.sku}</Badge>
              <Badge variant={variant.active ? 'success' : 'warning'} size="sm">
                {variant.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Info Row */}
            <div style={{ display: 'flex', gap: 16, fontSize: '14px', color: '#6b7280', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 500, color: '#374151' }}>
                €{variant.priceWithVat?.toFixed(2) || '0.00'}
              </span>
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

          {/* Action Buttons - Prevent click propagation */}
          <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <Link
              to={`/admin/products/${productId}/variants/${variant.id}/tabs`}
              className="btn btn-info btn-sm"
              style={{ textDecoration: 'none' }}
            >
              📋 Manage Tabs
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit size={14} style={{ marginRight: 4 }} />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ padding: '24px' }}>
          {/* Pricing & Details Grid */}
          <div style={{ marginBottom: 32 }}>
            <h5 className="section-title" style={{ fontSize: '14px' }}>
              Details
            </h5>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              background: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 4 }}>Type</div>
                <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                  {getVariantTypeLabel(variant.variantType)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 4 }}>Fulfillment</div>
                <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                  {getFulfillmentTypeLabel(variant.fulfillmentType)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 4 }}>Price (with VAT)</div>
                <div style={{ fontSize: '14px', color: '#10B981', fontWeight: 600 }}>
                  €{variant.priceWithVat?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 4 }}>Price (no VAT)</div>
                <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                  €{variant.priceWithoutVat?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 4 }}>VAT Rate</div>
                <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                  {variant.vatRate || 0}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 4 }}>Currency</div>
                <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                  {variant.currency || 'EUR'}
                </div>
              </div>
            </div>
          </div>

          {/* Components Section */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <h5 className="section-title" style={{ fontSize: '14px' }}>
                Components ({variant.components?.length || 0})
              </h5>
              <Button
                variant="primary"
                size="sm"
                onClick={onAddComponent}
              >
                <Plus size={14} style={{ marginRight: 4 }} />
                Add
              </Button>
            </div>

            {!variant.components || variant.components.length === 0 ? (
              <div style={{
                padding: '24px',
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#92400e',
                textAlign: 'center'
              }}>
                No components yet. Click "Add" to define what's included in this variant.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {variant.components.map((component, idx) => (
                  <div
                    key={component.id || idx}
                    style={{
                      padding: '14px 16px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'border-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, marginBottom: 2, color: '#1f2937', fontSize: '14px' }}>
                        {component.quantity && component.quantity > 1 ? `${component.quantity}× ` : ''}
                        {component.componentName}
                      </div>
                      {component.description && (
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {component.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {component.componentType && (
                        <Badge
                          variant={component.componentType.includes('DIGITAL') || component.componentType.includes('STL') || component.componentType.includes('SOFTWARE') || component.componentType.includes('GUIDE') || component.componentType.includes('BOM') ? 'info' : 'success'}
                          size="sm"
                        >
                          {component.componentType}
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditComponent(component)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => component.id && onDeleteComponent(component.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Action */}
          <div style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <Button variant="danger" size="sm" onClick={onDelete}>
              <Trash2 size={14} style={{ marginRight: 4 }} />
              Delete Variant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductDetail;
