import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import type { Order } from '../../context/authTypes';
import './OrderHistory.css';

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
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle order selection
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order === selectedOrder ? null : order);
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
      <div className="orders-list">
        {orders.map(order => (
          <div 
            key={order.id} 
            className={`order-card ${selectedOrder?.id === order.id ? 'expanded' : ''}`}
          >
            <div className="order-header" onClick={() => handleOrderSelect(order)}>
              <div className="order-header-left">
                <div className="order-id">Order #{order.id.substring(0, 8)}</div>
                <div className="order-date">{formatDate(order.date)}</div>
              </div>
              
              <div className="order-header-right">
                <div className={getStatusBadgeClass(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
                <div className="order-amount">${order.totalAmount.toFixed(2)}</div>
                <button className="toggle-details" aria-label="Toggle order details">
                  {selectedOrder?.id === order.id ? '−' : '+'}
                </button>
              </div>
            </div>
            
            {selectedOrder?.id === order.id && (
              <div className="order-details">
                <div className="order-items">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index} className="item-row">
                          <td className="item-name" data-label="Product">{item.productName}</td>
                          <td className="item-quantity" data-label="Quantity">{item.quantity}</td>
                          <td className="item-price" data-label="Price">${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td colSpan={2}>Total</td>
                        <td>${order.totalAmount.toFixed(2)}</td>
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