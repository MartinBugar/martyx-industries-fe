import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Save, Trash2, Edit, Package } from 'lucide-react';
import AdminLayout from './AdminLayout';
import ProductNavTabs from '../../components/admin/ProductNavTabs';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import './AdminProductDetail.css';
import { adminProductsService, type MasterProductDto, type ProductVariantDto, type VariantComponentDto } from '../../services/adminProductsService';
import { Button, Badge, ConfirmDialog, useConfirmDialog } from '../../components/ui';
import VariantEditor from '../../components/admin/VariantEditor';
import ComponentEditor from '../../components/admin/ComponentEditor';
import CategorySelector from '../../components/admin/CategorySelector';

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

  // Confirm dialog
  const { confirm, dialogProps } = useConfirmDialog({
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete?',
    variant: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save variant';
      throw new Error(message);
    }
  };

  const handleDeleteVariant = useCallback(async (variantId: number) => {
    const confirmed = await confirm({
      title: 'Delete Variant',
      message: 'Are you sure you want to delete this variant?',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    try {
      await adminProductsService.deleteVariant(variantId);
      await load();
      setSavedMsg('Variant deleted successfully!');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete variant';
      setError(message);
    }
  }, [confirm]);

  const handleToggleVariantActive = useCallback(async (variantId: number, currentActive: boolean) => {
    // Show confirmation dialog when disabling a variant
    if (currentActive) {
      const confirmed = await confirm({
        title: 'Disable Variant',
        message: 'Are you sure you want to disable this variant?\n\nDisabled variants will not be visible in the public store, but all data will be preserved. You can re-enable it at any time.',
        variant: 'warning',
        confirmText: 'Disable',
        cancelText: 'Cancel'
      });
      if (!confirmed) return;
    }

    try {
      const result = await adminProductsService.toggleVariantActive(variantId);
      await load();
      setSavedMsg(result.message);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to toggle variant status';
      setError(message);
    }
  }, [confirm]);

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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save component';
      throw new Error(message);
    }
  };

  const handleDeleteComponent = useCallback(async (componentId: number) => {
    const confirmed = await confirm({
      title: 'Delete Component',
      message: 'Are you sure you want to delete this component?',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    try {
      await adminProductsService.deleteComponent(componentId);
      await load();
      setSavedMsg('Component deleted successfully!');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete component';
      setError(message);
    }
  }, [confirm]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirmed = await confirm({
      title: 'Delete Master Product',
      message: 'Are you sure you want to delete this master product and all its variants?',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    setError(null);
    try {
      await adminProductsService.deleteMasterProduct(id);
      navigate('/admin/products');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete product';
      setError(msg);
    }
  }, [id, confirm, navigate]);

  // Navigation tabs
  const navTabs = (
    <ProductNavTabs
      productId={id!}
      activeTab={activeTab}
      variantCount={product?.variants?.length || 0}
      onTabClick={setActiveTab}
    />
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
            <div className="admin-card admin-product-detail-loading">
              <div className="admin-product-detail-loading-text">Loading product...</div>
            </div>
          ) : !product ? (
            <div className="admin-card admin-product-detail-loading">
              <div className="admin-product-detail-empty-icon">📦</div>
              <h3 className="admin-product-detail-empty-title">Product not found</h3>
              <p className="admin-product-detail-empty-desc">
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
                    <div className="admin-product-detail-full-width">
                      <label className="form-label">Short Description</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={product.shortDescription || ''}
                        onChange={(e) => updateField('shortDescription', e.target.value)}
                      />
                    </div>
                    <div className="admin-product-detail-full-width">
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

                    {/* Category Assignment */}
                    <div className="admin-product-detail-category-section">
                      {id && <CategorySelector productId={parseInt(id)} />}
                    </div>

                    {/* Status Flags */}
                    <div className="admin-product-detail-status-section">
                      <h4 className="form-label admin-product-detail-status-heading">Status & Marketing</h4>
                      <div className="admin-product-detail-status-row">
                        <label className="form-label admin-product-detail-checkbox-label">
                          <input
                            type="checkbox"
                            checked={product.active ?? true}
                            onChange={(e) => updateField('active', e.target.checked)}
                            className="admin-product-detail-checkbox"
                          />
                          Active
                        </label>
                        <label className="form-label admin-product-detail-checkbox-label">
                          <input
                            type="checkbox"
                            checked={product.featured ?? false}
                            onChange={(e) => updateField('featured', e.target.checked)}
                            className="admin-product-detail-checkbox"
                          />
                          Featured
                        </label>
                        <label className="form-label admin-product-detail-checkbox-label">
                          <input
                            type="checkbox"
                            checked={product.bestseller ?? false}
                            onChange={(e) => updateField('bestseller', e.target.checked)}
                            className="admin-product-detail-checkbox"
                          />
                          Bestseller
                        </label>
                        <label className="form-label admin-product-detail-checkbox-label">
                          <input
                            type="checkbox"
                            checked={product.newProduct ?? false}
                            onChange={(e) => updateField('newProduct', e.target.checked)}
                            className="admin-product-detail-checkbox"
                          />
                          New Product
                        </label>
                        <label className="form-label admin-product-detail-checkbox-label">
                          <input
                            type="checkbox"
                            checked={product.requiresCeMarking ?? false}
                            onChange={(e) => updateField('requiresCeMarking', e.target.checked)}
                            className="admin-product-detail-checkbox"
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

                  <div className="form-actions admin-product-detail-form-actions">
                    <Button variant="primary" onClick={handleSave} disabled={saving} loading={saving}>
                      <Save size={14} className="admin-product-detail-icon-mr" />
                      Save Changes
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={saving}>
                      <Trash2 size={14} className="admin-product-detail-icon-mr" />
                      Delete Master Product
                    </Button>
                  </div>
                </div>
              )}

              {/* Variants Tab */}
              {activeTab === 'variants' && (
                <div>
                  <div className="admin-product-detail-variants-header">
                    <p className="admin-product-detail-variants-desc">
                      Manage product variants - different configurations with unique SKUs, pricing, components, and tabs.
                    </p>
                    <Button variant="primary" onClick={handleCreateVariant}>
                      <Plus size={14} className="admin-product-detail-icon-mr" />
                      Add Variant
                    </Button>
                  </div>

                  {!product.variants || product.variants.length === 0 ? (
                    <div className="admin-card admin-product-detail-variants-empty">
                      <Package size={48} className="admin-product-detail-variants-empty-icon" />
                      <h3 className="admin-product-detail-variants-empty-title">No Variants Yet</h3>
                      <p className="admin-product-detail-variants-empty-desc">
                        Create product variants to offer different configurations (e.g., Digital Edition, Full Kit).
                      </p>
                      <Button variant="primary" onClick={handleCreateVariant}>
                        <Plus size={14} className="admin-product-detail-icon-mr" />
                        Create First Variant
                      </Button>
                    </div>
                  ) : (
                    <div className="admin-product-detail-variants-grid">
                      {product.variants.map((variant, idx) => (
                        <VariantCard
                          key={variant.id || idx}
                          variant={variant}
                          productId={id!}
                          onEdit={() => handleEditVariant(variant)}
                          onDelete={() => variant.id && handleDeleteVariant(variant.id)}
                          onToggleActive={() => variant.id && handleToggleVariantActive(variant.id, variant.active ?? true)}
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
          masterProductName={product?.name}
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

      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  );
};

// Component to display a single variant with its components
interface VariantCardProps {
  variant: ProductVariantDto;
  productId: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onAddComponent: () => void;
  onEditComponent: (component: VariantComponentDto) => void;
  onDeleteComponent: (componentId: number) => void;
}

const VariantCard: React.FC<VariantCardProps> = ({
  variant,
  productId,
  onEdit,
  onDelete,
  onToggleActive,
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
    <div
      className={`admin-card ${variant.active ? 'admin-product-detail-variant-card' : 'admin-product-detail-variant-card-disabled'}`}
    >
      {/* Header - Clickable */}
      <div
        className={`admin-product-detail-variant-header ${!variant.active ? 'admin-product-detail-variant-header-disabled' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="admin-product-detail-variant-header-row">
          <div className="admin-product-detail-variant-info">
            {/* Title & Badges Row */}
            <div className="admin-product-detail-variant-title-row">
              <h4 className="admin-product-detail-variant-name">
                {variant.variantName}
              </h4>
              <Badge variant="info" size="sm">{variant.sku}</Badge>
              <Badge variant={variant.active ? 'success' : 'warning'} size="sm">
                {variant.active ? 'Active' : 'Disabled'}
              </Badge>
            </div>

            {/* Info Row */}
            <div className="admin-product-detail-variant-meta">
              <span className="admin-product-detail-variant-price">
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
          <div className="admin-product-detail-variant-actions" onClick={(e) => e.stopPropagation()}>
            <Button
              variant={variant.active ? 'danger' : 'info'}
              size="sm"
              onClick={onToggleActive}
              title={variant.active ? 'Disable variant (hide from store)' : 'Enable variant (show in store)'}
            >
              {variant.active ? '👁️ Disable' : '✅ Enable'}
            </Button>
            <Link
              to={`/admin/products/${productId}/variants/${variant.id}/tabs`}
              className="btn btn-info btn-sm admin-product-detail-manage-tabs-link"
            >
              📋 Manage Tabs
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit size={14} className="admin-product-detail-icon-mr" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="admin-product-detail-variant-expanded">
          {/* Pricing & Details Grid */}
          <div className="admin-product-detail-details-section">
            <h5 className="section-title admin-product-detail-details-title">
              Details
            </h5>
            <div className="admin-product-detail-details-grid">
              <div>
                <div className="admin-product-detail-detail-label">Type</div>
                <div className="admin-product-detail-detail-value">
                  {getVariantTypeLabel(variant.variantType)}
                </div>
              </div>
              <div>
                <div className="admin-product-detail-detail-label">Fulfillment</div>
                <div className="admin-product-detail-detail-value">
                  {getFulfillmentTypeLabel(variant.fulfillmentType)}
                </div>
              </div>
              <div>
                <div className="admin-product-detail-detail-label">Price (with VAT)</div>
                <div className="admin-product-detail-detail-value-price">
                  €{variant.priceWithVat?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div>
                <div className="admin-product-detail-detail-label">Price (no VAT)</div>
                <div className="admin-product-detail-detail-value">
                  €{variant.priceWithoutVat?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div>
                <div className="admin-product-detail-detail-label">VAT Rate</div>
                <div className="admin-product-detail-detail-value">
                  {variant.vatRate || 0}%
                </div>
              </div>
              <div>
                <div className="admin-product-detail-detail-label">Currency</div>
                <div className="admin-product-detail-detail-value">
                  {variant.currency || 'EUR'}
                </div>
              </div>
            </div>
          </div>

          {/* Components Section */}
          <div>
            <div className="admin-product-detail-components-header">
              <h5 className="section-title admin-product-detail-components-title">
                Components ({variant.components?.length || 0})
              </h5>
              <Button
                variant="primary"
                size="sm"
                onClick={onAddComponent}
              >
                <Plus size={14} className="admin-product-detail-icon-mr" />
                Add
              </Button>
            </div>

            {!variant.components || variant.components.length === 0 ? (
              <div className="admin-product-detail-components-empty">
                No components yet. Click "Add" to define what's included in this variant.
              </div>
            ) : (
              <div className="admin-product-detail-components-grid">
                {variant.components.map((component, idx) => (
                  <div
                    key={component.id || idx}
                    className="admin-product-detail-component-item"
                  >
                    <div className="admin-product-detail-component-info">
                      <div className="admin-product-detail-component-name">
                        {component.quantity && component.quantity > 1 ? `${component.quantity}× ` : ''}
                        {component.componentName}
                      </div>
                      {component.description && (
                        <div className="admin-product-detail-component-desc">
                          {component.description}
                        </div>
                      )}
                    </div>
                    <div className="admin-product-detail-component-actions">
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
          <div className="admin-product-detail-delete-action">
            <Button variant="danger" size="sm" onClick={onDelete}>
              <Trash2 size={14} className="admin-product-detail-icon-mr" />
              Delete Variant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductDetail;
