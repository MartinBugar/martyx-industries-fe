import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import type { Order } from '../../context/authTypes';
import './OrderHistory.css';

const OrderHistory: React.FC = () => {
  const { user, getOrders } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Get orders from context
  const orders = getOrders();
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle order selection
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order === selectedOrder ? null : order);
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-badge completed';
      case 'processing':
        return 'status-badge processing';
      case 'cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  if (!user) {
    return (
      <div className="order-history-container">
        <p>Please log in to view your order history.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-container">
        <h2>Order History</h2>
        <div className="no-orders-message">
          <p>You haven't placed any orders yet.</p>
          <p>Browse our products and make your first purchase!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      <h2>Order History</h2>
      
      <div className="order-list">
        {orders.map(order => (
          <div 
            key={order.id} 
            className={`order-item ${selectedOrder?.id === order.id ? 'expanded' : ''}`}
            onClick={() => handleOrderSelect(order)}
          >
            <div className="order-summary">
              <div className="order-info">
                <div className="order-number">
                  Order #{order.id.substring(0, 8)}
                </div>
                <div className="order-date">
                  {formatDate(order.date)}
                </div>
              </div>
              
              <div className="order-details-summary">
                <div className="order-items-count">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </div>
                <div className="order-total">
                  ${order.totalAmount.toFixed(2)}
                </div>
                <div className={getStatusBadgeClass(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
              </div>
            </div>
            
            {selectedOrder?.id === order.id && (
              <div className="order-details">
                <h3>Order Items</h3>
                <div className="order-items-list">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item-detail">
                      <div className="item-name">{item.productName}</div>
                      <div className="item-details">
                        <span>Qty: {item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="order-total-detail">
                  <span>Total:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                
                <div className="order-status-detail">
                  <span>Status:</span>
                  <span className={getStatusBadgeClass(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
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