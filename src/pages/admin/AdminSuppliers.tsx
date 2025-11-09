import React, { useEffect, useState } from 'react';
import { Building2, Plus, X, Edit, Phone, Mail, MapPin } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css';
import './AdminButtonOverrides.css';
import { adminSupplierService, type PageResponse } from '../../services/adminSupplierService';
import type { SupplierDto } from '../../types/inventory';
import { Badge, Button, SkeletonTable } from '../../components/ui';

type CreateSupplierData = {
  supplier_name: string;
  supplier_code: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  company_id?: string;
  tax_id?: string;
  vat_id?: string;
  payment_terms?: string;
  supplier_rating?: number;
  is_active: boolean;
  notes?: string;
};

const initialCreate: CreateSupplierData = {
  supplier_name: '',
  supplier_code: '',
  is_active: true,
};

const AdminSuppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'all-suppliers' | 'create-supplier'>('all-suppliers');

  // Filter/search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create/Edit form state
  const [createData, setCreateData] = useState<CreateSupplierData>({ ...initialCreate });
  const [creating, setCreating] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadSuppliers = async (pageNum: number = page, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse: PageResponse<SupplierDto> = await adminSupplierService.getAllSuppliers(
        pageNum,
        20,
        'supplier_name',
        'ASC',
        search
      );
      setSuppliers(pageResponse.content);
      setTotalPages(pageResponse.totalPages);
      setTotalElements(pageResponse.totalElements);
      setPage(pageResponse.number);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load suppliers';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers(0, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const resetCreate = () => {
    setCreateData({ ...initialCreate });
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!createData.supplier_name?.trim()) {
      setError('Supplier name is required');
      return;
    }

    if (!createData.supplier_code?.trim()) {
      setError('Supplier code is required');
      return;
    }

    setCreating(true);
    try {
      const payload: Partial<SupplierDto> = {
        supplier_name: createData.supplier_name.trim(),
        supplier_code: createData.supplier_code.trim().toUpperCase(),
        contact_person: createData.contact_person?.trim() || undefined,
        email: createData.email?.trim() || undefined,
        phone: createData.phone?.trim() || undefined,
        street: createData.street?.trim() || undefined,
        city: createData.city?.trim() || undefined,
        postal_code: createData.postal_code?.trim() || undefined,
        country: createData.country?.trim() || undefined,
        company_id: createData.company_id?.trim() || undefined,
        tax_id: createData.tax_id?.trim() || undefined,
        vat_id: createData.vat_id?.trim() || undefined,
        payment_terms: createData.payment_terms?.trim() || undefined,
        supplier_rating: createData.supplier_rating,
        is_active: createData.is_active,
        notes: createData.notes?.trim() || undefined,
      };

      if (editingId) {
        await adminSupplierService.updateSupplier(editingId, payload as SupplierDto);
      } else {
        await adminSupplierService.createSupplier(payload as SupplierDto);
      }

      await loadSuppliers(0, searchQuery);
      resetCreate();
      setActiveTab('all-suppliers');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : editingId ? 'Failed to update supplier' : 'Failed to create supplier';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (supplier: SupplierDto) => {
    setEditingId(supplier.id);
    setCreateData({
      supplier_name: supplier.supplier_name,
      supplier_code: supplier.supplier_code,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      street: supplier.street || '',
      city: supplier.city || '',
      postal_code: supplier.postal_code || '',
      country: supplier.country || '',
      company_id: supplier.company_id || '',
      tax_id: supplier.tax_id || '',
      vat_id: supplier.vat_id || '',
      payment_terms: supplier.payment_terms || '',
      supplier_rating: supplier.supplier_rating,
      is_active: supplier.is_active,
      notes: supplier.notes || '',
    });
    setActiveTab('create-supplier');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    setError(null);
    try {
      await adminSupplierService.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete supplier';
      setError(msg);
    }
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'all-suppliers' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('all-suppliers');
          resetCreate();
        }}
        aria-label="View all suppliers"
      >
        <Building2 size={16} />
        All Suppliers
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'create-supplier' ? 'active' : ''}`}
        onClick={() => setActiveTab('create-supplier')}
        aria-label="Create new supplier"
      >
        <Plus size={16} />
        {editingId ? 'Edit Supplier' : 'Create New'}
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Suppliers" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Create/Edit Supplier Tab */}
          {activeTab === 'create-supplier' && (
            <div className="admin-card">
              <h3 className="section-title">{editingId ? 'Edit Supplier' : 'Create New Supplier'}</h3>
              <form onSubmit={handleCreate} className="form-grid">
                <div>
                  <label className="form-label">Supplier Name *</label>
                  <input
                    className="form-input"
                    value={createData.supplier_name}
                    onChange={(e) => setCreateData({ ...createData, supplier_name: e.target.value })}
                    placeholder="e.g., Acme Supplies Ltd."
                    required
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="form-label">Supplier Code *</label>
                  <input
                    className="form-input"
                    value={createData.supplier_code}
                    onChange={(e) => setCreateData({ ...createData, supplier_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., ACME001"
                    required
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="form-label">Contact Person</label>
                  <input
                    className="form-input"
                    value={createData.contact_person || ''}
                    onChange={(e) => setCreateData({ ...createData, contact_person: e.target.value })}
                    placeholder="John Doe"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={createData.email || ''}
                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                    placeholder="contact@supplier.com"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    type="tel"
                    value={createData.phone || ''}
                    onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
                    placeholder="+421 900 000 000"
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="form-label">Street Address</label>
                  <input
                    className="form-input"
                    value={createData.street || ''}
                    onChange={(e) => setCreateData({ ...createData, street: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="form-label">City</label>
                  <input
                    className="form-input"
                    value={createData.city || ''}
                    onChange={(e) => setCreateData({ ...createData, city: e.target.value })}
                    placeholder="Bratislava"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="form-label">Postal Code</label>
                  <input
                    className="form-input"
                    value={createData.postal_code || ''}
                    onChange={(e) => setCreateData({ ...createData, postal_code: e.target.value })}
                    placeholder="12345"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <input
                    className="form-input"
                    value={createData.country || ''}
                    onChange={(e) => setCreateData({ ...createData, country: e.target.value })}
                    placeholder="Slovakia"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="form-label">Company ID (IČO)</label>
                  <input
                    className="form-input"
                    value={createData.company_id || ''}
                    onChange={(e) => setCreateData({ ...createData, company_id: e.target.value })}
                    placeholder="12345678"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="form-label">Tax ID (DIČ)</label>
                  <input
                    className="form-input"
                    value={createData.tax_id || ''}
                    onChange={(e) => setCreateData({ ...createData, tax_id: e.target.value })}
                    placeholder="1234567890"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="form-label">VAT ID (IČ DPH)</label>
                  <input
                    className="form-input"
                    value={createData.vat_id || ''}
                    onChange={(e) => setCreateData({ ...createData, vat_id: e.target.value })}
                    placeholder="SK1234567890"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="form-label">Payment Terms</label>
                  <input
                    className="form-input"
                    value={createData.payment_terms || ''}
                    onChange={(e) => setCreateData({ ...createData, payment_terms: e.target.value })}
                    placeholder="Net 30"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="form-label">Supplier Rating (1-5)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={createData.supplier_rating || ''}
                    onChange={(e) => setCreateData({
                      ...createData,
                      supplier_rating: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="4.5"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={createData.notes || ''}
                    onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
                    placeholder="Internal notes about this supplier..."
                  />
                </div>
                <div>
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={createData.is_active ?? true}
                      onChange={(e) => setCreateData({ ...createData, is_active: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    Active
                  </label>
                </div>
                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                  <Button variant="primary" type="submit" disabled={creating} loading={creating}>
                    {editingId ? 'Update Supplier' : 'Create Supplier'}
                  </Button>
                  <Button variant="outline" type="button" onClick={resetCreate} disabled={creating}>
                    {editingId ? 'Cancel' : 'Clear'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* All Suppliers Tab */}
          {activeTab === 'all-suppliers' && (
            <>
              <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
              </div>

              {/* Mobile Card Layout */}
              <div className="mobile-table-cards">
                {loading ? (
                  <div className="mobile-table-card">
                    <SkeletonTable rows={5} columns={4} />
                  </div>
                ) : suppliers.length === 0 ? (
                  <div className="mobile-table-card">
                    <div className="table-empty">No suppliers found.</div>
                  </div>
                ) : (
                  suppliers.map(s => (
                    <div key={`mobile-${s.id}`} className="mobile-table-card">
                      <div className="mobile-card-header">
                        <div>
                          <h4 className="mobile-card-title">{s.supplier_name}</h4>
                          <p className="mobile-card-subtitle">{s.supplier_code}</p>
                        </div>
                        <div className="mobile-card-actions">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(s)} title="Edit supplier">
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)} title="Delete">
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                      <div className="mobile-card-body">
                        {s.contact_person && (
                          <div className="mobile-field">
                            <span className="mobile-field-label">Contact:</span>
                            <span className="mobile-field-value">{s.contact_person}</span>
                          </div>
                        )}
                        {s.email && (
                          <div className="mobile-field">
                            <span className="mobile-field-label">Email:</span>
                            <span className="mobile-field-value">{s.email}</span>
                          </div>
                        )}
                        {s.phone && (
                          <div className="mobile-field">
                            <span className="mobile-field-label">Phone:</span>
                            <span className="mobile-field-value">{s.phone}</span>
                          </div>
                        )}
                        <div className="mobile-field">
                          <span className="mobile-field-label">Status:</span>
                          <span className="mobile-field-value">
                            <Badge variant={s.is_active ? 'success' : 'warning'} size="sm">
                              {s.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table Layout */}
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Supplier Name</th>
                      <th>Code</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Location</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th style={{ width: 120 }} className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="table-empty">
                        <SkeletonTable rows={5} columns={9} />
                      </td></tr>
                    ) : suppliers.length === 0 ? (
                      <tr><td colSpan={9} className="table-empty">No suppliers found.</td></tr>
                    ) : (
                      suppliers.map(s => (
                        <tr key={s.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{s.supplier_name}</div>
                            {s.company_id && (
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>IČO: {s.company_id}</div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>{s.supplier_code}</div>
                          </td>
                          <td>{s.contact_person || '—'}</td>
                          <td>
                            {s.email ? (
                              <a href={`mailto:${s.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                <Mail size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                {s.email}
                              </a>
                            ) : '—'}
                          </td>
                          <td>
                            {s.phone ? (
                              <a href={`tel:${s.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                <Phone size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                {s.phone}
                              </a>
                            ) : '—'}
                          </td>
                          <td>
                            {s.city || s.country ? (
                              <div style={{ fontSize: '13px' }}>
                                <MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                {s.city}{s.city && s.country && ', '}{s.country}
                              </div>
                            ) : '—'}
                          </td>
                          <td>
                            {s.supplier_rating ? (
                              <span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(s.supplier_rating))}</span>
                            ) : '—'}
                          </td>
                          <td>
                            <Badge variant={s.is_active ? 'success' : 'warning'} size="sm">
                              {s.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(s)} title="Edit supplier">
                                <Edit size={14} />
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)} title="Delete">
                                <X size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-controls" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Showing {suppliers.length > 0 ? (page * 20 + 1) : 0} - {Math.min((page + 1) * 20, totalElements)} of {totalElements} suppliers
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSuppliers(page - 1, searchQuery)}
                      disabled={page === 0 || loading}
                    >
                      Previous
                    </Button>
                    <span style={{ padding: '8px 12px', fontSize: '14px', color: '#374151' }}>
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSuppliers(page + 1, searchQuery)}
                      disabled={page >= totalPages - 1 || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSuppliers;
