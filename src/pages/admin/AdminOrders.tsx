import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminOrdersService, type AdminOrderDTO, type AdminOrderItem } from '../../services/adminOrdersService';

const fieldInputStyle: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6 };
const smallBtn: React.CSSProperties = { padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' };

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [creating, setCreating] = useState<boolean>(false);
  const [createData, setCreateData] = useState<Partial<AdminOrderDTO>>({ status: 'PENDING' });

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

  useEffect(() => { loadOrders(); }, []);

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

  const startCreate = () => {
    setCreateData({ status: 'PENDING' });
    setCreating(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload: Partial<AdminOrderDTO> = { ...createData };
      const created = await adminOrdersService.createOrder(payload);
      setOrders(prev => [created, ...prev]);
      setCreating(false);
      setCreateData({ status: 'PENDING' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Create failed';
      setError(msg);
    }
  };

  const startEdit = (o: AdminOrderDTO) => {
    setEditingId(o.id ?? o.orderNumber ?? 'id');
    // Copy all fields to preserve items on save
    setEditData({ ...o });
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
      items[index] = { ...(items[index] ?? {}), ...patch } as AdminOrderItem;
      return { ...prev, orderItems: items };
    });
  };
  const addItem = () => {
    setEditData(prev => {
      const items = Array.isArray(prev.orderItems) ? [...(prev.orderItems as AdminOrderItem[])] : [];
      items.push({ productId: '', productName: '', quantity: 1, unitPrice: 0 } as AdminOrderItem);
      return { ...prev, orderItems: items };
    });
  };
  const removeItem = (index: number) => {
    setEditData(prev => {
      const items = Array.isArray(prev.orderItems) ? [...(prev.orderItems as AdminOrderItem[])] : [];
      items.splice(index, 1);
      return { ...prev, orderItems: items };
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

  return (
    <AdminLayout title="Orders">
      <div>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <input placeholder="Search by order number, email, or status" value={query} onChange={(e) => setQuery(e.target.value)} style={{ ...fieldInputStyle, maxWidth: 360 }} />
          <button onClick={loadOrders} style={{ ...smallBtn, background: '#111827', color: '#fff' }}>Refresh</button>
          <button onClick={startCreate} style={{ ...smallBtn, background: '#2563eb', color: '#fff' }}>Create Order</button>
        </div>

        {creating && (
          <form onSubmit={handleCreate} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label>Order Number</label>
                <input value={createData.orderNumber ?? ''} onChange={(e) => setCreateData({ ...createData, orderNumber: e.target.value })} style={fieldInputStyle} />
              </div>
              <div>
                <label>User Email</label>
                <input type="email" value={createData.userEmail ?? ''} onChange={(e) => setCreateData({ ...createData, userEmail: e.target.value })} style={fieldInputStyle} />
              </div>
              <div>
                <label>Status</label>
                <input value={createData.status as string ?? ''} onChange={(e) => setCreateData({ ...createData, status: e.target.value })} style={fieldInputStyle} />
              </div>
              <div>
                <label>Order Date</label>
                <input type="datetime-local" value={toDateTimeLocalStr(createData.orderDate as string)} onChange={(e) => setCreateData({ ...createData, orderDate: e.target.value })} style={fieldInputStyle} />
              </div>
              <div>
                <label>Payment Date</label>
                <input type="datetime-local" value={toDateTimeLocalStr(createData.paymentDate as string)} onChange={(e) => setCreateData({ ...createData, paymentDate: e.target.value })} style={fieldInputStyle} />
              </div>
              <div>
                <label>Currency</label>
                <input value={createData.currency ?? ''} onChange={(e) => setCreateData({ ...createData, currency: e.target.value })} style={fieldInputStyle} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label>Notes</label>
                <input value={createData.notes ?? ''} onChange={(e) => setCreateData({ ...createData, notes: e.target.value })} style={fieldInputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" style={{ ...smallBtn, background: '#16a34a', color: '#fff' }}>Create</button>
              <button type="button" onClick={() => setCreating(false)} style={{ ...smallBtn, background: '#6b7280', color: '#fff' }}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e7eb' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>ID</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Order #</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Email</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Order Date</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Items</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Total</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 16 }}>Loading…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 16 }}>No orders found.</td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const id = o.id ?? o.orderNumber ?? '';
                  const isEditing = editingId === id;
                  if (isEditing) {
                    return (
                      <>
                        <tr key={`edit-${id}`}>
                          <td style={{ padding: 8 }}>{String(o.id ?? '—')}</td>
                          <td style={{ padding: 8 }}>
                            <input value={editData.orderNumber as string ?? ''} onChange={(e) => setEditData({ ...editData, orderNumber: e.target.value })} style={fieldInputStyle} />
                          </td>
                          <td style={{ padding: 8 }}>
                            <input value={editData.userEmail as string ?? ''} onChange={(e) => setEditData({ ...editData, userEmail: e.target.value })} style={fieldInputStyle} />
                          </td>
                          <td style={{ padding: 8 }}>
                            <input value={editData.status as string ?? ''} onChange={(e) => setEditData({ ...editData, status: e.target.value })} style={fieldInputStyle} />
                          </td>
                          <td style={{ padding: 8 }}>
                            <input type="datetime-local" value={toDateTimeLocalStr(editData.orderDate as string)} onChange={(e) => setEditData({ ...editData, orderDate: e.target.value })} style={fieldInputStyle} />
                          </td>
                          <td style={{ padding: 8 }}>{getItemsCount(o)}</td>
                          <td style={{ padding: 8 }}>{getTotalAmount(o).toFixed(2)} {o.currency ?? ''}</td>
                          <td style={{ padding: 8, display: 'flex', gap: 6 }}>
                            <button disabled={saving} onClick={() => saveEdit(id as string | number)} style={{ ...smallBtn, background: '#16a34a', color: '#fff' }}>{saving ? 'Saving…' : 'Save'}</button>
                            <button disabled={saving} onClick={cancelEdit} style={{ ...smallBtn, background: '#6b7280', color: '#fff' }}>Cancel</button>
                          </td>
                        </tr>
                        <tr key={`edit-details-${id}`}>
                          <td colSpan={8} style={{ padding: 8, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                              <div style={{ gridColumn: 'span 3' }}>
                                <label>Notes</label>
                                <textarea rows={2} value={(editData.notes as string) ?? ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} style={{ ...fieldInputStyle, resize: 'vertical' }} />
                              </div>
                              <div style={{ gridColumn: 'span 3' }}>
                                <label>Shipping Address</label>
                                <textarea rows={2} value={(editData.shippingAddress as string) ?? ''} onChange={(e) => setEditData({ ...editData, shippingAddress: e.target.value })} style={{ ...fieldInputStyle, resize: 'vertical' }} />
                              </div>
                              <div style={{ gridColumn: 'span 3' }}>
                                <label>Billing Address</label>
                                <textarea rows={2} value={(editData.billingAddress as string) ?? ''} onChange={(e) => setEditData({ ...editData, billingAddress: e.target.value })} style={{ ...fieldInputStyle, resize: 'vertical' }} />
                              </div>
                              <div>
                                <label>Currency</label>
                                <input value={(editData.currency as string) ?? (o.currency ?? '')} onChange={(e) => setEditData({ ...editData, currency: e.target.value })} style={fieldInputStyle} />
                              </div>
                              <div>
                                <label>Payment Method</label>
                                <input value={(editData.paymentMethod as string) ?? ''} onChange={(e) => setEditData({ ...editData, paymentMethod: e.target.value })} style={fieldInputStyle} />
                              </div>
                              <div>
                                <label>Payment ID</label>
                                <input value={(editData.paymentId as string) ?? ''} onChange={(e) => setEditData({ ...editData, paymentId: e.target.value })} style={fieldInputStyle} />
                              </div>
                              <div>
                                <label>Payment Date</label>
                                <input type="datetime-local" value={toDateTimeLocalStr(editData.paymentDate as string)} onChange={(e) => setEditData({ ...editData, paymentDate: e.target.value })} style={fieldInputStyle} />
                              </div>
                            </div>
                            <div style={{ marginTop: 12 }}>
                              <h4 style={{ margin: '6px 0' }}>Order Items</h4>
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ background: '#eef2f7' }}>
                                      <th style={{ textAlign: 'left', padding: 8 }}>Product ID</th>
                                      <th style={{ textAlign: 'left', padding: 8 }}>Product Name</th>
                                      <th style={{ textAlign: 'left', padding: 8 }}>Unit Price</th>
                                      <th style={{ textAlign: 'left', padding: 8 }}>Quantity</th>
                                      <th style={{ textAlign: 'left', padding: 8 }}>Subtotal</th>
                                      <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {((editData.orderItems as AdminOrderItem[]) ?? []).map((it: AdminOrderItem, idx: number) => {
                                      const qty = Number(it.quantity ?? 0) || 0;
                                      const unit = Number((it.unitPrice ?? it.price) ?? 0) || 0;
                                      const sub = computeSubtotal(it);
                                      return (
                                        <tr key={idx}>
                                          <td style={{ padding: 6 }}>
                                            <input value={(it.productId as string | number | undefined) ?? ''} onChange={(e) => updateItem(idx, { productId: e.target.value })} style={fieldInputStyle} />
                                          </td>
                                          <td style={{ padding: 6 }}>
                                            <input value={(it.productName as string | undefined) ?? (it.name as string | undefined) ?? (it.title as string | undefined) ?? ''} onChange={(e) => updateItem(idx, { productName: e.target.value })} style={fieldInputStyle} />
                                          </td>
                                          <td style={{ padding: 6 }}>
                                            <input type="number" step="0.01" value={unit} onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value || '0') })} style={fieldInputStyle} />
                                          </td>
                                          <td style={{ padding: 6 }}>
                                            <input type="number" step="1" value={qty} onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value || '0', 10) })} style={fieldInputStyle} />
                                          </td>
                                          <td style={{ padding: 6 }}>{formatMoney(sub, (editData.currency as string) ?? o.currency)}</td>
                                          <td style={{ padding: 6 }}>
                                            <button type="button" onClick={() => removeItem(idx)} style={{ ...smallBtn, background: '#ef4444', color: '#fff' }}>Remove</button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr>
                                      <td colSpan={4} style={{ padding: 8, textAlign: 'right' }}><strong>Total</strong></td>
                                      <td style={{ padding: 8 }}><strong>{formatMoney(editItemsTotal(), (editData.currency as string) ?? o.currency)}</strong></td>
                                      <td></td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                              <div style={{ marginTop: 8 }}>
                                <button type="button" onClick={addItem} style={{ ...smallBtn, background: '#2563eb', color: '#fff' }}>Add Item</button>
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
                        <td style={{ padding: 8 }}>{String(o.id ?? '—')}</td>
                        <td style={{ padding: 8 }}>{o.orderNumber ?? '—'}</td>
                        <td style={{ padding: 8 }}>{o.userEmail ?? '—'}</td>
                        <td style={{ padding: 8 }}>{o.status ?? '—'}</td>
                        <td style={{ padding: 8 }}>{formatDateTime(o.orderDate)}</td>
                        <td style={{ padding: 8 }}>{getItemsCount(o)}</td>
                        <td style={{ padding: 8 }}>{getTotalAmount(o).toFixed(2)} {o.currency ?? ''}</td>
                        <td style={{ padding: 8, display: 'flex', gap: 6 }}>
                          <button onClick={() => toggleExpanded(id as string | number)} style={{ ...smallBtn, background: '#2563eb', color: '#fff' }}>{String(expandedId) === String(id) ? 'Hide' : 'Details'}</button>
                          <button onClick={() => startEdit(o)} style={{ ...smallBtn, background: '#111827', color: '#fff' }}>Edit</button>
                          <button onClick={() => handleDelete(o)} style={{ ...smallBtn, background: '#ef4444', color: '#fff' }}>Delete</button>
                        </td>
                      </tr>
                      {String(expandedId) === String(id) && (
                        <tr key={`details-${id}`}>
                          <td colSpan={8} style={{ padding: 12, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                              <div>
                                <h4 style={{ margin: '4px 0' }}>Order Summary</h4>
                                <div><strong>Order #:</strong> {o.orderNumber ?? '—'}</div>
                                <div><strong>Placed at:</strong> {formatDateTime(o.orderDate)}</div>
                                {o.paymentDate && <div><strong>Paid at:</strong> {formatDateTime(o.paymentDate)}</div>}
                                <div><strong>Status:</strong> {o.status ?? '—'}</div>
                                <div><strong>Total:</strong> {formatMoney(getTotalAmount(o), o.currency)}</div>
                              </div>
                              <div>
                                <h4 style={{ margin: '4px 0' }}>Addresses</h4>
                                {o.shippingAddress && <div><strong>Shipping:</strong> {o.shippingAddress}</div>}
                                {o.billingAddress && <div><strong>Billing:</strong> {o.billingAddress}</div>}
                              </div>
                              <div>
                                <h4 style={{ margin: '4px 0' }}>Payment</h4>
                                {o.paymentMethod && <div><strong>Method:</strong> {o.paymentMethod}</div>}
                                {o.paymentId && <div><strong>Payment ID:</strong> {o.paymentId}</div>}
                                {o.userEmail && <div><strong>Email:</strong> {o.userEmail}</div>}
                                {o.notes && <div><strong>Notes:</strong> {o.notes}</div>}
                              </div>
                              <div style={{ gridColumn: 'span 3' }}>
                                <h4 style={{ margin: '8px 0' }}>Order Items</h4>
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ background: '#eef2f7' }}>
                                        <th style={{ textAlign: 'left', padding: 8 }}>Product</th>
                                        <th style={{ textAlign: 'left', padding: 8 }}>Unit Price</th>
                                        <th style={{ textAlign: 'left', padding: 8 }}>Quantity</th>
                                        <th style={{ textAlign: 'left', padding: 8 }}>Subtotal</th>
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
                                            <td style={{ padding: 8 }}>
                                              <div>{name}</div>
                                              <div style={{ color: '#6b7280', fontSize: 12 }}>ID: {String(pid)}</div>
                                            </td>
                                            <td style={{ padding: 8 }}>{formatMoney(unit, o.currency)}</td>
                                            <td style={{ padding: 8 }}>{qty}</td>
                                            <td style={{ padding: 8 }}>{formatMoney(sub, o.currency)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                    <tfoot>
                                      <tr>
                                        <td colSpan={3} style={{ padding: 8, textAlign: 'right' }}><strong>Total</strong></td>
                                        <td style={{ padding: 8 }}><strong>{formatMoney(getTotalAmount(o), o.currency)}</strong></td>
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
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
