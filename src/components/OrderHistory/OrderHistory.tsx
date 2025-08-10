import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import type { Order } from '../../context/authTypes';
import './OrderHistory.css';
import { ordersService } from '../../services/ordersService';

const OrderHistory: React.FC = () => {
  const { user, getOrders, refreshOrders, ordersLoading, hasLoadedOrders } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Trigger fetching orders when this tab/component is opened
  useEffect(() => {
    if (user && !hasLoadedOrders && !ordersLoading) {
      void refreshOrders();
    }
  }, [user, hasLoadedOrders, ordersLoading, refreshOrders]);
  
  // Get orders from context
  const orders = getOrders();
  
  // Format date/time string
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Currency formatter (basic)
  const formatCurrency = (amount: number, currency?: string) => {
    const code = (currency || 'USD').toUpperCase();
    const symbol = code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : '';
    if (symbol) return `${symbol}${amount.toFixed(2)}`;
    return `${amount.toFixed(2)} ${code}`;
  };
  
  // Handle order selection
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order === selectedOrder ? null : order);
  };

  // Handle download of digital product
  const handleDownload = async (order: Order, productId: string, productName?: string) => {
    const orderId = order.backendId || order.id;
    await ordersService.downloadProduct(orderId, productId, productName);
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-badge completed';
      case 'processing':
        return 'status-badge processing';
      case 'shipped':
        return 'status-badge shipped';
      case 'cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  if (!user) {
    return (
      <div className="orders-empty-state">
        <p>Please log in to view your order history.</p>
      </div>
    );
  }

  if (ordersLoading || (!hasLoadedOrders && user)) {
    return (
      <div className="orders-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  } else if (orders.length === 0 && hasLoadedOrders) {
    return (
      <div className="orders-container">
        <div className="orders-toolbar">
          <button className="refresh-button" onClick={() => void refreshOrders()} disabled={ordersLoading} aria-busy={ordersLoading}>
            {ordersLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="orders-empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders yet.</p>
          <p>Browse our products and make your first purchase!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-toolbar">
        <button className="refresh-button" onClick={() => void refreshOrders()} disabled={ordersLoading} aria-busy={ordersLoading}>
          {ordersLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="orders-list">
        {orders.map(order => (
          <div 
            key={order.id} 
            className={`order-card ${selectedOrder?.id === order.id ? 'expanded' : ''}`}
          >
          <div className="order-header" onClick={() => handleOrderSelect(order)}>
              <div className="order-header-left">
                <div className="order-id">Order #{(order.orderNumber || order.id).toString().substring(0, 12)}</div>
                <div className="order-date">{formatDateTime(order.date)}</div>
              </div>
              
              <div className="order-header-right">
                <div className={getStatusBadgeClass(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
                <div className="order-amount">{formatCurrency(order.totalAmount, order.currency)}</div>
                <button className="toggle-details" aria-label="Toggle order details">
                  {selectedOrder?.id === order.id ? '−' : '+'}
                </button>
              </div>
            </div>
            
            {selectedOrder?.id === order.id && (
              <div className="order-details">
                <div className="order-info-grid">
                  <div className="order-section">
                    <h4 className="section-title">Order Summary</h4>
                    <div className="kv">
                      <span className="k">Order #</span>
                      <span className="v">{order.orderNumber || order.id}</span>
                    </div>
                    <div className="kv">
                      <span className="k">Placed at</span>
                      <span className="v">{formatDateTime(order.date)}</span>
                    </div>
                    {order.paymentDate && (
                      <div className="kv">
                        <span className="k">Paid at</span>
                        <span className="v">{formatDateTime(order.paymentDate)}</span>
                      </div>
                    )}
                    {order.userEmail && (
                      <div className="kv">
                        <span className="k">Email</span>
                        <span className="v">{order.userEmail}</span>
                      </div>
                    )}
                    <div className="kv">
                      <span className="k">Status</span>
                      <span className={`v ${getStatusBadgeClass(order.status)}`}>{order.status}</span>
                    </div>
                    <div className="kv total">
                      <span className="k">Total</span>
                      <span className="v">{formatCurrency(order.totalAmount, order.currency)}</span>
                    </div>
                  </div>

                  {(order.shippingAddress || order.billingAddress) && (
                    <div className="order-section">
                      <h4 className="section-title">Addresses</h4>
                      {order.shippingAddress && (
                        <div className="kv multi">
                          <span className="k">Shipping</span>
                          <span className="v address">{order.shippingAddress}</span>
                        </div>
                      )}
                      {order.billingAddress && (
                        <div className="kv multi">
                          <span className="k">Billing</span>
                          <span className="v address">{order.billingAddress}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(order.paymentMethod || order.paymentId) && (
                    <div className="order-section">
                      <h4 className="section-title">Payment</h4>
                      {order.paymentMethod && (
                        <div className="kv">
                          <span className="k">Method</span>
                          <span className="v">{order.paymentMethod}</span>
                        </div>
                      )}
                      {order.paymentId && (
                        <div className="kv">
                          <span className="k">Payment ID</span>
                          <span className="v">{order.paymentId}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {order.notes && (
                    <div className="order-section">
                      <h4 className="section-title">Notes</h4>
                      <div className="kv multi">
                        <span className="v note">{order.notes}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="order-items">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index} className="item-row">
                          <td className="item-name" data-label="Product">
                            <div>{item.productName}</div>
                            <div className="item-subtext">ID: {item.productId}</div>
                            {item.productType && (
                              <div className="item-subtext">Type: {item.productType}</div>
                            )}
                          </td>
                          <td className="item-unit-price" data-label="Unit Price">{formatCurrency(item.price, order.currency)}</td>
                          <td className="item-quantity" data-label="Quantity">{item.quantity}</td>
                          <td className="item-price" data-label="Total">{formatCurrency(item.price * item.quantity, order.currency)}</td>
                          <td className="item-actions" data-label="Actions">
                            <button className="download-button" onClick={() => void handleDownload(order, item.productId, item.productName)}>
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td colSpan={3}>Total</td>
                        <td>{formatCurrency(order.totalAmount, order.currency)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;