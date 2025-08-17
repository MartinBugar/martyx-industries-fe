import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminProductsService, type BaseProduct, type DigitalProduct, type PhysicalProduct } from '../../services/adminProductsService';

const AdminProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<BaseProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);


  const productType = String(product?.productType ?? 'DIGITAL').toUpperCase();
  const phys: PhysicalProduct | null = productType === 'PHYSICAL' ? (product as PhysicalProduct) : null;
  const digi: DigitalProduct | null = productType === 'DIGITAL' ? (product as DigitalProduct) : null;

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

  const updateField = (key: string, value: unknown) => {
    setSavedMsg(null);
    setProduct(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!product || !id) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const payload: Record<string, unknown> = { ...product };
      // Clean optional text fields: turn empty strings into undefined to avoid validation issues
      ([
        'sku',
        'category',
        'description',
        'currency',
        'imageUrl',
        // physical
        'dimensions', 'material', 'countryOfOrigin',
        // digital
        'downloadUrl', 'fileFormat', 'licenseInfo', 'version', 'fileName',
      ] as const).forEach((k) => {
        if (payload[k] === '') (payload as Record<string, unknown>)[k] = undefined;
      });
      // Strip read-only/large fields
      delete (payload as Record<string, unknown>)['createdAt'];
      delete (payload as Record<string, unknown>)['updatedAt'];
      delete (payload as Record<string, unknown>)['fileContent'];

      let updated: BaseProduct;
      const type = (product.productType as string)?.toUpperCase();
      if (type === 'PHYSICAL') {
        updated = await adminProductsService.updatePhysicalProduct(id, payload as PhysicalProduct);
      } else {
        // default to digital
        updated = await adminProductsService.updateDigitalProduct(id, payload as DigitalProduct);
      }
      setProduct(updated);
      setSavedMsg('Changes saved successfully.');
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
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setError(null);
    try {
      await adminProductsService.deleteProduct(id);
      navigate('/admin/products');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete product';
      setError(msg);
    }
  };

  return (
    <AdminLayout title={`Product Detail`}>
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h2 className="admin-title">Product Detail</h2>
              <p className="admin-subtitle">View and edit product information.</p>
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
              {savedMsg && <div className="alert alert-success">{savedMsg}</div>}
              <div className="form-grid">
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={String(product.productType ?? 'DIGITAL')} disabled>
                    <option value="DIGITAL">Digital</option>
                    <option value="PHYSICAL">Physical</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Name</label>
                  <input className="form-input" value={String(product.name ?? '')} onChange={(e) => updateField('name', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">SKU</label>
                  <input className="form-input" value={String(product.sku ?? '')} onChange={(e) => updateField('sku', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <input className="form-input" value={String(product.category ?? '')} onChange={(e) => updateField('category', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={typeof product.price === 'number' ? product.price : ''}
                    onChange={(e) => updateField('price', e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="form-label">Currency</label>
                  <input className="form-input" value={String(product.currency ?? '')} onChange={(e) => updateField('currency', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Image URL</label>
                  <input className="form-input" value={String(product.imageUrl ?? '')} onChange={(e) => updateField('imageUrl', e.target.value)} placeholder="https://..." />
                </div>
                {product.imageUrl ? (
                  <div>
                    <label className="form-label">Preview</label>
                    <img src={String(product.imageUrl)} alt="Preview" style={{ display: 'block', maxWidth: 180, maxHeight: 120, borderRadius: 6, border: '1px solid #e5e7eb' }} />
                  </div>
                ) : null}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={4} value={String(product.description ?? '')} onChange={(e) => updateField('description', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Active</label>
                  <select className="form-input" value={String(product.active ?? true)} onChange={(e) => updateField('active', e.target.value === 'true')}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Created At</label>
                  <input className="form-input" value={product.createdAt ? new Date(product.createdAt).toLocaleString() : ''} readOnly />
                </div>
                <div>
                  <label className="form-label">Updated At</label>
                  <input className="form-input" value={product.updatedAt ? new Date(product.updatedAt).toLocaleString() : ''} readOnly />
                </div>
              </div>

              {/* Conditional sections */}
              {productType === 'PHYSICAL' ? (
                <div className="admin-card" style={{ marginTop: 16 }}>
                  <h3 className="section-title">Physical Product Details</h3>
                  <div className="form-grid">
                    <div>
                      <label className="form-label">Stock Quantity</label>
                      <input type="number" className="form-input" value={typeof phys?.stockQuantity === 'number' ? (phys?.stockQuantity ?? '') : ''} onChange={(e) => updateField('stockQuantity', e.target.value === '' ? undefined : Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="form-label">Weight (g)</label>
                      <input type="number" className="form-input" value={typeof phys?.weight === 'number' ? (phys?.weight ?? '') : ''} onChange={(e) => updateField('weight', e.target.value === '' ? undefined : Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="form-label">Dimensions (LxWxH cm)</label>
                      <input className="form-input" value={String(phys?.dimensions ?? '')} onChange={(e) => updateField('dimensions', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Material</label>
                      <input className="form-input" value={String(phys?.material ?? '')} onChange={(e) => updateField('material', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Country of Origin</label>
                      <input className="form-input" value={String(phys?.countryOfOrigin ?? '')} onChange={(e) => updateField('countryOfOrigin', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Shipping Time (days)</label>
                      <input type="number" className="form-input" value={typeof phys?.shippingTime === 'number' ? (phys?.shippingTime ?? '') : ''} onChange={(e) => updateField('shippingTime', e.target.value === '' ? undefined : Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="admin-card" style={{ marginTop: 16 }}>
                  <h3 className="section-title">Digital Product Details</h3>
                  <div className="form-grid">
                    <div>
                      <label className="form-label">Download URL</label>
                      <input className="form-input" value={String(digi?.downloadUrl ?? '')} onChange={(e) => updateField('downloadUrl', e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="form-label">File Size (bytes)</label>
                      <input type="number" className="form-input" value={typeof digi?.fileSize === 'number' ? (digi?.fileSize ?? '') : ''} onChange={(e) => updateField('fileSize', e.target.value === '' ? undefined : Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="form-label">File Format</label>
                      <input className="form-input" value={String(digi?.fileFormat ?? '')} onChange={(e) => updateField('fileFormat', e.target.value)} placeholder="PDF, MP3, ZIP..." />
                    </div>
                    <div>
                      <label className="form-label">License Info</label>
                      <input className="form-input" value={String(digi?.licenseInfo ?? '')} onChange={(e) => updateField('licenseInfo', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Version</label>
                      <input className="form-input" value={String(digi?.version ?? '')} onChange={(e) => updateField('version', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">File Name</label>
                      <input className="form-input" value={String(digi?.fileName ?? '')} onChange={(e) => updateField('fileName', e.target.value)} placeholder="archive.zip" />
                    </div>
                    <div>
                      <label className="form-label">File Content</label>
                      <input className="form-input" value={digi?.fileContent ? 'Present' : ''} readOnly />
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: 16 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductDetail;
