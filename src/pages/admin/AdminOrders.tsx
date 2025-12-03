import React, {useEffect, useMemo, useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, X, Plus, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
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

const fieldInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #e5e7eb',
    borderRadius: 6
};
const smallBtn: React.CSSProperties = {padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer'};

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
                                    className="form-input"
                                    placeholder="Search by order number, email, or status..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/admin/manual-orders/create')}
                                    title="Create manual order"
                                >
                                    <Plus size={16} style={{ marginRight: '8px' }} />
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
                                        <th style={{width: 70}}>ID</th>
                                        <th>Order #</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Order Date</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th style={{width: 170}} className="text-right">Actions</th>
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
                                                            <td style={{padding: 8}}>{String(o.id ?? '—')}</td>
                                                            <td style={{padding: 8}}>
                                                                <input value={editData.orderNumber as string ?? ''}
                                                                       onChange={(e) => setEditData({
                                                                           ...editData,
                                                                           orderNumber: e.target.value
                                                                       })} style={fieldInputStyle}/>
                                                            </td>
                                                            <td style={{padding: 8}}>
                                                                <input value={editData.userEmail as string ?? ''}
                                                                       onChange={(e) => setEditData({
                                                                           ...editData,
                                                                           userEmail: e.target.value
                                                                       })} style={fieldInputStyle}/>
                                                            </td>
                                                            <td style={{padding: 8}}>
                                                                <input value={editData.status as string ?? ''}
                                                                       onChange={(e) => setEditData({
                                                                           ...editData,
                                                                           status: e.target.value
                                                                       })} style={fieldInputStyle}/>
                                                            </td>
                                                            <td style={{padding: 8}}>
                                                                <input type="datetime-local"
                                                                       value={toDateTimeLocalStr(editData.orderDate as string)}
                                                                       onChange={(e) => setEditData({
                                                                           ...editData,
                                                                           orderDate: e.target.value
                                                                       })} style={fieldInputStyle}/>
                                                            </td>
                                                            <td style={{padding: 8}}>{getItemsCount(o)}</td>
                                                            <td style={{padding: 8}}>{getTotalAmount(o).toFixed(2)} {o.currency ?? ''}</td>
                                                            <td style={{padding: 8, display: 'flex', gap: 6}}>
                                                                <button disabled={saving}
                                                                        onClick={() => saveEdit(id as string | number)}
                                                                        style={{
                                                                            ...smallBtn,
                                                                            background: '#16a34a',
                                                                            color: '#fff'
                                                                        }}>{saving ? 'Saving…' : 'Save'}</button>
                                                                <button disabled={saving} onClick={cancelEdit} style={{
                                                                    ...smallBtn,
                                                                    background: '#6b7280',
                                                                    color: '#fff'
                                                                }}>Cancel
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        <tr key={`edit-details-${id}`}>
                                                            <td colSpan={8} style={{
                                                                padding: 8,
                                                                background: '#f9fafb',
                                                                borderTop: '1px solid #e5e7eb'
                                                            }}>
                                                                <div style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                                    gap: 12
                                                                }}>
                                                                    <div style={{gridColumn: 'span 3'}}>
                                                                        <label>Notes</label>
                                                                        <textarea rows={2}
                                                                                  value={(editData.notes as string) ?? ''}
                                                                                  onChange={(e) => setEditData({
                                                                                      ...editData,
                                                                                      notes: e.target.value
                                                                                  })} style={{
                                                                            ...fieldInputStyle,
                                                                            resize: 'vertical'
                                                                        }}/>
                                                                    </div>
                                                                    <div style={{gridColumn: 'span 3'}}>
                                                                        <label>Shipping Address</label>
                                                                        <textarea rows={2}
                                                                                  value={(editData.shippingAddress as string) ?? ''}
                                                                                  onChange={(e) => setEditData({
                                                                                      ...editData,
                                                                                      shippingAddress: e.target.value
                                                                                  })} style={{
                                                                            ...fieldInputStyle,
                                                                            resize: 'vertical'
                                                                        }}/>
                                                                    </div>
                                                                    <div style={{gridColumn: 'span 3'}}>
                                                                        <label>Billing Address</label>
                                                                        <textarea rows={2}
                                                                                  value={(editData.billingAddress as string) ?? ''}
                                                                                  onChange={(e) => setEditData({
                                                                                      ...editData,
                                                                                      billingAddress: e.target.value
                                                                                  })} style={{
                                                                            ...fieldInputStyle,
                                                                            resize: 'vertical'
                                                                        }}/>
                                                                    </div>
                                                                    <div>
                                                                        <label>Currency</label>
                                                                        <input
                                                                            value={(editData.currency as string) ?? (o.currency ?? '')}
                                                                            onChange={(e) => setEditData({
                                                                                ...editData,
                                                                                currency: e.target.value
                                                                            })} style={fieldInputStyle}/>
                                                                    </div>
                                                                    <div>
                                                                        <label>Payment Method</label>
                                                                        <input
                                                                            value={(editData.paymentMethod as string) ?? ''}
                                                                            onChange={(e) => setEditData({
                                                                                ...editData,
                                                                                paymentMethod: e.target.value
                                                                            })} style={fieldInputStyle}/>
                                                                    </div>
                                                                    <div>
                                                                        <label>Payment ID</label>
                                                                        <input
                                                                            value={(editData.paymentId as string) ?? ''}
                                                                            onChange={(e) => setEditData({
                                                                                ...editData,
                                                                                paymentId: e.target.value
                                                                            })} style={fieldInputStyle}/>
                                                                    </div>
                                                                    <div>
                                                                        <label>Payment Date</label>
                                                                        <input type="datetime-local"
                                                                               value={toDateTimeLocalStr(editData.paymentDate as string)}
                                                                               onChange={(e) => setEditData({
                                                                                   ...editData,
                                                                                   paymentDate: e.target.value
                                                                               })} style={fieldInputStyle}/>
                                                                    </div>
                                                                </div>
                                                                <div style={{marginTop: 12}}>
                                                                    <h4 style={{margin: '6px 0'}}>Order Items</h4>
                                                                    <div style={{overflowX: 'auto'}}>
                                                                        <table style={{
                                                                            width: '100%',
                                                                            borderCollapse: 'collapse'
                                                                        }}>
                                                                            <thead>
                                                                            <tr style={{background: '#eef2f7'}}>
                                                                                <th style={{
                                                                                    textAlign: 'left',
                                                                                    padding: 8
                                                                                }}>Product ID
                                                                                </th>
                                                                                <th style={{
                                                                                    textAlign: 'left',
                                                                                    padding: 8
                                                                                }}>Product Name
                                                                                </th>
                                                                                <th style={{
                                                                                    textAlign: 'left',
                                                                                    padding: 8
                                                                                }}>Unit Price
                                                                                </th>
                                                                                <th style={{
                                                                                    textAlign: 'left',
                                                                                    padding: 8
                                                                                }}>Quantity
                                                                                </th>
                                                                                <th style={{
                                                                                    textAlign: 'left',
                                                                                    padding: 8
                                                                                }}>Subtotal
                                                                                </th>
                                                                                <th style={{
                                                                                    textAlign: 'left',
                                                                                    padding: 8
                                                                                }}>Actions
                                                                                </th>
                                                                            </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                            {((editData.orderItems as AdminOrderItem[]) ?? []).map((it: AdminOrderItem, idx: number) => {
                                                                                const qty = Number(it.quantity ?? 0) || 0;
                                                                                const unit = Number((it.unitPrice ?? it.price) ?? 0) || 0;
                                                                                const sub = computeSubtotal(it);
                                                                                return (
                                                                                    <tr key={idx}>
                                                                                        <td style={{padding: 6}}>
                                                                                            <input
                                                                                                value={(it.productId as string | number | undefined) ?? ''}
                                                                                                onChange={(e) => updateItem(idx, {productId: e.target.value})}
                                                                                                style={fieldInputStyle}/>
                                                                                        </td>
                                                                                        <td style={{padding: 6}}>
                                                                                            <input
                                                                                                value={(it.productName as string | undefined) ?? (it.name as string | undefined) ?? (it.title as string | undefined) ?? ''}
                                                                                                onChange={(e) => updateItem(idx, {productName: e.target.value})}
                                                                                                style={fieldInputStyle}/>
                                                                                        </td>
                                                                                        <td style={{padding: 6}}>
                                                                                            <input type="number"
                                                                                                   step="0.01"
                                                                                                   value={unit}
                                                                                                   onChange={(e) => updateItem(idx, {unitPrice: parseFloat(e.target.value || '0')})}
                                                                                                   style={fieldInputStyle}/>
                                                                                        </td>
                                                                                        <td style={{padding: 6}}>
                                                                                            <input type="number"
                                                                                                   step="1" value={qty}
                                                                                                   onChange={(e) => updateItem(idx, {quantity: parseInt(e.target.value || '0', 10)})}
                                                                                                   style={fieldInputStyle}/>
                                                                                        </td>
                                                                                        <td style={{padding: 6}}>{formatMoney(sub, (editData.currency as string) ?? o.currency)}</td>
                                                                                        <td style={{padding: 6}}>
                                                                                            <button type="button"
                                                                                                    onClick={() => removeItem(idx)}
                                                                                                    style={{
                                                                                                        ...smallBtn,
                                                                                                        background: '#ef4444',
                                                                                                        color: '#fff'
                                                                                                    }}>Remove
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                            </tbody>
                                                                            <tfoot>
                                                                            <tr>
                                                                                <td colSpan={4} style={{
                                                                                    padding: 8,
                                                                                    textAlign: 'right'
                                                                                }}><strong>Total</strong></td>
                                                                                <td style={{padding: 8}}>
                                                                                    <strong>{formatMoney(editItemsTotal(), (editData.currency as string) ?? o.currency)}</strong>
                                                                                </td>
                                                                                <td></td>
                                                                            </tr>
                                                                            </tfoot>
                                                                        </table>
                                                                    </div>
                                                                    <div style={{marginTop: 8}}>
                                                                        <button type="button" onClick={addItem} style={{
                                                                            ...smallBtn,
                                                                            background: '#2563eb',
                                                                            color: '#fff'
                                                                        }}>Add Item
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
                                                            <td colSpan={8} style={{
                                                                padding: 12,
                                                                background: '#f9fafb',
                                                                borderTop: '1px solid #e5e7eb'
                                                            }}>
                                                                <div style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                                    gap: 12
                                                                }}>
                                                                    <div>
                                                                        <h4 style={{margin: '4px 0'}}>Order Summary</h4>
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
                                                                        <h4 style={{margin: '4px 0'}}>Addresses</h4>
                                                                        {o.shippingAddress && <div>
                                                                            <strong>Shipping:</strong> {o.shippingAddress}
                                                                        </div>}
                                                                        {o.billingAddress && <div>
                                                                            <strong>Billing:</strong> {o.billingAddress}
                                                                        </div>}
                                                                    </div>
                                                                    <div>
                                                                        <h4 style={{margin: '4px 0'}}>Payment</h4>
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
                                                                    <div style={{gridColumn: 'span 3', marginTop: 12}}>
                                                                        {/* Status Timeline */}
                                                                        <div style={{padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 16}}>
                                                                            <h4 style={{margin: '0 0 20px 0', fontSize: 14, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 8}}>
                                                                                Order Progress
                                                                                {/* Show badge for digital-only orders */}
                                                                                {o.hasDigitalItems && !o.hasPhysicalItems && (
                                                                                    <span style={{fontSize: 11, padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, fontWeight: 500}}>
                                                                                        Digital Order
                                                                                    </span>
                                                                                )}
                                                                            </h4>
                                                                            {o.status === 'CANCELLED' ? (
                                                                                <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca'}}>
                                                                                    <div style={{width: 40, height: 40, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                                                        <XCircle size={20} color="#dc2626" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div style={{fontWeight: 600, color: '#dc2626'}}>Order Cancelled</div>
                                                                                        {o.cancelledAt && <div style={{fontSize: 12, color: '#991b1b'}}>{formatDateTime(o.cancelledAt)}</div>}
                                                                                        {o.cancellationReason && <div style={{fontSize: 13, color: '#7f1d1d', marginTop: 4}}>{o.cancellationReason}</div>}
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
                                                                                                <div style={{display: 'flex', justifyContent: 'space-between', position: 'relative'}}>
                                                                                                    <div style={{position: 'absolute', top: 20, left: 40, right: 40, height: 3, background: '#e5e7eb', zIndex: 0}} />
                                                                                                    <div style={{position: 'absolute', top: 20, left: 40, height: 3, background: '#22c55e', zIndex: 1, width: progressWidth}} />
                                                                                                    {digitalSteps.map((step, idx) => {
                                                                                                        const isCurrent = idx === completedSteps - 1;
                                                                                                        return (
                                                                                                            <div key={step.key} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1}}>
                                                                                                                <div style={{
                                                                                                                    width: isCurrent ? 44 : 40,
                                                                                                                    height: isCurrent ? 44 : 40,
                                                                                                                    borderRadius: '50%',
                                                                                                                    background: step.done ? (isCurrent ? '#16a34a' : '#22c55e') : '#e5e7eb',
                                                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                                                    border: isCurrent ? '3px solid #bbf7d0' : 'none',
                                                                                                                    boxShadow: isCurrent ? '0 0 0 4px rgba(34,197,94,0.2)' : 'none',
                                                                                                                    transition: 'all 0.3s ease'
                                                                                                                }}>
                                                                                                                    {step.done ? (
                                                                                                                        <CheckCircle size={isCurrent ? 22 : 20} color="#fff" />
                                                                                                                    ) : (
                                                                                                                        <div style={{width: 12, height: 12, borderRadius: '50%', background: '#9ca3af'}} />
                                                                                                                    )}
                                                                                                                </div>
                                                                                                                <div style={{marginTop: 8, fontSize: 12, fontWeight: isCurrent ? 700 : 500, color: step.done ? '#16a34a' : '#6b7280', textAlign: 'center'}}>
                                                                                                                    {step.label}
                                                                                                                </div>
                                                                                                                {step.date && (
                                                                                                                    <div style={{fontSize: 10, color: '#9ca3af', marginTop: 2}}>
                                                                                                                        {new Date(step.date).toLocaleDateString()}
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                                {/* Digital delivery info */}
                                                                                                {['PAID', 'COMPLETED'].includes(status) && (
                                                                                                    <div style={{marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 10}}>
                                                                                                        <CheckCircle size={18} color="#16a34a" />
                                                                                                        <span style={{fontSize: 13, color: '#166534'}}>
                                                                                                            Digital products have been delivered to the customer's email.
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </>
                                                                                        );
                                                                                    }

                                                                                    // Physical order: full timeline
                                                                                    return (
                                                                                        <div style={{display: 'flex', justifyContent: 'space-between', position: 'relative'}}>
                                                                                            {/* Progress line */}
                                                                                            <div style={{position: 'absolute', top: 20, left: 40, right: 40, height: 3, background: '#e5e7eb', zIndex: 0}} />
                                                                                            <div style={{
                                                                                                position: 'absolute', top: 20, left: 40, height: 3, background: '#22c55e', zIndex: 1,
                                                                                                width: status === 'DELIVERED' ? 'calc(100% - 80px)' :
                                                                                                       status === 'SHIPPED' ? 'calc(75% - 60px)' :
                                                                                                       (o.shippingStatus === 'PACKED' || o.packedAt) ? 'calc(50% - 40px)' :
                                                                                                       status === 'PROCESSING' ? 'calc(37.5% - 30px)' :
                                                                                                       status === 'PAID' ? 'calc(25% - 20px)' : '0'
                                                                                            }} />
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
                                                                                                    <div key={step.key} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1}}>
                                                                                                        <div style={{
                                                                                                            width: isCurrent ? 44 : 40,
                                                                                                            height: isCurrent ? 44 : 40,
                                                                                                            borderRadius: '50%',
                                                                                                            background: step.done ? (isCurrent ? '#16a34a' : '#22c55e') : '#e5e7eb',
                                                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                                            border: isCurrent ? '3px solid #bbf7d0' : 'none',
                                                                                                            boxShadow: isCurrent ? '0 0 0 4px rgba(34,197,94,0.2)' : 'none',
                                                                                                            transition: 'all 0.3s ease'
                                                                                                        }}>
                                                                                                            {step.done ? (
                                                                                                                <CheckCircle size={isCurrent ? 22 : 20} color="#fff" />
                                                                                                            ) : (
                                                                                                                <div style={{width: 12, height: 12, borderRadius: '50%', background: '#9ca3af'}} />
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <div style={{marginTop: 8, fontSize: 12, fontWeight: isCurrent ? 700 : 500, color: step.done ? '#16a34a' : '#6b7280', textAlign: 'center'}}>
                                                                                                            {step.label}
                                                                                                        </div>
                                                                                                        {step.date && (
                                                                                                            <div style={{fontSize: 10, color: '#9ca3af', marginTop: 2}}>
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
                                                                            <div style={{padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 16}}>
                                                                                <h4 style={{margin: '0 0 16px 0', fontSize: 14, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 8}}>
                                                                                    <Clock size={16} />
                                                                                    Update Status
                                                                                </h4>
                                                                                <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start'}}>
                                                                                    <div style={{flex: '1 1 200px'}}>
                                                                                        <label style={{display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 6}}>
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
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                padding: '10px 12px',
                                                                                                borderRadius: 8,
                                                                                                border: '1px solid #d1d5db',
                                                                                                background: '#fff',
                                                                                                fontSize: 14,
                                                                                                cursor: 'pointer',
                                                                                                appearance: 'none',
                                                                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                                                                                backgroundRepeat: 'no-repeat',
                                                                                                backgroundPosition: 'right 10px center',
                                                                                                backgroundSize: '16px'
                                                                                            }}
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
                                                                                    <div style={{flex: '0 0 auto', paddingTop: 22}}>
                                                                                        <Button
                                                                                            variant="danger"
                                                                                            size="sm"
                                                                                            onClick={() => handleCancelOrder(o)}
                                                                                            disabled={statusUpdating}
                                                                                        >
                                                                                            <XCircle size={14} style={{marginRight: 4}} />
                                                                                            Cancel Order
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Shipping Info Card - Only for physical orders */}
                                                                        {!(o.hasDigitalItems && !o.hasPhysicalItems) && (o.trackingNumber || o.shippingCarrier || o.status === 'SHIPPED' || o.status === 'DELIVERED') && (
                                                                            <div style={{padding: 20, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: 12, border: '1px solid #bfdbfe'}}>
                                                                                <h4 style={{margin: '0 0 16px 0', fontSize: 14, fontWeight: 600, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8}}>
                                                                                    <Truck size={16} />
                                                                                    Shipping Details
                                                                                </h4>
                                                                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16}}>
                                                                                    {o.shippingCarrier && (
                                                                                        <div>
                                                                                            <div style={{fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4}}>Carrier</div>
                                                                                            <div style={{fontSize: 14, fontWeight: 600, color: '#1f2937'}}>{o.shippingCarrier}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {o.trackingNumber && (
                                                                                        <div>
                                                                                            <div style={{fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4}}>Tracking Number</div>
                                                                                            <div style={{fontSize: 14, fontWeight: 600, color: '#1f2937', fontFamily: 'monospace'}}>{o.trackingNumber}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {o.shippedAt && (
                                                                                        <div>
                                                                                            <div style={{fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4}}>Shipped At</div>
                                                                                            <div style={{fontSize: 14, fontWeight: 600, color: '#1f2937'}}>{formatDateTime(o.shippedAt)}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {o.deliveredAt && (
                                                                                        <div>
                                                                                            <div style={{fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4}}>Delivered At</div>
                                                                                            <div style={{fontSize: 14, fontWeight: 600, color: '#1f2937'}}>{formatDateTime(o.deliveredAt)}</div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                {o.trackingUrl && (
                                                                                    <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer"
                                                                                       style={{display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none'}}>
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

                                                                    <div style={{gridColumn: 'span 3'}}>
                                                                        <h4 style={{margin: '8px 0'}}>Order Items</h4>
                                                                        <div style={{overflowX: 'auto'}}>
                                                                            <table style={{
                                                                                width: '100%',
                                                                                borderCollapse: 'collapse'
                                                                            }}>
                                                                                <thead>
                                                                                <tr style={{background: '#eef2f7'}}>
                                                                                    <th style={{
                                                                                        textAlign: 'left',
                                                                                        padding: 8
                                                                                    }}>Product
                                                                                    </th>
                                                                                    <th style={{
                                                                                        textAlign: 'left',
                                                                                        padding: 8
                                                                                    }}>Unit Price
                                                                                    </th>
                                                                                    <th style={{
                                                                                        textAlign: 'left',
                                                                                        padding: 8
                                                                                    }}>Quantity
                                                                                    </th>
                                                                                    <th style={{
                                                                                        textAlign: 'left',
                                                                                        padding: 8
                                                                                    }}>Subtotal
                                                                                    </th>
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
                                                                                            <td style={{padding: 8}}>
                                                                                                <div>{name}</div>
                                                                                                <div style={{
                                                                                                    color: '#6b7280',
                                                                                                    fontSize: 12
                                                                                                }}>ID: {String(pid)}</div>
                                                                                            </td>
                                                                                            <td style={{padding: 8}}>{formatMoney(unit, o.currency)}</td>
                                                                                            <td style={{padding: 8}}>{qty}</td>
                                                                                            <td style={{padding: 8}}>{formatMoney(sub, o.currency)}</td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                                </tbody>
                                                                                <tfoot>
                                                                                <tr>
                                                                                    <td colSpan={3} style={{
                                                                                        padding: 8,
                                                                                        textAlign: 'right'
                                                                                    }}><strong>Total</strong></td>
                                                                                    <td style={{padding: 8}}>
                                                                                        <strong>{formatMoney(getTotalAmount(o), o.currency)}</strong>
                                                                                    </td>
                                                                                </tr>
                                                                                </tfoot>
                                                                            </table>
                                                                        </div>
                                                                    </div>

                                                                    {/* Email History Section */}
                                                                    <div style={{gridColumn: 'span 3', marginTop: '20px'}}>
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
                                <div className="pagination-controls" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                        Showing {orders.length > 0 ? (page * 20 + 1) : 0} - {Math.min((page + 1) * 20, totalElements)} of {totalElements} orders
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadOrders(page - 1)}
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
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: 24,
                        width: '100%',
                        maxWidth: 480,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        <h3 style={{margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8}}>
                            <Truck size={20} />
                            Mark Order as Shipped
                        </h3>
                        <p style={{margin: '0 0 16px 0', color: '#6b7280', fontSize: 14}}>
                            Order #{statusModalOrder.orderNumber}
                        </p>

                        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                            <div>
                                <label style={{display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14}}>
                                    Shipping Carrier
                                </label>
                                <select
                                    value={shippingCarrier}
                                    onChange={(e) => setShippingCarrier(e.target.value)}
                                    style={{...fieldInputStyle, width: '100%'}}
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
                                <label style={{display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14}}>
                                    Tracking Number
                                </label>
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="Enter tracking number..."
                                    style={fieldInputStyle}
                                />
                            </div>

                            <div>
                                <label style={{display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14}}>
                                    Tracking URL (optional)
                                </label>
                                <input
                                    type="url"
                                    value={trackingUrl}
                                    onChange={(e) => setTrackingUrl(e.target.value)}
                                    placeholder="https://..."
                                    style={fieldInputStyle}
                                />
                            </div>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20}}>
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
