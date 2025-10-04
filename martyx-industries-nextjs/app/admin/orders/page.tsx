'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenExpired } from '@/lib/services/apiUtils';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminOrdersService, type AdminOrder, type AdminOrderItem } from '@/lib/services/adminOrdersService';
import './AdminOrders.css';

type OrderTab = 'all' | 'create';
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export default function AdminOrders() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');

  // Create order form
  const [createForm, setCreateForm] = useState({
    userId: '',
    totalAmount: '',
    status: 'PENDING' as OrderStatus,
    shippingAddress: '',
    paymentMethod: ''
  });
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: string; price: string }>>([
    { productId: '', quantity: '1', price: '' }
  ]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    const hasWindow = typeof window !== 'undefined';
    const adminFlag = hasWindow && window.localStorage.getItem('adminAuthed') === 'true';
    const token = hasWindow ? window.localStorage.getItem('token') : null;
    const validToken = !!token && !isTokenExpired(token);

    if (!adminFlag || !validToken) {
      router.replace('/admin');
      return;
    }

    if (activeTab === 'all') {
      loadOrders();
    }
  }, [router, activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await adminOrdersService.getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toString().includes(searchTerm) ||
      order.shippingAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      await adminOrdersService.deleteOrder(orderId);
      await loadOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order');
    }
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: '1', price: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(false);

    if (!createForm.userId) {
      setCreateError('User ID is required');
      return;
    }

    const hasValidItems = orderItems.some(item =>
      item.productId && item.quantity && item.price
    );

    if (!hasValidItems) {
      setCreateError('At least one valid order item is required');
      return;
    }

    setCreating(true);
    try {
      const items: AdminOrderItem[] = orderItems
        .filter(item => item.productId && item.quantity && item.price)
        .map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        }));

      const total = calculateTotal();

      await adminOrdersService.createOrder({
        userId: parseInt(createForm.userId),
        totalAmount: total,
        status: createForm.status,
        shippingAddress: createForm.shippingAddress,
        paymentMethod: createForm.paymentMethod,
        items
      });

      setCreateSuccess(true);
      setCreateForm({
        userId: '',
        totalAmount: '',
        status: 'PENDING',
        shippingAddress: '',
        paymentMethod: ''
      });
      setOrderItems([{ productId: '', quantity: '1', price: '' }]);

      if (activeTab === 'all') {
        await loadOrders();
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      setCreateError('Failed to create order. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const navTabs = (
    <div className="admin-nav-tabs">
      <button
        className={`admin-nav-tab${activeTab === 'all' ? ' active' : ''}`}
        onClick={() => setActiveTab('all')}
      >
        📋 All Orders
      </button>
      <button
        className={`admin-nav-tab${activeTab === 'create' ? ' active' : ''}`}
        onClick={() => setActiveTab('create')}
      >
        ➕ Create Order
      </button>
    </div>
  );

  return (
    <AdminLayout title="Order Management" navTabs={navTabs}>
      {/* All Orders Tab */}
      {activeTab === 'all' && (
        <div className="orders-section">
          {/* Filters */}
          <div className="filters-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search orders by ID or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-box">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | OrderStatus)}
                className="filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <button className="refresh-btn" onClick={loadOrders}>
              🔄 Refresh
            </button>
          </div>

          {/* Summary Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{orders.length}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{orders.filter(o => o.status === 'PENDING').length}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                €{orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
              </div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Loading orders...</div>
          ) : (
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User ID</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Shipping Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">#{order.id}</td>
                      <td>{order.userId}</td>
                      <td className="price-cell">€{order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td className="address-cell">{order.shippingAddress || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => router.push(`/admin/orders/${order.id}`)}
                            className="action-btn view-btn"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="action-btn delete-btn"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="empty-state">
                  <p>No orders found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Order Tab */}
      {activeTab === 'create' && (
        <div className="create-section">
          <h2 className="section-title">Create New Order</h2>

          <form onSubmit={handleCreateOrder} className="create-form">
            {createError && (
              <div className="alert alert-error">{createError}</div>
            )}

            {createSuccess && (
              <div className="alert alert-success">Order created successfully!</div>
            )}

            {/* Order Information */}
            <div className="form-section">
              <h3 className="form-section-title">Order Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="userId">User ID *</label>
                  <input
                    id="userId"
                    type="number"
                    value={createForm.userId}
                    onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
                    placeholder="Enter user ID"
                    disabled={creating}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Order Status</label>
                  <select
                    id="status"
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as OrderStatus })}
                    disabled={creating}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method</label>
                  <input
                    id="paymentMethod"
                    type="text"
                    value={createForm.paymentMethod}
                    onChange={(e) => setCreateForm({ ...createForm, paymentMethod: e.target.value })}
                    placeholder="e.g., Credit Card, PayPal"
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="shippingAddress">Shipping Address</label>
                <textarea
                  id="shippingAddress"
                  value={createForm.shippingAddress}
                  onChange={(e) => setCreateForm({ ...createForm, shippingAddress: e.target.value })}
                  placeholder="Enter shipping address"
                  rows={3}
                  disabled={creating}
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="form-section">
              <div className="section-header">
                <h3 className="form-section-title">Order Items</h3>
                <button
                  type="button"
                  className="add-item-btn"
                  onClick={handleAddItem}
                  disabled={creating}
                >
                  + Add Item
                </button>
              </div>

              <div className="items-list">
                {orderItems.map((item, index) => (
                  <div key={index} className="order-item-row">
                    <div className="item-number">#{index + 1}</div>
                    <div className="item-fields">
                      <div className="form-group">
                        <label>Product ID</label>
                        <input
                          type="number"
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          placeholder="Product ID"
                          disabled={creating}
                        />
                      </div>
                      <div className="form-group">
                        <label>Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          placeholder="1"
                          disabled={creating}
                          min="1"
                        />
                      </div>
                      <div className="form-group">
                        <label>Price (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          placeholder="0.00"
                          disabled={creating}
                        />
                      </div>
                    </div>
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => handleRemoveItem(index)}
                        disabled={creating}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="total-section">
                <div className="total-label">Total Amount:</div>
                <div className="total-value">€{calculateTotal().toFixed(2)}</div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={creating}>
                {creating ? 'Creating...' : 'Create Order'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setCreateForm({
                    userId: '',
                    totalAmount: '',
                    status: 'PENDING',
                    shippingAddress: '',
                    paymentMethod: ''
                  });
                  setOrderItems([{ productId: '', quantity: '1', price: '' }]);
                  setCreateError(null);
                  setCreateSuccess(false);
                }}
                disabled={creating}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
