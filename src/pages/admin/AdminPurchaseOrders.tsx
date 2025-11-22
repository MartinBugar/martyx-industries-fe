import React, { useEffect, useState } from 'react';
import { Package, Plus, X, Eye, CheckCircle, Truck, FileText, Calendar } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css';
import './AdminButtonOverrides.css';
import { adminSupplierService, type PageResponse } from '../../services/adminSupplierService';
import { adminProductsService, type ProductVariantDto } from '../../services/adminProductsService';
import type { PurchaseOrderDto, PurchaseOrderCreateDto, SupplierDto } from '../../types/inventory';
import { Badge, Button, SkeletonTable } from '../../components/ui';
import { logError } from '../../services/logger';

type TabType = 'all-orders' | 'create-order' | 'view-details';

interface LineItem {
  product_id?: number;
  variant_id?: number;
  variant_name?: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

type CreatePOData = {
  po_number: string;
  supplier_id: number | null;
  order_status: string;
  order_date: string;
  expected_delivery_date?: string;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  payment_status: string;
  notes?: string;
  internal_notes?: string;
  items: LineItem[];
};

const initialCreate: CreatePOData = {
  po_number: '',
  supplier_id: null,
  order_status: 'DRAFT',
  order_date: new Date().toISOString().split('T')[0],
  subtotal: 0,
  tax_amount: 0,
  shipping_cost: 0,
  total_amount: 0,
  payment_status: 'UNPAID',
  items: [],
};

const AdminPurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [variants, setVariants] = useState<ProductVariantDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<TabType>('all-orders');

  // Filter state
  const [filterSupplier, setFilterSupplier] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Create/Edit form state
  const [createData, setCreateData] = useState<CreatePOData>({ ...initialCreate });
  const [creating, setCreating] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // View details state
  const [viewingPO, setViewingPO] = useState<PurchaseOrderDto | null>(null);

  const loadPurchaseOrders = async (pageNum: number = page, supplierId?: number | null, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse: PageResponse<PurchaseOrderDto> = await adminSupplierService.getAllPurchaseOrders(
        pageNum,
        20,
        'order_date',
        'DESC',
        supplierId || undefined,
        status || undefined
      );
      setPurchaseOrders(pageResponse.content);
      setTotalPages(pageResponse.totalPages);
      setTotalElements(pageResponse.totalElements);
      setPage(pageResponse.number);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load purchase orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const pageResponse: PageResponse<SupplierDto> = await adminSupplierService.getAllSuppliers(0, 1000);
      setSuppliers(pageResponse.content.filter(s => s.is_active));
    } catch (e) {
      logError('Failed to load suppliers', e);
    }
  };

  const loadVariants = async () => {
    try {
      const pageResponse = await adminProductsService.getMasterProducts({ active: true }, 0, 1000);
      const allVariants: ProductVariantDto[] = [];
      pageResponse.content.forEach(product => {
        if (product.variants) {
          product.variants.forEach(v => {
            allVariants.push({
              ...v,
              variantName: `${product.name} - ${v.variantName}`,
            });
          });
        }
      });
      setVariants(allVariants);
    } catch (e) {
      logError('Failed to load product variants', e);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadPurchaseOrders(0, filterSupplier, filterStatus);
    loadSuppliers();
    loadVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSupplier, filterStatus]);

  const resetCreate = () => {
    setCreateData({ ...initialCreate, po_number: generatePONumber() });
    setEditingId(null);
  };

  const generatePONumber = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PO-${year}${month}-${random}`;
  };

  const addLineItem = () => {
    setCreateData({
      ...createData,
      items: [
        ...createData.items,
        { quantity: 1, unit_cost: 0, total: 0 }
      ]
    });
  };

  const removeLineItem = (index: number) => {
    const newItems = createData.items.filter((_, i) => i !== index);
    setCreateData({ ...createData, items: newItems });
    recalculateTotals(newItems, createData.tax_amount, createData.shipping_cost);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...createData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate line total
    if (field === 'quantity' || field === 'unit_cost') {
      const item = newItems[index];
      item.total = item.quantity * item.unit_cost;
    }

    // If variant changed, update product_id and name
    if (field === 'variant_id') {
      const variant = variants.find(v => v.id === value);
      if (variant) {
        newItems[index].product_id = variant.masterProductId;
        newItems[index].variant_name = variant.variantName;
      }
    }

    setCreateData({ ...createData, items: newItems });
    recalculateTotals(newItems, createData.tax_amount, createData.shipping_cost);
  };

  const recalculateTotals = (items: LineItem[], taxAmount: number, shippingCost: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + taxAmount + shippingCost;
    setCreateData(prev => ({
      ...prev,
      subtotal,
      total_amount: total
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!createData.po_number?.trim()) {
      setError('PO number is required');
      return;
    }

    if (!createData.supplier_id) {
      setError('Supplier is required');
      return;
    }

    if (createData.items.length === 0) {
      setError('At least one line item is required');
      return;
    }

    // Validate all line items have variant selected
    for (let i = 0; i < createData.items.length; i++) {
      if (!createData.items[i].variant_id) {
        setError(`Line item ${i + 1}: Product variant is required`);
        return;
      }
      if (createData.items[i].quantity <= 0) {
        setError(`Line item ${i + 1}: Quantity must be greater than 0`);
        return;
      }
    }

    setCreating(true);
    try {
      const payload: PurchaseOrderCreateDto = {
        po_number: createData.po_number.trim(),
        supplier_id: createData.supplier_id,
        order_status: createData.order_status,
        order_date: createData.order_date,
        expected_delivery_date: createData.expected_delivery_date || undefined,
        subtotal: createData.subtotal,
        tax_amount: createData.tax_amount,
        shipping_cost: createData.shipping_cost,
        total_amount: createData.total_amount,
        payment_status: createData.payment_status,
        notes: createData.notes?.trim() || undefined,
        internal_notes: createData.internal_notes?.trim() || undefined,
        items: JSON.stringify(createData.items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost
        })))
      };

      await adminSupplierService.createPurchaseOrder(payload);
      await loadPurchaseOrders(0, filterSupplier, filterStatus);
      resetCreate();
      setActiveTab('all-orders');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create purchase order';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const po = await adminSupplierService.getPurchaseOrderById(id);
      setViewingPO(po);
      setActiveTab('view-details');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load purchase order details';
      setError(msg);
    }
  };

  const handleReceive = async (id: number) => {
    if (!window.confirm('Are you sure you want to receive this purchase order? This will update inventory.')) return;
    setError(null);
    try {
      await adminSupplierService.receivePurchaseOrder(id);
      await loadPurchaseOrders(page, filterSupplier, filterStatus);
      if (viewingPO && viewingPO.id === id) {
        const updated = await adminSupplierService.getPurchaseOrderById(id);
        setViewingPO(updated);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to receive purchase order';
      setError(msg);
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount?: number): string => {
    if (amount == null) return '€0.00';
    return `€${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string): React.ReactNode => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      DRAFT: 'default',
      SENT: 'info',
      CONFIRMED: 'warning',
      RECEIVED: 'success',
      CANCELLED: 'danger',
    };
    return <Badge variant={variants[status] || 'default'} size="sm">{status}</Badge>;
  };

  const getPaymentBadge = (status: string): React.ReactNode => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
      UNPAID: 'danger',
      PARTIALLY_PAID: 'warning',
      PAID: 'success',
    };
    return <Badge variant={variants[status] || 'default'} size="sm">{status}</Badge>;
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'all-orders' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('all-orders');
          setViewingPO(null);
          resetCreate();
        }}
        aria-label="View all purchase orders"
      >
        <Package size={16} />
        All Orders
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'create-order' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('create-order');
          if (!editingId) resetCreate();
        }}
        aria-label="Create new purchase order"
      >
        <Plus size={16} />
        {editingId ? 'Edit Order' : 'Create New'}
      </button>
      {viewingPO && (
        <button
          className={`dashboard-tab ${activeTab === 'view-details' ? 'active' : ''}`}
          onClick={() => setActiveTab('view-details')}
          aria-label="View purchase order details"
        >
          <Eye size={16} />
          View Details
        </button>
      )}
    </nav>
  );

  return (
    <AdminLayout title="Purchase Orders" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Create Purchase Order Tab */}
          {activeTab === 'create-order' && (
            <div className="admin-card">
              <h3 className="section-title">{editingId ? 'Edit Purchase Order' : 'Create New Purchase Order'}</h3>
              <form onSubmit={handleCreate} className="form-grid">
                {/* Header Section */}
                <div>
                  <label className="form-label">PO Number *</label>
                  <input
                    className="form-input"
                    value={createData.po_number}
                    onChange={(e) => setCreateData({ ...createData, po_number: e.target.value })}
                    placeholder="PO-202501-0001"
                    required
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="form-label">Supplier *</label>
                  <select
                    className="form-input"
                    value={createData.supplier_id || ''}
                    onChange={(e) => setCreateData({ ...createData, supplier_id: Number(e.target.value) })}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name} ({s.supplier_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Order Date *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={createData.order_date}
                    onChange={(e) => setCreateData({ ...createData, order_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Expected Delivery Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={createData.expected_delivery_date || ''}
                    onChange={(e) => setCreateData({ ...createData, expected_delivery_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Order Status</label>
                  <select
                    className="form-input"
                    value={createData.order_status}
                    onChange={(e) => setCreateData({ ...createData, order_status: e.target.value })}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="RECEIVED">Received</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Payment Status</label>
                  <select
                    className="form-input"
                    value={createData.payment_status}
                    onChange={(e) => setCreateData({ ...createData, payment_status: e.target.value })}
                  >
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>

                {/* Line Items Section */}
                <div style={{ gridColumn: '1 / -1', marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 className="section-title" style={{ margin: 0 }}>Line Items</h4>
                    <Button variant="outline" size="sm" type="button" onClick={addLineItem}>
                      <Plus size={14} /> Add Item
                    </Button>
                  </div>

                  {createData.items.length === 0 ? (
                    <div className="table-empty">No items added yet. Click "Add Item" to begin.</div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th style={{ width: '40%' }}>Product Variant</th>
                            <th style={{ width: '15%' }}>Quantity</th>
                            <th style={{ width: '15%' }}>Unit Cost</th>
                            <th style={{ width: '15%' }}>Total</th>
                            <th style={{ width: '60px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {createData.items.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <select
                                  className="form-input"
                                  value={item.variant_id || ''}
                                  onChange={(e) => updateLineItem(index, 'variant_id', Number(e.target.value))}
                                  required
                                  style={{ width: '100%' }}
                                >
                                  <option value="">Select Product...</option>
                                  {variants.map(v => (
                                    <option key={v.id} value={v.id}>
                                      {v.variantName} (SKU: {v.sku})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  className="form-input"
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                                  required
                                  style={{ width: '100%' }}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-input"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_cost}
                                  onChange={(e) => updateLineItem(index, 'unit_cost', Number(e.target.value))}
                                  required
                                  style={{ width: '100%' }}
                                />
                              </td>
                              <td>
                                <strong>{formatCurrency(item.total)}</strong>
                              </td>
                              <td className="text-right">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  type="button"
                                  onClick={() => removeLineItem(index)}
                                  title="Remove item"
                                >
                                  <X size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Totals Section */}
                <div style={{ gridColumn: '1 / -1', marginTop: '24px' }}>
                  <div className="form-grid" style={{ maxWidth: '500px', marginLeft: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ margin: 0 }}>Subtotal:</label>
                      <strong>{formatCurrency(createData.subtotal)}</strong>
                    </div>
                    <div>
                      <label className="form-label">Tax Amount</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={createData.tax_amount}
                        onChange={(e) => {
                          const tax = Number(e.target.value);
                          setCreateData({ ...createData, tax_amount: tax });
                          recalculateTotals(createData.items, tax, createData.shipping_cost);
                        }}
                      />
                    </div>
                    <div>
                      <label className="form-label">Shipping Cost</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={createData.shipping_cost}
                        onChange={(e) => {
                          const shipping = Number(e.target.value);
                          setCreateData({ ...createData, shipping_cost: shipping });
                          recalculateTotals(createData.items, createData.tax_amount, shipping);
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '2px solid #e5e7eb' }}>
                      <label className="form-label" style={{ margin: 0, fontSize: '16px' }}>Total Amount:</label>
                      <strong style={{ fontSize: '18px', color: '#059669' }}>{formatCurrency(createData.total_amount)}</strong>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes (visible to supplier)</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={createData.notes || ''}
                    onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
                    placeholder="Optional notes for the supplier..."
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Internal Notes (private)</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={createData.internal_notes || ''}
                    onChange={(e) => setCreateData({ ...createData, internal_notes: e.target.value })}
                    placeholder="Internal notes for team reference..."
                  />
                </div>

                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                  <Button variant="primary" type="submit" disabled={creating} loading={creating}>
                    {editingId ? 'Update Purchase Order' : 'Create Purchase Order'}
                  </Button>
                  <Button variant="outline" type="button" onClick={resetCreate} disabled={creating}>
                    {editingId ? 'Cancel' : 'Clear'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* All Purchase Orders Tab */}
          {activeTab === 'all-orders' && (
            <>
              <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select
                  className="form-input"
                  value={filterSupplier || ''}
                  onChange={(e) => setFilterSupplier(e.target.value ? Number(e.target.value) : null)}
                  style={{ maxWidth: '250px' }}
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.supplier_name}</option>
                  ))}
                </select>
                <select
                  className="form-input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ maxWidth: '200px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Mobile Card Layout */}
              <div className="mobile-table-cards">
                {loading ? (
                  <div className="mobile-table-card">
                    <SkeletonTable rows={5} columns={4} />
                  </div>
                ) : purchaseOrders.length === 0 ? (
                  <div className="mobile-table-card">
                    <div className="table-empty">No purchase orders found.</div>
                  </div>
                ) : (
                  purchaseOrders.map(po => (
                    <div key={`mobile-${po.id}`} className="mobile-table-card">
                      <div className="mobile-card-header">
                        <div>
                          <h4 className="mobile-card-title">{po.po_number}</h4>
                          <p className="mobile-card-subtitle">{po.supplier_name}</p>
                        </div>
                        <div className="mobile-card-actions">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(po.id)} title="View details">
                            <Eye size={14} />
                          </Button>
                          {po.order_status !== 'RECEIVED' && po.order_status !== 'CANCELLED' && (
                            <Button variant="primary" size="sm" onClick={() => handleReceive(po.id)} title="Receive">
                              <CheckCircle size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-field">
                          <span className="mobile-field-label">Order Date:</span>
                          <span className="mobile-field-value">{formatDate(po.order_date)}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Total:</span>
                          <span className="mobile-field-value"><strong>{formatCurrency(po.total_amount)}</strong></span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Status:</span>
                          <span className="mobile-field-value">{getStatusBadge(po.order_status)}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Payment:</span>
                          <span className="mobile-field-value">{getPaymentBadge(po.payment_status)}</span>
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
                      <th>PO Number</th>
                      <th>Supplier</th>
                      <th>Order Date</th>
                      <th>Expected Delivery</th>
                      <th>Total Amount</th>
                      <th>Order Status</th>
                      <th>Payment Status</th>
                      <th style={{ width: 140 }} className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="table-empty">
                        <SkeletonTable rows={5} columns={8} />
                      </td></tr>
                    ) : purchaseOrders.length === 0 ? (
                      <tr><td colSpan={8} className="table-empty">No purchase orders found.</td></tr>
                    ) : (
                      purchaseOrders.map(po => (
                        <tr key={po.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{po.po_number}</div>
                          </td>
                          <td>
                            <div>{po.supplier_name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{po.supplier_code}</div>
                          </td>
                          <td>
                            <Calendar size={14} style={{ marginRight: 4, verticalAlign: 'middle', color: '#6b7280' }} />
                            {formatDate(po.order_date)}
                          </td>
                          <td>
                            {po.expected_delivery_date ? (
                              <>
                                <Truck size={14} style={{ marginRight: 4, verticalAlign: 'middle', color: '#6b7280' }} />
                                {formatDate(po.expected_delivery_date)}
                              </>
                            ) : '—'}
                          </td>
                          <td>
                            <strong style={{ color: '#059669' }}>{formatCurrency(po.total_amount)}</strong>
                          </td>
                          <td>{getStatusBadge(po.order_status)}</td>
                          <td>{getPaymentBadge(po.payment_status)}</td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(po.id)} title="View details">
                                <Eye size={14} />
                              </Button>
                              {po.order_status !== 'RECEIVED' && po.order_status !== 'CANCELLED' && (
                                <Button variant="primary" size="sm" onClick={() => handleReceive(po.id)} title="Receive order">
                                  <CheckCircle size={14} />
                                </Button>
                              )}
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
                    Showing {purchaseOrders.length > 0 ? (page * 20 + 1) : 0} - {Math.min((page + 1) * 20, totalElements)} of {totalElements} orders
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPurchaseOrders(page - 1, filterSupplier, filterStatus)}
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
                      onClick={() => loadPurchaseOrders(page + 1, filterSupplier, filterStatus)}
                      disabled={page >= totalPages - 1 || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* View Details Tab */}
          {activeTab === 'view-details' && viewingPO && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 className="section-title" style={{ margin: 0 }}>Purchase Order Details</h3>
                {viewingPO.order_status !== 'RECEIVED' && viewingPO.order_status !== 'CANCELLED' && (
                  <Button variant="primary" onClick={() => handleReceive(viewingPO.id)}>
                    <CheckCircle size={16} /> Receive Order
                  </Button>
                )}
              </div>

              {/* PO Header Info */}
              <div className="form-grid" style={{ marginBottom: '32px' }}>
                <div>
                  <label className="form-label">PO Number</label>
                  <div style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: '16px', fontWeight: 600 }}>
                    {viewingPO.po_number}
                  </div>
                </div>
                <div>
                  <label className="form-label">Supplier</label>
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ fontWeight: 600 }}>{viewingPO.supplier_name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{viewingPO.supplier_code}</div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Order Date</label>
                  <div style={{ padding: '8px 0' }}>{formatDate(viewingPO.order_date)}</div>
                </div>
                <div>
                  <label className="form-label">Expected Delivery</label>
                  <div style={{ padding: '8px 0' }}>{formatDate(viewingPO.expected_delivery_date)}</div>
                </div>
                {viewingPO.actual_delivery_date && (
                  <div>
                    <label className="form-label">Actual Delivery</label>
                    <div style={{ padding: '8px 0' }}>{formatDate(viewingPO.actual_delivery_date)}</div>
                  </div>
                )}
                <div>
                  <label className="form-label">Order Status</label>
                  <div style={{ padding: '8px 0' }}>{getStatusBadge(viewingPO.order_status)}</div>
                </div>
                <div>
                  <label className="form-label">Payment Status</label>
                  <div style={{ padding: '8px 0' }}>{getPaymentBadge(viewingPO.payment_status)}</div>
                </div>
                {viewingPO.payment_date && (
                  <div>
                    <label className="form-label">Payment Date</label>
                    <div style={{ padding: '8px 0' }}>{formatDate(viewingPO.payment_date)}</div>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div style={{ marginBottom: '32px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <h4 className="section-title" style={{ marginTop: 0 }}>Financial Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Subtotal</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{formatCurrency(viewingPO.subtotal)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tax Amount</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{formatCurrency(viewingPO.tax_amount)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Shipping Cost</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{formatCurrency(viewingPO.shipping_cost)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Amount</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>{formatCurrency(viewingPO.total_amount)}</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(viewingPO.notes || viewingPO.internal_notes) && (
                <div style={{ marginBottom: '32px' }}>
                  {viewingPO.notes && (
                    <div style={{ marginBottom: '16px' }}>
                      <label className="form-label">Notes</label>
                      <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                        {viewingPO.notes}
                      </div>
                    </div>
                  )}
                  {viewingPO.internal_notes && (
                    <div>
                      <label className="form-label">Internal Notes</label>
                      <div style={{ padding: '12px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                        <FileText size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {viewingPO.internal_notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              {(viewingPO.created_by_name || viewingPO.created_at) && (
                <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px', color: '#6b7280' }}>
                  {viewingPO.created_by_name && <div>Created by: {viewingPO.created_by_name}</div>}
                  {viewingPO.created_at && <div>Created at: {formatDate(viewingPO.created_at)}</div>}
                  {viewingPO.updated_at && <div>Last updated: {formatDate(viewingPO.updated_at)}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPurchaseOrders;
