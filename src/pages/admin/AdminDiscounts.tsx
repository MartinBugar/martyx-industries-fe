import React, {useEffect, useState} from 'react';
import {Clock, Plus, Ticket, X, XCircle, BarChart3, TrendingUp, Users, DollarSign, Edit} from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css';
import './AdminButtonOverrides.css';
import {adminDiscountService, type PageResponse} from '../../services/adminDiscountService';
import type {DiscountCodeCreateDto, DiscountCodeDto, DiscountUsageStatsDto} from '../../types/discounts';
import {Badge, Button, SkeletonTable} from '../../components/ui';

type CreateDiscountData = {
  code: string;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  usage_limit_per_customer?: number;
  first_purchase_only?: boolean;
  valid_from: string;
  valid_until?: string;
  is_active?: boolean;
  description?: string;
  internal_notes?: string;
};

const initialCreate: CreateDiscountData = {
  code: '',
  discount_type: 'PERCENTAGE',
  discount_value: 0,
  applies_to: 'ALL',
  usage_limit_per_customer: 1,
  first_purchase_only: false,
  valid_from: new Date().toISOString().slice(0, 16),
  is_active: true,
  description: '',
  internal_notes: '',
};

const AdminDiscounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<DiscountCodeDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'all-discounts' | 'create-discount'>('all-discounts');

  // Filter state
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  // Create/Edit form state
  const [createData, setCreateData] = useState<CreateDiscountData>({ ...initialCreate });
  const [creating, setCreating] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Stats modal state
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [selectedStats, setSelectedStats] = useState<DiscountUsageStatsDto | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Search with debounce (for future implementation)
  // const [searchQuery, setSearchQuery] = useState<string>('');
  // const debouncedSearch = useDebounce(searchQuery, 500);

  const loadDiscounts = async (pageNum: number = page, activeStatus?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse: PageResponse<DiscountCodeDto> = await adminDiscountService.getAllDiscounts(
        pageNum,
        20,
        'createdAt',
        'DESC',
        activeStatus
      );
      setDiscounts(pageResponse.content);
      setTotalPages(pageResponse.totalPages);
      setTotalElements(pageResponse.totalElements);
      setPage(pageResponse.number);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load discount codes';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Load discounts on mount
  useEffect(() => {
    loadDiscounts(0, activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const resetCreate = () => {
    setCreateData({ ...initialCreate });
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!createData.code?.trim()) {
      setError('Discount code is required');
      return;
    }

    if (createData.discount_value <= 0) {
      setError('Discount value must be greater than 0');
      return;
    }

    setCreating(true);
    try {
      const payload: DiscountCodeCreateDto = {
        code: createData.code.trim().toUpperCase(),
        discount_type: createData.discount_type,
        discount_value: createData.discount_value,
        applies_to: createData.applies_to,
        minimum_order_amount: createData.minimum_order_amount,
        maximum_discount_amount: createData.maximum_discount_amount,
        usage_limit: createData.usage_limit,
        usage_limit_per_customer: createData.usage_limit_per_customer,
        first_purchase_only: createData.first_purchase_only,
        valid_from: createData.valid_from,
        valid_until: createData.valid_until,
        is_active: createData.is_active,
        description: createData.description?.trim() || undefined,
        internal_notes: createData.internal_notes?.trim() || undefined,
      };

      if (editingId) {
        await adminDiscountService.updateDiscount(editingId, payload);
      } else {
        await adminDiscountService.createDiscount(payload);
      }

      // Reload discounts to show the new/updated one
      await loadDiscounts(0, activeFilter);

      resetCreate();
      setActiveTab('all-discounts');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : editingId ? 'Failed to update discount' : 'Failed to create discount';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (discount: DiscountCodeDto) => {
    setEditingId(discount.id);
    setCreateData({
      code: discount.code,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      applies_to: discount.applies_to,
      minimum_order_amount: discount.minimum_order_amount,
      maximum_discount_amount: discount.maximum_discount_amount,
      usage_limit: discount.usage_limit,
      usage_limit_per_customer: discount.usage_limit_per_customer,
      first_purchase_only: discount.first_purchase_only,
      valid_from: discount.valid_from.slice(0, 16),
      valid_until: discount.valid_until?.slice(0, 16),
      is_active: discount.is_active,
      description: discount.description || '',
      internal_notes: discount.internal_notes || '',
    });
    setActiveTab('create-discount');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this discount code?')) return;
    setError(null);
    try {
      await adminDiscountService.deleteDiscount(id);
      setDiscounts(prev => prev.filter(d => d.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete discount';
      setError(msg);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this discount code?')) return;
    setError(null);
    try {
      await adminDiscountService.deactivateDiscount(id);
      await loadDiscounts(page, activeFilter);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to deactivate discount';
      setError(msg);
    }
  };

  const handleViewStats = async (id: number) => {
    setLoadingStats(true);
    setShowStatsModal(true);
    setSelectedStats(null);
    setError(null);
    try {
      const stats = await adminDiscountService.getUsageStats(id);
      setSelectedStats(stats);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load statistics';
      setError(msg);
      setShowStatsModal(false);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDiscountTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      PERCENTAGE: 'Percentage',
      FIXED_AMOUNT: 'Fixed Amount',
      FREE_SHIPPING: 'Free Shipping',
    };
    return labels[type] || type;
  };

  const getDiscountValueDisplay = (discount: DiscountCodeDto): string => {
    if (discount.discount_type === 'PERCENTAGE') {
      return `${discount.discount_value}%`;
    } else if (discount.discount_type === 'FIXED_AMOUNT') {
      return `€${discount.discount_value.toFixed(2)}`;
    } else {
      return 'Free Shipping';
    }
  };

  const isExpired = (discount: DiscountCodeDto): boolean => {
    if (!discount.valid_until) return false;
    return new Date(discount.valid_until) < new Date();
  };

  const isUsageLimitReached = (discount: DiscountCodeDto): boolean => {
    if (!discount.usage_limit) return false;
    return discount.usage_count >= discount.usage_limit;
  };

  const getStatusBadge = (discount: DiscountCodeDto) => {
    if (!discount.is_active) {
      return <Badge variant="warning" size="sm">Inactive</Badge>;
    }
    if (isExpired(discount)) {
      return <Badge variant="danger" size="sm">Expired</Badge>;
    }
    if (isUsageLimitReached(discount)) {
      return <Badge variant="warning" size="sm">Limit Reached</Badge>;
    }
    return <Badge variant="success" size="sm">Active</Badge>;
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'all-discounts' ? 'active' : ''}`}
        data-tab="all-discounts"
        onClick={() => {
          setActiveTab('all-discounts');
          resetCreate();
        }}
        aria-label="View all discount codes"
      >
        <Ticket size={16} />
        All Discounts
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'create-discount' ? 'active' : ''}`}
        data-tab="create-discount"
        onClick={() => setActiveTab('create-discount')}
        aria-label="Create new discount code"
      >
        <Plus size={16} />
        {editingId ? 'Edit Discount' : 'Create New'}
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Discount Codes" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Create/Edit Discount Tab */}
          {activeTab === 'create-discount' && (
            <div className="admin-card">
              <h3 className="section-title">{editingId ? 'Edit Discount Code' : 'Create New Discount Code'}</h3>
              <form onSubmit={handleCreate} className="form-grid">
                <div>
                  <label className="form-label">Code *</label>
                  <input
                    className="form-input"
                    value={createData.code}
                    onChange={(e) => setCreateData({ ...createData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SUMMER2025"
                    required
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="form-label">Discount Type *</label>
                  <select
                    className="form-input"
                    value={createData.discount_type}
                    onChange={(e) => setCreateData({ ...createData, discount_type: e.target.value })}
                    required
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Discount Value * {createData.discount_type === 'PERCENTAGE' && '(%)'}
                    {createData.discount_type === 'FIXED_AMOUNT' && '(€)'}
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={createData.discount_value}
                    onChange={(e) => setCreateData({ ...createData, discount_value: parseFloat(e.target.value) || 0 })}
                    required
                    disabled={createData.discount_type === 'FREE_SHIPPING'}
                  />
                </div>
                <div>
                  <label className="form-label">Applies To</label>
                  <select
                    className="form-input"
                    value={createData.applies_to}
                    onChange={(e) => setCreateData({ ...createData, applies_to: e.target.value })}
                  >
                    <option value="ALL">All Products</option>
                    <option value="SPECIFIC_PRODUCTS">Specific Products</option>
                    <option value="SPECIFIC_CATEGORIES">Specific Categories</option>
                    <option value="MINIMUM_ORDER">Minimum Order</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Minimum Order Amount (€)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={createData.minimum_order_amount || ''}
                    onChange={(e) => setCreateData({
                      ...createData,
                      minimum_order_amount: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="No minimum"
                  />
                </div>
                <div>
                  <label className="form-label">Maximum Discount Amount (€)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={createData.maximum_discount_amount || ''}
                    onChange={(e) => setCreateData({
                      ...createData,
                      maximum_discount_amount: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="No maximum"
                  />
                </div>
                <div>
                  <label className="form-label">Total Usage Limit</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={createData.usage_limit || ''}
                    onChange={(e) => setCreateData({
                      ...createData,
                      usage_limit: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="form-label">Usage Limit Per Customer</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={createData.usage_limit_per_customer || 1}
                    onChange={(e) => setCreateData({
                      ...createData,
                      usage_limit_per_customer: e.target.value ? parseInt(e.target.value) : 1
                    })}
                  />
                </div>
                <div>
                  <label className="form-label">Valid From *</label>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={createData.valid_from}
                    onChange={(e) => setCreateData({ ...createData, valid_from: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Valid Until</label>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={createData.valid_until || ''}
                    onChange={(e) => setCreateData({ ...createData, valid_until: e.target.value || undefined })}
                    placeholder="No expiration"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={createData.description || ''}
                    onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                    placeholder="Public description for customers"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Internal Notes</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={createData.internal_notes || ''}
                    onChange={(e) => setCreateData({ ...createData, internal_notes: e.target.value })}
                    placeholder="Internal notes (not visible to customers)"
                  />
                </div>
                <div>
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={createData.first_purchase_only ?? false}
                      onChange={(e) => setCreateData({ ...createData, first_purchase_only: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    First Purchase Only
                  </label>
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
                    {editingId ? 'Update Discount Code' : 'Create Discount Code'}
                  </Button>
                  <Button variant="outline" type="button" onClick={resetCreate} disabled={creating}>
                    {editingId ? 'Cancel' : 'Clear'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* All Discounts Tab */}
          {activeTab === 'all-discounts' && (
            <>
              <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="sm"
                    variant={activeFilter === undefined ? 'primary' : 'outline'}
                    onClick={() => setActiveFilter(undefined)}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={activeFilter === true ? 'primary' : 'outline'}
                    onClick={() => setActiveFilter(true)}
                  >
                    Active Only
                  </Button>
                  <Button
                    size="sm"
                    variant={activeFilter === false ? 'primary' : 'outline'}
                    onClick={() => setActiveFilter(false)}
                  >
                    Inactive Only
                  </Button>
                </div>
              </div>

              {/* Mobile Card Layout */}
              <div className="mobile-table-cards">
                {loading ? (
                  <div className="mobile-table-card">
                    <SkeletonTable rows={5} columns={4} />
                  </div>
                ) : discounts.length === 0 ? (
                  <div className="mobile-table-card">
                    <div className="table-empty">No discount codes found.</div>
                  </div>
                ) : (
                  discounts.map(d => (
                    <div key={`mobile-${d.id}`} className="mobile-table-card">
                      <div className="mobile-card-header">
                        <div>
                          <h4 className="mobile-card-title">{d.code}</h4>
                          <p className="mobile-card-subtitle">{getDiscountValueDisplay(d)}</p>
                        </div>
                        <div className="mobile-card-actions">
                          <Button variant="outline" size="sm" onClick={() => handleViewStats(d.id)} title="View Statistics">
                            <BarChart3 size={14} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(d)} title="Edit discount">
                            Edit
                          </Button>
                          {d.is_active && !isExpired(d) && (
                            <Button variant="outline" size="sm" onClick={() => handleDeactivate(d.id)} title="Deactivate">
                              Deactivate
                            </Button>
                          )}
                          <Button variant="danger" size="sm" onClick={() => handleDelete(d.id)} title="Delete">
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-field">
                          <span className="mobile-field-label">Type:</span>
                          <span className="mobile-field-value">{getDiscountTypeLabel(d.discount_type)}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Status:</span>
                          <span className="mobile-field-value">{getStatusBadge(d)}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Usage:</span>
                          <span className="mobile-field-value">
                            {d.usage_count} / {d.usage_limit || '∞'}
                          </span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Valid Until:</span>
                          <span className="mobile-field-value">{formatDate(d.valid_until)}</span>
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
                      <th style={{ width: 100 }}>Code</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Usage</th>
                      <th>Valid From</th>
                      <th>Valid Until</th>
                      <th>Status</th>
                      <th style={{ width: 160 }} className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="table-empty">
                        <SkeletonTable rows={5} columns={8} />
                      </td></tr>
                    ) : discounts.length === 0 ? (
                      <tr><td colSpan={8} className="table-empty">No discount codes found.</td></tr>
                    ) : (
                      discounts.map(d => (
                        <tr key={d.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{d.code}</div>
                          </td>
                          <td>{getDiscountTypeLabel(d.discount_type)}</td>
                          <td>{getDiscountValueDisplay(d)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{d.usage_count} / {d.usage_limit || '∞'}</span>
                              {isUsageLimitReached(d) && <XCircle size={14} color="#ef4444" />}
                            </div>
                          </td>
                          <td>{formatDate(d.valid_from)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{formatDate(d.valid_until)}</span>
                              {isExpired(d) && <Clock size={14} color="#ef4444" />}
                            </div>
                          </td>
                          <td>{getStatusBadge(d)}</td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <Button variant="outline" size="sm" onClick={() => handleViewStats(d.id)} title="View Statistics">
                                <BarChart3 size={14} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(d)} title="Edit discount">
                                <Edit size={14} />
                              </Button>
                              {d.is_active && !isExpired(d) && (
                                <Button variant="outline" size="sm" onClick={() => handleDeactivate(d.id)} title="Deactivate">
                                  <XCircle size={14} />
                                </Button>
                              )}
                              <Button variant="danger" size="sm" onClick={() => handleDelete(d.id)} title="Delete">
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
                    Showing {discounts.length > 0 ? (page * 20 + 1) : 0} - {Math.min((page + 1) * 20, totalElements)} of {totalElements} discount codes
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadDiscounts(page - 1, activeFilter)}
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
                      onClick={() => loadDiscounts(page + 1, activeFilter)}
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

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <BarChart3 size={24} />
                Discount Code Statistics
              </h3>
              <button className="modal-close" onClick={() => setShowStatsModal(false)} aria-label="Close">
                <XCircle size={24} />
              </button>
            </div>

            {loadingStats ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '48px' }}>
                <p>Loading statistics...</p>
              </div>
            ) : selectedStats ? (
              <div className="modal-body">
                <div className="stats-header">
                  <h4 className="stats-code">{selectedStats.code}</h4>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#3b82f6' }}>
                      <Ticket size={24} color="white" />
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Total Uses</div>
                      <div className="stat-value">{selectedStats.totalUsages}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#8b5cf6' }}>
                      <Users size={24} color="white" />
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Unique Users</div>
                      <div className="stat-value">{selectedStats.uniqueUsers}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#10b981' }}>
                      <DollarSign size={24} color="white" />
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Total Order Value</div>
                      <div className="stat-value">€{selectedStats.totalOrderValue.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f59e0b' }}>
                      <TrendingUp size={24} color="white" />
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Avg Order Value</div>
                      <div className="stat-value">€{selectedStats.averageOrderValue.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#ef4444' }}>
                      <DollarSign size={24} color="white" />
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Total Discount Given</div>
                      <div className="stat-value">€{selectedStats.totalDiscountAmount.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#06b6d4' }}>
                      <TrendingUp size={24} color="white" />
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Avg Discount Amount</div>
                      <div className="stat-value">€{selectedStats.averageDiscountAmount.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <Button variant="primary" onClick={() => setShowStatsModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="modal-body" style={{ textAlign: 'center', padding: '48px' }}>
                <p>No statistics available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDiscounts;
