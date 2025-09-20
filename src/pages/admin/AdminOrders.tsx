import React, {useEffect, useMemo, useState} from 'react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import {adminOrdersService, type AdminOrderDTO, type AdminOrderItem} from '../../services/adminOrdersService';

const fieldInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #e5e7eb',
    borderRadius: 6
};
const smallBtn: React.CSSProperties = {padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer'};

const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<AdminOrderDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Tab navigation state
    const [activeTab, setActiveTab] = useState<'all-orders' | 'create-order'>('all-orders');

    const [createData, setCreateData] = useState<Partial<AdminOrderDTO>>({status: 'PENDING'});

    // Edit row
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editData, setEditData] = useState<Partial<AdminOrderDTO>>({});
    const [saving, setSaving] = useState<boolean>(false);

    // Expanded details (view mode)
    const [expandedId, setExpandedId] = useState<string | number | null>(null);
    const toggleExpanded = (id: string | number) => {
        setExpandedId(prev => (String(prev) === String(id) ? null : id));
    };

    // Search/filter (by orderNumber/email/status)
    const [query, setQuery] = useState<string>('');
    const filtered = useMemo(() => {
        if (!query.trim()) return orders;
        const q = query.toLowerCase();
        return orders.filter(o => `${o.orderNumber ?? ''} ${o.userEmail ?? ''} ${o.status ?? ''}`.toLowerCase().includes(q));
    }, [orders, query]);

    const loadOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminOrdersService.getAllOrders();
            setOrders(data);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load orders';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

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
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const payload: Partial<AdminOrderDTO> = {...createData};
            const created = await adminOrdersService.createOrder(payload);
            setOrders(prev => [created, ...prev]);
            setCreateData({status: 'PENDING'});
            setActiveTab('all-orders');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Create failed';
            setError(msg);
        }
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

    const handleDelete = async (o: AdminOrderDTO) => {
        const id = o.id;
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
                className={`dashboard-tab ${activeTab === 'all-orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('all-orders')}
            >
                All Orders
            </button>
            <button
                className={`dashboard-tab ${activeTab === 'create-order' ? 'active' : ''}`}
                onClick={() => setActiveTab('create-order')}
            >
                Create New Order
            </button>
        </nav>
    );

    return (
        <AdminLayout title="Orders" navTabs={navTabs}>
            <div className="admin-page">
                <div className="admin-container">
                    <div className="admin-header">
                        <div>
                            <h2 className="admin-title">Order Management</h2>
                            <p className="admin-subtitle">Manage customer orders, track status, and process payments
                                efficiently.</p>
                        </div>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    {/* Create Order Tab */}
                    {activeTab === 'create-order' && (
                        <div className="admin-card">
                            <h3 className="section-title">Create New Order</h3>
                            <form onSubmit={handleCreate} className="form-grid">
                                <div>
                                    <label className="form-label">Order Number</label>
                                    <input
                                        className="form-input"
                                        value={createData.orderNumber ?? ''}
                                        onChange={(e) => setCreateData({...createData, orderNumber: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">User Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={createData.userEmail ?? ''}
                                        onChange={(e) => setCreateData({...createData, userEmail: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Status</label>
                                    <input
                                        className="form-input"
                                        value={createData.status as string ?? ''}
                                        onChange={(e) => setCreateData({...createData, status: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Order Date</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={toDateTimeLocalStr(createData.orderDate as string)}
                                        onChange={(e) => setCreateData({...createData, orderDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Payment Date</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={toDateTimeLocalStr(createData.paymentDate as string)}
                                        onChange={(e) => setCreateData({...createData, paymentDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Currency</label>
                                    <input
                                        className="form-input"
                                        value={createData.currency ?? ''}
                                        onChange={(e) => setCreateData({...createData, currency: e.target.value})}
                                    />
                                </div>
                                <div style={{gridColumn: 'span 3'}}>
                                    <label className="form-label">Notes</label>
                                    <input
                                        className="form-input"
                                        value={createData.notes ?? ''}
                                        onChange={(e) => setCreateData({...createData, notes: e.target.value})}
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn btn-primary">Create Order</button>
                                    <button type="button" onClick={() => setActiveTab('all-orders')}
                                            className="btn btn-outline">Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* All Orders Tab */}
                    {activeTab === 'all-orders' && (
                        <>
                            <div className="admin-header-actions">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by order number, email, or status..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button onClick={loadOrders} className="btn btn-outline">
                                    Refresh
                                </button>
                            </div>

                            {/* Mobile Card Layout */}
                            <div className="mobile-table-cards">
                                {loading ? (
                                    <div className="mobile-table-card">
                                        <div className="table-empty">
                                            <div className="loading-spinner"></div> Loading orders...
                                        </div>
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
                                                        👁️
                                                    </Link>
                                                    <Link to={`/admin/orders/${order.id}/edit`} className="btn btn-outline btn-sm" title="Edit order">
                                                        ✏️
                                                    </Link>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(order.id!)} title="Delete order">
                                                        🗑️
                                                    </button>
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
                                                        <span className={`user-status ${order.status === 'completed' || order.status === 'paid' ? 'confirmed' : 'unconfirmed'}`}>
                                                            {order.status ?? '—'}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="mobile-field">
                                                    <span className="mobile-field-label">Order Date:</span>
                                                    <span className="mobile-field-value">{formatDatetime(order.orderDate)}</span>
                                                </div>
                                                <div className="mobile-field">
                                                    <span className="mobile-field-label">Items:</span>
                                                    <span className="mobile-field-value">{(order.items ?? []).length}</span>
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
                                                <div className="loading-spinner"></div>
                                                Loading orders...
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
                          <span className={`user-status ${o.status === 'COMPLETED' ? 'confirmed' : 'unconfirmed'}`}>
                            {o.status ?? '—'}
                          </span>
                                                        </td>
                                                        <td>{formatDateTime(o.orderDate)}</td>
                                                        <td>{getItemsCount(o)}</td>
                                                        <td>{getTotalAmount(o).toFixed(2)} {o.currency ?? ''}</td>
                                                        <td className="text-right">
                                                            <div className="action-buttons">
                                                                <button
                                                                    onClick={() => toggleExpanded(id as string | number)}
                                                                    className="btn btn-outline btn-sm"
                                                                    title={String(expandedId) === String(id) ? 'Hide details' : 'View details'}>
                                                                    👁️
                                                                </button>
                                                                <button onClick={() => startEdit(o)}
                                                                        className="btn btn-outline btn-sm"
                                                                        title="Edit order">
                                                                    ✏️
                                                                </button>
                                                                <button onClick={() => handleDelete(o)}
                                                                        className="btn btn-danger btn-sm"
                                                                        title="Delete order">
                                                                    🗑️
                                                                </button>
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
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminOrders;
