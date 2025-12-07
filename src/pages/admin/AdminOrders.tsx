import React, {useEffect, useMemo, useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, X, Plus, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import './AdminOrders.css';
import {adminOrdersService, type AdminOrderDTO, type AdminOrderItem, type PageResponse} from '../../services/adminOrdersService';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import OrderEmailHistory from '../../components/admin/OrderEmailHistory';

// Helper to get status badge variant
const getStatusBadgeVariant = (status?: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (status) {
        case 'DELIVERED': return 'success';
        case 'SHIPPED': return 'info';
        case 'PROCESSING': return 'warning';
        case 'PAID': return 'info';
        case 'CANCELLED':
        case 'REFUNDED': return 'danger';
        default: return 'default';
    }
};


// Helper functions
const formatDatetime = (value: unknown): string => {
    if (!value) return '—';
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString();
};

const formatPrice = (amount: unknown, currency?: string): string => {
    if (amount == null || amount === '') return '—';
    const num = typeof amount === 'number' ? amount : Number(amount);
    if (isNaN(num)) return '—';
    return `${num.toLocaleString()} ${currency || 'USD'}`;
};

const AdminOrders: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<AdminOrderDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [page, setPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalElements, setTotalElements] = useState<number>(0);

    // Filter state: 'all', 'online', 'manual'
    const [orderFilter, setOrderFilter] = useState<'all' | 'online' | 'manual'>('all');

    // Edit row
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editData, setEditData] = useState<Partial<AdminOrderDTO>>({});
    const [saving, setSaving] = useState<boolean>(false);

    // Expanded details (view mode)
    const [expandedId, setExpandedId] = useState<string | number | null>(null);
    const toggleExpanded = (id: string | number) => {
        setExpandedId(prev => (String(prev) === String(id) ? null : id));
    };

    // Status update modal state
    const [statusModalOrder, setStatusModalOrder] = useState<AdminOrderDTO | null>(null);
    const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
    const [shippingCarrier, setShippingCarrier] = useState<string>('');
    const [trackingNumber, setTrackingNumber] = useState<string>('');
    const [trackingUrl, setTrackingUrl] = useState<string>('');

    // Search/filter (by orderNumber/email/status)
    const [query, setQuery] = useState<string>('');
    const filtered = useMemo(() => {
        let result = orders;

        // Apply salesChannel filter
        if (orderFilter === 'manual') {
            result = result.filter(o => o.salesChannel === 'MANUAL_ADMIN');
        } else if (orderFilter === 'online') {
            result = result.filter(o => o.salesChannel === 'ONLINE_SHOP' || !o.salesChannel);
        }
        // 'all' shows everything

        // Apply search query
        if (query.trim()) {
            const q = query.toLowerCase();
            result = result.filter(o => `${o.orderNumber ?? ''} ${o.userEmail ?? ''} ${o.status ?? ''}`.toLowerCase().includes(q));
        }

        return result;
    }, [orders, query, orderFilter]);

    const loadOrders = async (pageNum: number = page) => {
        setLoading(true);
        setError(null);
        try {
            const pageResponse: PageResponse<AdminOrderDTO> = await adminOrdersService.getAllOrders(pageNum, 20, 'id', 'DESC');
            setOrders(pageResponse.content);
            setTotalPages(pageResponse.totalPages);
            setTotalElements(pageResponse.totalElements);
            setPage(pageResponse.number);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load orders';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders(0);
    }, []);

    // Quick status update handlers
    const handleMarkProcessing = async (order: AdminOrderDTO) => {
        if (!order.id || statusUpdating) return;
        setStatusUpdating(true);
        try {
            const result = await adminOrdersService.markAsProcessing(order.id);
            setOrders(prev => prev.map(o => o.id === order.id ? result.order : o));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleMarkPacked = async (order: AdminOrderDTO) => {
        if (!order.id || statusUpdating) return;
        setStatusUpdating(true);
        try {
            const result = await adminOrdersService.markAsPacked(order.id);
            setOrders(prev => prev.map(o => o.id === order.id ? result.order : o));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleMarkShipped = async (order: AdminOrderDTO) => {
        if (!order.id) return;
        // Open modal for shipping info
        setStatusModalOrder(order);
        setShippingCarrier(order.shippingCarrier || '');
        setTrackingNumber(order.trackingNumber || '');
        setTrackingUrl(order.trackingUrl || '');
    };

    const confirmMarkShipped = async () => {
        if (!statusModalOrder?.id || statusUpdating) return;
        setStatusUpdating(true);
        try {
            const result = await adminOrdersService.markAsShipped(
                statusModalOrder.id,
                shippingCarrier || undefined,
                trackingNumber || undefined,
                trackingUrl || undefined
            );
            setOrders(prev => prev.map(o => o.id === statusModalOrder.id ? result.order : o));
            setStatusModalOrder(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleMarkDelivered = async (order: AdminOrderDTO) => {
        if (!order.id || statusUpdating) return;
        setStatusUpdating(true);
        try {
            const result = await adminOrdersService.markAsDelivered(order.id);
            setOrders(prev => prev.map(o => o.id === order.id ? result.order : o));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleCancelOrder = async (order: AdminOrderDTO) => {
        if (!order.id || statusUpdating) return;
        const reason = prompt('Cancellation reason (optional):');
        if (reason === null) return; // User clicked cancel

        setStatusUpdating(true);
        try {
            const result = await adminOrdersService.cancelOrder(order.id, reason || undefined);
            setOrders(prev => prev.map(o => o.id === order.id ? result.order : o));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to cancel order');
        } finally {
            setStatusUpdating(false);
        }
    };

    const formatDateTime = (value?: string): string => {
        if (!value) return '—';
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleString();
    };

    // Format for <input type="datetime-local"> expected value
    const toDateTimeLocalStr = (value?: string): string => {
        if (!value) return '';
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        const pad = (n: number) => n.toString().padStart(2, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };

    const formatMoney = (amount: number | undefined, currency?: string): string => {
        const a = typeof amount === 'number' && isFinite(amount) ? amount : 0;
        return `${a.toFixed(2)} ${currency ?? ''}`.trim();
    };

    const getItemsCount = (o: AdminOrderDTO): number => Array.isArray(o.orderItems) ? o.orderItems.length : 0;
    const getTotalAmount = (o: AdminOrderDTO): number => {
        if (typeof o.totalAmount === 'number') return o.totalAmount;
        if (Array.isArray(o.orderItems)) {
            return o.orderItems.reduce((sum, it) => {
                const qty = typeof it.quantity === 'number' ? it.quantity : 1;
                const price = typeof it.unitPrice === 'number' ? it.unitPrice : (typeof it.price === 'number' ? it.price : 0);
                return sum + qty * price;
            }, 0);
        }
        return 0;
    };

    const startEdit = (o: AdminOrderDTO) => {
        setEditingId(o.id ?? o.orderNumber ?? 'id');
        // Copy all fields to preserve items on save
        setEditData({...o});
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const saveEdit = async (id: string | number | undefined) => {
        if (id == null) return;
        setSaving(true);
        setError(null);
        try {
            const updated = await adminOrdersService.updateOrder(id, editData);
            setOrders(prev => prev.map(o => (String(o.id ?? '') === String(id) ? updated : o)));
            setEditingId(null);
            setEditData({});
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Save failed';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    // Items editor helpers/handlers
    const updateItem = (index: number, patch: Partial<AdminOrderItem>) => {
        setEditData(prev => {
            const items = Array.isArray(prev.orderItems) ? [...(prev.orderItems as AdminOrderItem[])] : [];
            items[index] = {...(items[index] ?? {}), ...patch} as AdminOrderItem;
            return {...prev, orderItems: items};
        });
    };
    const addItem = () => {
        setEditData(prev => {
            const items = Array.isArray(prev.orderItems) ? [...(prev.orderItems as AdminOrderItem[])] : [];
            items.push({productId: '', productName: '', quantity: 1, unitPrice: 0} as AdminOrderItem);
            return {...prev, orderItems: items};
        });
    };
    const removeItem = (index: number) => {
        setEditData(prev => {
            const items = Array.isArray(prev.orderItems) ? [...(prev.orderItems as AdminOrderItem[])] : [];
            items.splice(index, 1);
            return {...prev, orderItems: items};
        });
    };
    const computeSubtotal = (it: AdminOrderItem): number => {
        const qty = Number(it.quantity ?? 0) || 0;
        const price = Number((it.unitPrice ?? it.price) ?? 0) || 0;
        return qty * price;
    };
    const editItemsTotal = (): number => {
        const items = Array.isArray(editData.orderItems) ? (editData.orderItems as AdminOrderItem[]) : [];
        return items.reduce((s, it) => s + computeSubtotal(it), 0);
    };

    const handleDelete = async (id: string | number) => {
        if (id == null) return;
        if (!confirm('Delete this order?')) return;
        setError(null);
        try {
            await adminOrdersService.deleteOrder(id);
            setOrders(prev => prev.filter(x => x.id !== id));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Delete failed';
            setError(msg);
        }
    };

    const navTabs = (
        <nav className="dashboard-tabs">
            <button
                className={`dashboard-tab ${orderFilter === 'all' ? 'active' : ''}`}
                onClick={() => setOrderFilter('all')}
                aria-label="View all orders"
            >
                All Orders
            </button>
            <button
                className={`dashboard-tab ${orderFilter === 'online' ? 'active' : ''}`}
                onClick={() => setOrderFilter('online')}
                aria-label="View online orders"
            >
                Online Orders
            </button>
            <button
                className={`dashboard-tab ${orderFilter === 'manual' ? 'active' : ''}`}
                onClick={() => setOrderFilter('manual')}
                aria-label="View manual orders"
            >
                Manual Orders
            </button>
        </nav>
    );

    return (
        <AdminLayout title="Orders" navTabs={navTabs}>
            <div className="admin-page">
                <div className="admin-container">
                    {error && <div className="alert alert-error">{error}</div>}

                    {/* Orders List */}
                    <>
                            <div className="admin-header-actions">
                                <input
                                    type="text"
                                    className="form-input admin-orders-search-input"
                                    placeholder="Search by order number, email, or status..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/admin/manual-orders/create')}
                                    title="Create manual order"
                                >
                                    <Plus size={16} className="admin-orders-icon-mr" />
                                    Create Manual Order
                                </Button>
                                <Button variant="outline" onClick={() => loadOrders()}>
                                    Refresh
                                </Button>
                            </div>

                            {/* Mobile Card Layout */}
                            <div className="mobile-table-cards">
                                {loading ? (
                                    <div className="mobile-table-card">
                                        <SkeletonTable rows={5} columns={4} />
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="mobile-table-card">
                                        <div className="table-empty">No orders found.</div>
                                    </div>
                                ) : (
                                    filtered.map(order => (
                                        <div key={`mobile-${order.id}`} className="mobile-table-card">
                                            <div className="mobile-card-header">
                                                <div>
                                                    <h4 className="mobile-card-title">Order #{order.orderNumber ?? order.id}</h4>
                                                    <p className="mobile-card-subtitle">ID: {order.id}</p>
                                                </div>
                                                <div className="mobile-card-actions">
                                                    <Link to={`/admin/orders/${order.id}/view`} className="btn btn-outline btn-sm" title="View order details">
                                                        <Eye size={14} />
                                                    </Link>
                                                    <Link to={`/admin/orders/${order.id}/edit`} className="btn btn-outline btn-sm" title="Edit order">
                                                        <Pencil size={14} />
                                                    </Link>
                                                    <Button variant="danger" size="sm" onClick={() => handleDelete(order.id!)} title="Delete order">
                                                        <X size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mobile-card-body">
                                                <div className="mobile-field">
                                                    <span className="mobile-field-label">Email:</span>
                                                    <span className="mobile-field-value">{order.userEmail ?? '—'}</span>
                                                </div>
                                                <div className="mobile-field">
                                                    <span className="mobile-field-label">Status:</span>
                                                    <span className="mobile-field-value">
                                                        <Badge variant={order.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                                                            {order.status ?? '—'}
                                                        </Badge>
                                                    </span>
                                                </div>
                                                <div className="mobile-field">
                                                    <span className="mobile-field-label">Order Date:</span>
                                                    <span className="mobile-field-value">{formatDatetime(order.orderDate)}</span>
                                                </div>
                                                <div className="mobile-field">
                                                    <span className="mobile-field-label">Items:</span>
                                                    <span className="mobile-field-value">{(order.orderItems ?? []).length}</span>
                                                </div>
                                                <div className="mobile-field">
                                                    <span className="mobile-field-label">Total:</span>
                                                    <span className="mobile-field-value">{formatPrice(order.totalAmount, order.currency)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th className="admin-orders-col-id">ID</th>
                                        <th>Order #</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Order Date</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th className="admin-orders-col-actions text-right">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="table-empty">
                                                <SkeletonTable rows={5} columns={8} />
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="table-empty">No orders found.</td>
                                        </tr>
                                    ) : (
                                        filtered.map((o) => {
                                            const id = o.id ?? o.orderNumber ?? '';
                                            const isEditing = editingId === id;
                                            if (isEditing) {
                                                return (
                                                    <>
                                                        <tr key={`edit-${id}`}>
                                                            <td className="admin-orders-cell">{String(o.id ?? '—')}</td>
                                                            <td className="admin-orders-cell">
                                                                <input value={editData.orderNumber as string ?? ''}
                                                                       onChange={(e) => setEditData({
                                                                           ...editData,
                                                                           orderNumber: e.target.value
                                                                       })} className="admin-orders-field-input"/>
                                                            </td>
                                                            <td className="admin-orders-cell">
                                                                <input value={editData.userEmail as string ?? ''}
                                                                       onChange={(e) => setEditData({
                                                                           ...editData,
                                                                           userEmail: e.target.value
                                                                       })} className="admin-orders-field-input"/>
                                                            </td>
                                                            <td className="admin-orders-cell">
                                                                <input value={editData.status as string ?? ''}
                                                                       onChange={(e) => setEditData({
                                                                           ...editData,
                                                                           status: e.target.value
                                                                       })} className="admin-orders-field-input"/>
                                                            </td>
                                                            <td className="admin-orders-cell">
                                                                <input type="datetime-local"
                                                                       value={toDateTimeLocalStr(editData.orderDate as string)}
                                                                       onChange={(e) => setEditData({
                                                                           ...editData,
                                                                           orderDate: e.target.value
                                                                       })} className="admin-orders-field-input"/>
                                                            </td>
                                                            <td className="admin-orders-cell">{getItemsCount(o)}</td>
                                                            <td className="admin-orders-cell">{getTotalAmount(o).toFixed(2)} {o.currency ?? ''}</td>
                                                            <td className="admin-orders-cell-actions">
                                                                <button disabled={saving}
                                                                        onClick={() => saveEdit(id as string | number)}
                                                                        className="admin-orders-btn-save">{saving ? 'Saving…' : 'Save'}</button>
                                                                <button disabled={saving} onClick={cancelEdit} className="admin-orders-btn-cancel">Cancel
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        <tr key={`edit-details-${id}`}>
                                                            <td colSpan={8} className="admin-orders-edit-details">
                                                                <div className="admin-orders-edit-grid">
                                                                    <div className="admin-orders-edit-full-width">
                                                                        <label>Notes</label>
                                                                        <textarea rows={2}
                                                                                  value={(editData.notes as string) ?? ''}
                                                                                  onChange={(e) => setEditData({
                                                                                      ...editData,
                                                                                      notes: e.target.value
                                                                                  })} className="admin-orders-field-input-resize"/>
                                                                    </div>
                                                                    <div className="admin-orders-edit-full-width">
                                                                        <label>Shipping Address</label>
                                                                        <textarea rows={2}
                                                                                  value={(editData.shippingAddress as string) ?? ''}
                                                                                  onChange={(e) => setEditData({
                                                                                      ...editData,
                                                                                      shippingAddress: e.target.value
                                                                                  })} className="admin-orders-field-input-resize"/>
                                                                    </div>
                                                                    <div className="admin-orders-edit-full-width">
                                                                        <label>Billing Address</label>
                                                                        <textarea rows={2}
                                                                                  value={(editData.billingAddress as string) ?? ''}
                                                                                  onChange={(e) => setEditData({
                                                                                      ...editData,
                                                                                      billingAddress: e.target.value
                                                                                  })} className="admin-orders-field-input-resize"/>
                                                                    </div>
                                                                    <div>
                                                                        <label>Currency</label>
                                                                        <input
                                                                            value={(editData.currency as string) ?? (o.currency ?? '')}
                                                                            onChange={(e) => setEditData({
                                                                                ...editData,
                                                                                currency: e.target.value
                                                                            })} className="admin-orders-field-input"/>
                                                                    </div>
                                                                    <div>
                                                                        <label>Payment Method</label>
                                                                        <input
                                                                            value={(editData.paymentMethod as string) ?? ''}
                                                                            onChange={(e) => setEditData({
                                                                                ...editData,
                                                                                paymentMethod: e.target.value
                                                                            })} className="admin-orders-field-input"/>
                                                                    </div>
                                                                    <div>
                                                                        <label>Payment ID</label>
                                                                        <input
                                                                            value={(editData.paymentId as string) ?? ''}
                                                                            onChange={(e) => setEditData({
                                                                                ...editData,
                                                                                paymentId: e.target.value
                                                                            })} className="admin-orders-field-input"/>
                                                                    </div>
                                                                    <div>
                                                                        <label>Payment Date</label>
                                                                        <input type="datetime-local"
                                                                               value={toDateTimeLocalStr(editData.paymentDate as string)}
                                                                               onChange={(e) => setEditData({
                                                                                   ...editData,
                                                                                   paymentDate: e.target.value
                                                                               })} className="admin-orders-field-input"/>
                                                                    </div>
                                                                </div>
                                                                <div className="admin-orders-items-section">
                                                                    <h4 className="admin-orders-items-heading">Order Items</h4>
                                                                    <div className="admin-orders-items-wrapper">
                                                                        <table className="admin-orders-items-table">
                                                                            <thead>
                                                                            <tr className="admin-orders-items-header">
                                                                                <th className="admin-orders-items-th">Product ID</th>
                                                                                <th className="admin-orders-items-th">Product Name</th>
                                                                                <th className="admin-orders-items-th">Unit Price</th>
                                                                                <th className="admin-orders-items-th">Quantity</th>
                                                                                <th className="admin-orders-items-th">Subtotal</th>
                                                                                <th className="admin-orders-items-th">Actions</th>
                                                                            </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                            {((editData.orderItems as AdminOrderItem[]) ?? []).map((it: AdminOrderItem, idx: number) => {
                                                                                const qty = Number(it.quantity ?? 0) || 0;
                                                                                const unit = Number((it.unitPrice ?? it.price) ?? 0) || 0;
                                                                                const sub = computeSubtotal(it);
                                                                                return (
                                                                                    <tr key={idx}>
                                                                                        <td className="admin-orders-cell-sm">
                                                                                            <input
                                                                                                value={(it.productId as string | number | undefined) ?? ''}
                                                                                                onChange={(e) => updateItem(idx, {productId: e.target.value})}
                                                                                                className="admin-orders-field-input"/>
                                                                                        </td>
                                                                                        <td className="admin-orders-cell-sm">
                                                                                            <input
                                                                                                value={(it.productName as string | undefined) ?? (it.name as string | undefined) ?? (it.title as string | undefined) ?? ''}
                                                                                                onChange={(e) => updateItem(idx, {productName: e.target.value})}
                                                                                                className="admin-orders-field-input"/>
                                                                                        </td>
                                                                                        <td className="admin-orders-cell-sm">
                                                                                            <input type="number"
                                                                                                   step="0.01"
                                                                                                   value={unit}
                                                                                                   onChange={(e) => updateItem(idx, {unitPrice: parseFloat(e.target.value || '0')})}
                                                                                                   className="admin-orders-field-input"/>
                                                                                        </td>
                                                                                        <td className="admin-orders-cell-sm">
                                                                                            <input type="number"
                                                                                                   step="1" value={qty}
                                                                                                   onChange={(e) => updateItem(idx, {quantity: parseInt(e.target.value || '0', 10)})}
                                                                                                   className="admin-orders-field-input"/>
                                                                                        </td>
                                                                                        <td className="admin-orders-cell-sm">{formatMoney(sub, (editData.currency as string) ?? o.currency)}</td>
                                                                                        <td className="admin-orders-cell-sm">
                                                                                            <button type="button"
                                                                                                    onClick={() => removeItem(idx)}
                                                                                                    className="admin-orders-btn-remove">Remove
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                            </tbody>
                                                                            <tfoot>
                                                                            <tr>
                                                                                <td colSpan={4} className="admin-orders-items-footer-total"><strong>Total</strong></td>
                                                                                <td className="admin-orders-cell">
                                                                                    <strong>{formatMoney(editItemsTotal(), (editData.currency as string) ?? o.currency)}</strong>
                                                                                </td>
                                                                                <td></td>
                                                                            </tr>
                                                                            </tfoot>
                                                                        </table>
                                                                    </div>
                                                                    <div className="admin-orders-add-item-wrapper">
                                                                        <button type="button" onClick={addItem} className="admin-orders-btn-add">Add Item
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </>
                                                );
                                            }

                                            return (
                                                <>
                                                    <tr key={String(id)}>
                                                        <td>{String(o.id ?? '—')}</td>
                                                        <td>{o.orderNumber ?? '—'}</td>
                                                        <td>{o.userEmail ?? '—'}</td>
                                                        <td>
                                                            <Badge variant={getStatusBadgeVariant(o.status)} size="sm">
                                                                {o.status ?? '—'}
                                                            </Badge>
                                                        </td>
                                                        <td>{formatDateTime(o.orderDate)}</td>
                                                        <td>{getItemsCount(o)}</td>
                                                        <td>{getTotalAmount(o).toFixed(2)} {o.currency ?? ''}</td>
                                                        <td className="text-right">
                                                            <div className="action-buttons">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => toggleExpanded(id as string | number)}
                                                                    title={String(expandedId) === String(id) ? 'Hide details' : 'View details'}
                                                                >
                                                                    <Eye size={14} />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => startEdit(o)}
                                                                    title="Edit order"
                                                                >
                                                                    <Pencil size={14} />
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(o.id!)}
                                                                    title="Delete order"
                                                                >
                                                                    <X size={14} />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {String(expandedId) === String(id) && (
                                                        <tr key={`details-${id}`}>
                                                            <td colSpan={8} className="admin-orders-view-details">
                                                                <div className="admin-orders-view-grid">
                                                                    <div>
                                                                        <h4 className="admin-orders-view-heading">Order Summary</h4>
                                                                        <div><strong>Order
                                                                            #:</strong> {o.orderNumber ?? '—'}</div>
                                                                        <div><strong>Placed
                                                                            at:</strong> {formatDateTime(o.orderDate)}
                                                                        </div>
                                                                        {o.paymentDate && <div><strong>Paid
                                                                            at:</strong> {formatDateTime(o.paymentDate)}
                                                                        </div>}
                                                                        <div><strong>Status:</strong> {o.status ?? '—'}
                                                                        </div>
                                                                        <div>
                                                                            <strong>Total:</strong> {formatMoney(getTotalAmount(o), o.currency)}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="admin-orders-view-heading">Addresses</h4>
                                                                        {o.shippingAddress && <div>
                                                                            <strong>Shipping:</strong> {o.shippingAddress}
                                                                        </div>}
                                                                        {o.billingAddress && <div>
                                                                            <strong>Billing:</strong> {o.billingAddress}
                                                                        </div>}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="admin-orders-view-heading">Payment</h4>
                                                                        {o.paymentMethod && <div>
                                                                            <strong>Method:</strong> {o.paymentMethod}
                                                                        </div>}
                                                                        {o.paymentId && <div><strong>Payment
                                                                            ID:</strong> {o.paymentId}</div>}
                                                                        {o.userEmail &&
                                                                            <div><strong>Email:</strong> {o.userEmail}
                                                                            </div>}
                                                                        {o.notes &&
                                                                            <div><strong>Notes:</strong> {o.notes}
                                                                            </div>}
                                                                    </div>

                                                                    {/* Order Fulfillment Section */}
                                                                    <div className="admin-orders-fulfillment-section">
                                                                        {/* Status Timeline */}
                                                                        <div className="admin-orders-timeline-card">
                                                                            <h4 className="admin-orders-timeline-heading">
                                                                                Order Progress
                                                                                {/* Show badge for digital-only orders */}
                                                                                {o.hasDigitalItems && !o.hasPhysicalItems && (
                                                                                    <span className="admin-orders-digital-badge">
                                                                                        Digital Order
                                                                                    </span>
                                                                                )}
                                                                            </h4>
                                                                            {o.status === 'CANCELLED' ? (
                                                                                <div className="admin-orders-cancelled-container">
                                                                                    <div className="admin-orders-cancelled-icon">
                                                                                        <XCircle size={20} color="#dc2626" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="admin-orders-cancelled-title">Order Cancelled</div>
                                                                                        {o.cancelledAt && <div className="admin-orders-cancelled-date">{formatDateTime(o.cancelledAt)}</div>}
                                                                                        {o.cancellationReason && <div className="admin-orders-cancelled-reason">{o.cancellationReason}</div>}
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                (() => {
                                                                                    // Digital-only orders have simplified timeline
                                                                                    const isDigitalOnly = o.hasDigitalItems && !o.hasPhysicalItems;
                                                                                    const status = o.status || '';

                                                                                    if (isDigitalOnly) {
                                                                                        // Digital order: Ordered → Paid → Completed
                                                                                        const digitalSteps = [
                                                                                            { key: 'ordered', label: 'Ordered', done: true, date: o.orderDate },
                                                                                            { key: 'paid', label: 'Paid', done: ['PAID', 'COMPLETED'].includes(status), date: o.paymentDate },
                                                                                            { key: 'completed', label: 'Completed', done: status === 'COMPLETED' || status === 'PAID', date: status === 'PAID' ? o.paymentDate : undefined }
                                                                                        ];
                                                                                        const completedSteps = digitalSteps.filter(s => s.done).length;
                                                                                        const progressWidth = completedSteps >= 3 ? 'calc(100% - 80px)' : completedSteps === 2 ? 'calc(50% - 40px)' : '0';

                                                                                        return (
                                                                                            <>
                                                                                                <div className="admin-orders-timeline">
                                                                                                    <div className="admin-orders-timeline-line-bg" />
                                                                                                    <div className="admin-orders-timeline-line-progress" style={{width: progressWidth}} />
                                                                                                    {digitalSteps.map((step, idx) => {
                                                                                                        const isCurrent = idx === completedSteps - 1;
                                                                                                        return (
                                                                                                            <div key={step.key} className="admin-orders-timeline-step">
                                                                                                                <div className={`admin-orders-timeline-step-circle ${isCurrent ? 'admin-orders-timeline-step-circle-current' : ''} ${step.done ? (isCurrent ? 'admin-orders-timeline-step-circle-done-current' : 'admin-orders-timeline-step-circle-done') : 'admin-orders-timeline-step-circle-pending'}`}>
                                                                                                                    {step.done ? (
                                                                                                                        <CheckCircle size={isCurrent ? 22 : 20} color="#fff" />
                                                                                                                    ) : (
                                                                                                                        <div className="admin-orders-timeline-step-dot" />
                                                                                                                    )}
                                                                                                                </div>
                                                                                                                <div className={`admin-orders-timeline-step-label ${step.done ? 'admin-orders-timeline-step-label-done' : ''} ${isCurrent ? 'admin-orders-timeline-step-label-current' : ''}`}>
                                                                                                                    {step.label}
                                                                                                                </div>
                                                                                                                {step.date && (
                                                                                                                    <div className="admin-orders-timeline-step-date">
                                                                                                                        {new Date(step.date).toLocaleDateString()}
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                                {/* Digital delivery info */}
                                                                                                {['PAID', 'COMPLETED'].includes(status) && (
                                                                                                    <div className="admin-orders-digital-delivery">
                                                                                                        <CheckCircle size={18} color="#16a34a" />
                                                                                                        <span className="admin-orders-digital-delivery-text">
                                                                                                            Digital products have been delivered to the customer's email.
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </>
                                                                                        );
                                                                                    }

                                                                                    // Physical order: full timeline
                                                                                    const physicalProgressWidth = status === 'DELIVERED' ? 'calc(100% - 80px)' :
                                                                                                       status === 'SHIPPED' ? 'calc(75% - 60px)' :
                                                                                                       (o.shippingStatus === 'PACKED' || o.packedAt) ? 'calc(50% - 40px)' :
                                                                                                       status === 'PROCESSING' ? 'calc(37.5% - 30px)' :
                                                                                                       status === 'PAID' ? 'calc(25% - 20px)' : '0';
                                                                                    return (
                                                                                        <div className="admin-orders-timeline">
                                                                                            {/* Progress line */}
                                                                                            <div className="admin-orders-timeline-line-bg" />
                                                                                            <div className="admin-orders-timeline-line-progress" style={{width: physicalProgressWidth}} />
                                                                                            {/* Steps */}
                                                                                            {[
                                                                                                { key: 'ordered', label: 'Ordered', done: true, date: o.orderDate },
                                                                                                { key: 'paid', label: 'Paid', done: ['PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED'].includes(status), date: o.paymentDate },
                                                                                                { key: 'processing', label: 'Processing', done: ['PROCESSING','SHIPPED','DELIVERED','COMPLETED'].includes(status) || !!o.packedAt },
                                                                                                { key: 'packed', label: 'Packed', done: !!o.packedAt || ['SHIPPED','DELIVERED','COMPLETED'].includes(status), date: o.packedAt },
                                                                                                { key: 'shipped', label: 'Shipped', done: ['SHIPPED','DELIVERED','COMPLETED'].includes(status), date: o.shippedAt },
                                                                                                { key: 'delivered', label: 'Delivered', done: ['DELIVERED','COMPLETED'].includes(status), date: o.deliveredAt }
                                                                                            ].map((step) => {
                                                                                                const isCurrent = (step.key === 'delivered' && ['DELIVERED','COMPLETED'].includes(status)) ||
                                                                                                                (step.key === 'shipped' && status === 'SHIPPED') ||
                                                                                                                (step.key === 'packed' && (o.shippingStatus === 'PACKED' || o.packedAt) && !['SHIPPED','DELIVERED','COMPLETED'].includes(status)) ||
                                                                                                                (step.key === 'processing' && status === 'PROCESSING' && !o.packedAt) ||
                                                                                                                (step.key === 'paid' && status === 'PAID') ||
                                                                                                                (step.key === 'ordered' && status === 'PENDING');
                                                                                                return (
                                                                                                    <div key={step.key} className="admin-orders-timeline-step">
                                                                                                        <div className={`admin-orders-timeline-step-circle ${isCurrent ? 'admin-orders-timeline-step-circle-current' : ''} ${step.done ? (isCurrent ? 'admin-orders-timeline-step-circle-done-current' : 'admin-orders-timeline-step-circle-done') : 'admin-orders-timeline-step-circle-pending'}`}>
                                                                                                            {step.done ? (
                                                                                                                <CheckCircle size={isCurrent ? 22 : 20} color="#fff" />
                                                                                                            ) : (
                                                                                                                <div className="admin-orders-timeline-step-dot" />
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <div className={`admin-orders-timeline-step-label ${step.done ? 'admin-orders-timeline-step-label-done' : ''} ${isCurrent ? 'admin-orders-timeline-step-label-current' : ''}`}>
                                                                                                            {step.label}
                                                                                                        </div>
                                                                                                        {step.date && (
                                                                                                            <div className="admin-orders-timeline-step-date">
                                                                                                                {new Date(step.date).toLocaleDateString()}
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    );
                                                                                })()
                                                                            )}
                                                                        </div>

                                                                        {/* Status Update Dropdown - Only for physical orders that are not completed */}
                                                                        {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && o.status !== 'REFUNDED' && o.status !== 'COMPLETED' && !(o.hasDigitalItems && !o.hasPhysicalItems) && (
                                                                            <div className="admin-orders-status-update-card">
                                                                                <h4 className="admin-orders-status-update-heading">
                                                                                    <Clock size={16} />
                                                                                    Update Status
                                                                                </h4>
                                                                                <div className="admin-orders-status-update-content">
                                                                                    <div className="admin-orders-status-select-wrapper">
                                                                                        <label className="admin-orders-status-label">
                                                                                            Change Status To
                                                                                        </label>
                                                                                        <select
                                                                                            value=""
                                                                                            onChange={async (e) => {
                                                                                                const newStatus = e.target.value;
                                                                                                if (!newStatus) return;
                                                                                                if (newStatus === 'SHIPPED') {
                                                                                                    handleMarkShipped(o);
                                                                                                } else if (newStatus === 'PROCESSING') {
                                                                                                    await handleMarkProcessing(o);
                                                                                                } else if (newStatus === 'PACKED') {
                                                                                                    await handleMarkPacked(o);
                                                                                                } else if (newStatus === 'DELIVERED') {
                                                                                                    await handleMarkDelivered(o);
                                                                                                }
                                                                                                e.target.value = '';
                                                                                            }}
                                                                                            disabled={statusUpdating}
                                                                                            className="admin-orders-status-select"
                                                                                        >
                                                                                            <option value="">Select next status...</option>
                                                                                            {(o.status === 'PENDING' || o.status === 'PAID') && (
                                                                                                <option value="PROCESSING">Processing</option>
                                                                                            )}
                                                                                            {(o.status === 'PROCESSING' || o.status === 'PAID') && (
                                                                                                <option value="PACKED">Packed</option>
                                                                                            )}
                                                                                            {(o.status === 'PROCESSING' || o.status === 'PAID' || o.shippingStatus === 'PACKED') && (
                                                                                                <option value="SHIPPED">Shipped (add tracking)</option>
                                                                                            )}
                                                                                            {o.status === 'SHIPPED' && (
                                                                                                <option value="DELIVERED">Delivered</option>
                                                                                            )}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="admin-orders-cancel-btn-wrapper">
                                                                                        <Button
                                                                                            variant="danger"
                                                                                            size="sm"
                                                                                            onClick={() => handleCancelOrder(o)}
                                                                                            disabled={statusUpdating}
                                                                                        >
                                                                                            <XCircle size={14} className="admin-orders-icon-mr-sm" />
                                                                                            Cancel Order
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Shipping Info Card - Only for physical orders */}
                                                                        {!(o.hasDigitalItems && !o.hasPhysicalItems) && (o.trackingNumber || o.shippingCarrier || o.status === 'SHIPPED' || o.status === 'DELIVERED') && (
                                                                            <div className="admin-orders-shipping-card">
                                                                                <h4 className="admin-orders-shipping-heading">
                                                                                    <Truck size={16} />
                                                                                    Shipping Details
                                                                                </h4>
                                                                                <div className="admin-orders-shipping-grid">
                                                                                    {o.shippingCarrier && (
                                                                                        <div>
                                                                                            <div className="admin-orders-shipping-label">Carrier</div>
                                                                                            <div className="admin-orders-shipping-value">{o.shippingCarrier}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {o.trackingNumber && (
                                                                                        <div>
                                                                                            <div className="admin-orders-shipping-label">Tracking Number</div>
                                                                                            <div className="admin-orders-shipping-value-mono">{o.trackingNumber}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {o.shippedAt && (
                                                                                        <div>
                                                                                            <div className="admin-orders-shipping-label">Shipped At</div>
                                                                                            <div className="admin-orders-shipping-value">{formatDateTime(o.shippedAt)}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {o.deliveredAt && (
                                                                                        <div>
                                                                                            <div className="admin-orders-shipping-label">Delivered At</div>
                                                                                            <div className="admin-orders-shipping-value">{formatDateTime(o.deliveredAt)}</div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                {o.trackingUrl && (
                                                                                    <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="admin-orders-track-link">
                                                                                        Track Package
                                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                                                                            <polyline points="15,3 21,3 21,9"/>
                                                                                            <line x1="10" y1="14" x2="21" y2="3"/>
                                                                                        </svg>
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="admin-orders-edit-full-width">
                                                                        <h4 className="admin-orders-items-heading">Order Items</h4>
                                                                        <div className="admin-orders-items-wrapper">
                                                                            <table className="admin-orders-items-table">
                                                                                <thead>
                                                                                <tr className="admin-orders-items-header">
                                                                                    <th className="admin-orders-items-th">Product</th>
                                                                                    <th className="admin-orders-items-th">Unit Price</th>
                                                                                    <th className="admin-orders-items-th">Quantity</th>
                                                                                    <th className="admin-orders-items-th">Subtotal</th>
                                                                                </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                {(o.orderItems ?? []).map((it: AdminOrderItem, idx: number) => {
                                                                                    const name = (it.productName ?? it.name ?? it.title ?? it.product?.name ?? it.product?.title ?? '—') as string;
                                                                                    const pid = (it.productId ?? it.product?.id ?? '—') as string | number;
                                                                                    const qty = Number(it.quantity ?? 0) || 0;
                                                                                    const unit = Number((it.unitPrice ?? it.price) ?? 0) || 0;
                                                                                    const sub = qty * unit;
                                                                                    return (
                                                                                        <tr key={idx}>
                                                                                            <td className="admin-orders-cell">
                                                                                                <div>{name}</div>
                                                                                                <div className="admin-orders-product-subtitle">ID: {String(pid)}</div>
                                                                                            </td>
                                                                                            <td className="admin-orders-cell">{formatMoney(unit, o.currency)}</td>
                                                                                            <td className="admin-orders-cell">{qty}</td>
                                                                                            <td className="admin-orders-cell">{formatMoney(sub, o.currency)}</td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                                </tbody>
                                                                                <tfoot>
                                                                                <tr>
                                                                                    <td colSpan={3} className="admin-orders-items-footer-total"><strong>Total</strong></td>
                                                                                    <td className="admin-orders-cell">
                                                                                        <strong>{formatMoney(getTotalAmount(o), o.currency)}</strong>
                                                                                    </td>
                                                                                </tr>
                                                                                </tfoot>
                                                                            </table>
                                                                        </div>
                                                                    </div>

                                                                    {/* Email History Section */}
                                                                    <div className="admin-orders-email-history">
                                                                        <OrderEmailHistory orderId={Number(o.id!)} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="admin-orders-pagination">
                                    <div className="admin-orders-pagination-info">
                                        Showing {orders.length > 0 ? (page * 20 + 1) : 0} - {Math.min((page + 1) * 20, totalElements)} of {totalElements} orders
                                    </div>
                                    <div className="admin-orders-pagination-controls">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadOrders(page - 1)}
                                            disabled={page === 0 || loading}
                                        >
                                            Previous
                                        </Button>
                                        <span className="admin-orders-pagination-page">
                                            Page {page + 1} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadOrders(page + 1)}
                                            disabled={page >= totalPages - 1 || loading}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                </div>
            </div>

            {/* Shipping Info Modal */}
            {statusModalOrder && (
                <div className="admin-orders-modal-overlay">
                    <div className="admin-orders-modal">
                        <h3 className="admin-orders-modal-heading">
                            <Truck size={20} />
                            Mark Order as Shipped
                        </h3>
                        <p className="admin-orders-modal-subtext">
                            Order #{statusModalOrder.orderNumber}
                        </p>

                        <div className="admin-orders-modal-form">
                            <div>
                                <label className="admin-orders-modal-label">
                                    Shipping Carrier
                                </label>
                                <select
                                    value={shippingCarrier}
                                    onChange={(e) => setShippingCarrier(e.target.value)}
                                    className="admin-orders-field-input"
                                >
                                    <option value="">Select carrier...</option>
                                    <option value="Slovak Post">Slovak Post</option>
                                    <option value="DPD">DPD</option>
                                    <option value="GLS">GLS</option>
                                    <option value="DHL">DHL</option>
                                    <option value="UPS">UPS</option>
                                    <option value="FedEx">FedEx</option>
                                    <option value="Packeta">Packeta</option>
                                    <option value="Zásilkovna">Zásilkovna</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="admin-orders-modal-label">
                                    Tracking Number
                                </label>
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="Enter tracking number..."
                                    className="admin-orders-field-input"
                                />
                            </div>

                            <div>
                                <label className="admin-orders-modal-label">
                                    Tracking URL (optional)
                                </label>
                                <input
                                    type="url"
                                    value={trackingUrl}
                                    onChange={(e) => setTrackingUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="admin-orders-field-input"
                                />
                            </div>
                        </div>

                        <div className="admin-orders-modal-actions">
                            <Button
                                variant="outline"
                                onClick={() => setStatusModalOrder(null)}
                                disabled={statusUpdating}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={confirmMarkShipped}
                                disabled={statusUpdating}
                            >
                                {statusUpdating ? 'Updating...' : 'Mark as Shipped'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminOrders;
