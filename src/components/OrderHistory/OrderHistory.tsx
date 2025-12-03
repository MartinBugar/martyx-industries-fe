import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import type { Order } from '../../context/authTypes';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './OrderHistory.css';
// Note: Download functionality moved to OrderDetailsCard
import OrderDetailsCard from '../OrderDetailsCard';
import { logError } from '../../services/logger';


const OrderHistory: React.FC = () => {
  const { user, getOrders, refreshOrders, ordersLoading, hasLoadedOrders } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Trigger fetching orders when this tab/component is opened
  useEffect(() => {
    if (user && !hasLoadedOrders && !ordersLoading) {
      void refreshOrders();
    }
  }, [user, hasLoadedOrders, ordersLoading, refreshOrders]);

  // Listen for refresh orders event from navigation
  useEffect(() => {
    const handleRefreshOrders = () => {
      if (user && !ordersLoading) {
        void refreshOrders();
      }
    };

    window.addEventListener('refreshOrders', handleRefreshOrders);
    return () => window.removeEventListener('refreshOrders', handleRefreshOrders);
  }, [user, ordersLoading, refreshOrders]);
  
  // Get orders from context and sort by date (newest first)
  const orders = getOrders().sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Descending order (newest first)
  });

    // Note: Download functionality is handled directly in OrderDetailsCard via orderService
  
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

  // Note: Download links are handled directly in OrderDetailsCard



  
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
        <LoadingSpinner size="small" />
      </div>
    );
  }

  if (orders.length === 0 && hasLoadedOrders) {
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
                <div className="order-id">Order #{(order.orderNumber || order.id).toString().substring(0, 12)}</div>
                <div className="order-date">{formatDateTime(order.date)}</div>
              </div>

              <div className="order-header-center">
                {(() => {
                  const status = order.status.toLowerCase();
                  // Check if digital-only order
                  const hasDigital = order.hasDigitalItems || order.items?.some(i => i.productType?.toUpperCase() === 'DIGITAL');
                  const hasPhysical = order.hasPhysicalItems || order.items?.some(i => i.productType?.toUpperCase() !== 'DIGITAL' && i.productType);
                  const isDigitalOnly = hasDigital && !hasPhysical;

                  // Payment required - PENDING or CANCELLED
                  if (status === 'pending' || status === 'cancelled') {
                    return (
                      <div className="status-badge status-payment-required">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {status === 'cancelled' ? 'Payment Failed' : 'Awaiting Payment'}
                      </div>
                    );
                  }

                  // Digital-only orders with PAID status are effectively COMPLETED
                  if (isDigitalOnly && status === 'paid') {
                    return <div className="status-badge status-completed">Completed</div>;
                  }

                  return (
                    <div className={getStatusBadgeClass(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  );
                })()}
              </div>

              <div className="order-header-right">
                <div className="order-amount">{formatCurrency(order.totalAmount, order.currency)}</div>
                <button
                  className="toggle-details"
                  type="button"
                  aria-label={selectedOrder?.id === order.id ? 'Collapse order details' : 'Expand order details'}
                  aria-expanded={selectedOrder?.id === order.id ? true : false}
                  aria-controls={`order-details-${order.id}`}
                >
                  <svg className="chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="sr-only">{selectedOrder?.id === order.id ? 'Collapse details' : 'Expand details'}</span>
                </button>
              </div>
            </div>
            
            {selectedOrder?.id === order.id && (
              <OrderDetailsCard
                order={order}
                onError={(error) => logError('Order details error:', error)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;