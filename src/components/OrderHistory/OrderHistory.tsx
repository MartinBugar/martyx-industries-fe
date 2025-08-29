import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import type { Order } from '../../context/authTypes';
import './OrderHistory.css';
import { paymentService } from '../../services/paymentService';
import { extractPerProductLinks } from '../../helpers/downloads';
import type { ProductLink } from '../../helpers/downloads';
import OrderDetailsCard from '../OrderDetailsCard';


const OrderHistory: React.FC = () => {
  const { user, getOrders, refreshOrders, ordersLoading, hasLoadedOrders } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  
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
  
  // Get orders from context
  const orders = getOrders();

    // Per-order dynamic download links derived from PaymentDTO
    const [productLinksByOrder, setProductLinksByOrder] = useState<Record<string, ProductLink[]>>({});
    const [linksLoadingId, setLinksLoadingId] = useState<string | null>(null);
    const [linksErrorByOrder, setLinksErrorByOrder] = useState<Record<string, string | null>>({});

    const ensureProductLinks = async (order: Order) => {
      try {
        if (!order || !order.paymentId) return;
        if (productLinksByOrder[order.id]) return;
        setLinksLoadingId(order.id);
        const dto = await paymentService.getPaymentDetails(order.paymentId);
        const built = extractPerProductLinks(dto);
        setProductLinksByOrder(prev => ({ ...prev, [order.id]: built }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load download links';
        setLinksErrorByOrder(prev => ({ ...prev, [order.id]: msg }));
      } finally {
        setLinksLoadingId(null);
      }
    };
  
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

  // When an order is selected, try to load its product download links (if paymentId is known)
  useEffect(() => {
    if (selectedOrder) {
      void ensureProductLinks(selectedOrder);
    }
  }, [selectedOrder]);



  
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
          <div className="neon-spinner">
            <div className="spinner-ring"></div>
          </div>
          <div className="loading-text">
            <span className="loading-label">ACCESSING DATABASE</span>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="loading-subtitle">Retrieving order data...</p>
          </div>
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
                <div className="order-id">Order #{(order.orderNumber || order.id).toString().substring(0, 12)}</div>
                <div className="order-date">{formatDateTime(order.date)}</div>
              </div>
              
              <div className="order-header-right">
                <div className={getStatusBadgeClass(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
                {order.status.toLowerCase() === 'paid' && (
                  <div className="status-badge status-completed">ORDER COMPLETED</div>
                )}
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
                productLinks={productLinksByOrder[order.id]}
                isLinksLoading={linksLoadingId === order.id}
                linksError={linksErrorByOrder[order.id]}
                onError={(error) => setInvoiceError(error)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;