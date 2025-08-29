import React, { useState } from 'react';
import type { Order } from '../../context/authTypes';
import { orderService } from '../../services/orderService';
import './OrderDetailsCard.css';

export interface OrderDetailsCardProps {
  order: Order;
  onError?: (error: string) => void;
}

const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({
  order,
  onError
}) => {
  const [invoiceDownloadingId, setInvoiceDownloadingId] = useState<string | null>(null);
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null);

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

  // Currency formatter
  const formatCurrency = (amount: number, currency?: string) => {
    const code = (currency || 'EUR').toUpperCase();
    const symbol = code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : '';
    if (symbol) return `${symbol}${amount.toFixed(2)}`;
    return `${amount.toFixed(2)} ${code}`;
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

  // Handle invoice download
  const handleInvoiceDownload = async (order: Order) => {
    const apiOrderId = order.backendId || order.id;
    try {
      setInvoiceDownloadingId(order.id);
      await orderService.downloadInvoice(apiOrderId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to download invoice';
      onError?.(msg);
    } finally {
      setInvoiceDownloadingId(null);
    }
  };

  // Handle individual product download
  const handleProductDownload = async (productId: string, productName: string) => {
    const apiOrderId = order.backendId || order.id;
    try {
      setDownloadingItemId(productId);
      await orderService.downloadProduct(apiOrderId, productId, productName);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to download product';
      onError?.(msg);
    } finally {
      setDownloadingItemId(null);
    }
  };

  // Check if product is digital and downloadable
  const isDigitalProduct = (item: any) => {
    return item.productType?.toLowerCase() === 'digital';
  };

  // Check if order allows downloads (paid status)
  const allowsDownloads = ['completed', 'paid'].includes(order.status.toLowerCase());

  return (
    <div className="order-details-card" id={`order-details-${order.id}`} role="region" aria-label="Order details">
      <div className="order-details-header">
        <div className="order-info">
          <div className="order-meta">
            <span className="order-label">Order #{(order.orderNumber || order.id).toString()}</span>
            <span className="order-date-detail">{formatDateTime(order.date)}</span>
          </div>
          <div className={`order-status-large ${getStatusBadgeClass(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>
        <div className="order-total-section">
          <span className="total-label">Total</span>
          <span className="total-amount">{formatCurrency(order.totalAmount, order.currency)}</span>
        </div>
      </div>

      <div className="order-content-grid">
        <div className="order-summary-card">
          <h4 className="card-title">Order Details</h4>
          <div className="detail-row">
            <span className="detail-label">Order Number</span>
            <span className="detail-value">{order.orderNumber || order.id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Placed</span>
            <span className="detail-value">{formatDateTime(order.date)}</span>
          </div>
          {order.paymentDate && (
            <div className="detail-row">
              <span className="detail-label">Paid</span>
              <span className="detail-value">{formatDateTime(order.paymentDate)}</span>
            </div>
          )}
          {order.userEmail && (
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">{order.userEmail}</span>
            </div>
          )}
          
          {/* Invoice download section integrated into order details */}
          {(['completed','paid'].includes(order.status.toLowerCase())) && (
            <div className="detail-row invoice-download-row">
              <span className="detail-label">Invoice</span>
              <button 
                className="small-download-btn invoice-btn" 
                onClick={() => void handleInvoiceDownload(order)} 
                disabled={invoiceDownloadingId === order.id}
                title="Download Invoice"
              >
                <svg className="download-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span>{invoiceDownloadingId === order.id ? 'Downloading…' : 'Download'}</span>
              </button>
            </div>
          )}
        </div>



        {(order.shippingAddress || order.billingAddress) && (
          <div className="info-card">
            <h4 className="card-title">Addresses</h4>
            {order.shippingAddress && (
              <div className="detail-row multi">
                <span className="detail-label">Shipping</span>
                <span className="detail-value address">{order.shippingAddress}</span>
              </div>
            )}
            {order.billingAddress && (
              <div className="detail-row multi">
                <span className="detail-label">Billing</span>
                <span className="detail-value address">{order.billingAddress}</span>
              </div>
            )}
          </div>
        )}

        {(order.paymentMethod || order.paymentId) && (
          <div className="info-card">
            <h4 className="card-title">Payment</h4>
            {order.paymentMethod && (
              <div className="detail-row">
                <span className="detail-label">Method</span>
                <span className="detail-value">{order.paymentMethod}</span>
              </div>
            )}
            {order.paymentId && (
              <div className="detail-row">
                <span className="detail-label">Payment ID</span>
                <span className="detail-value">{order.paymentId}</span>
              </div>
            )}
          </div>
        )}

        {order.notes && (
          <div className="info-card notes-card">
            <h4 className="card-title">Notes</h4>
            <div className="notes-content">
              <span className="note-text">{order.notes}</span>
            </div>
          </div>
        )}
      </div>

      <div className="order-items">
        <div className="items-card">
          <h4 className="card-title">Order Items</h4>
          <div className="items-list">
            {order.items.map((item, index) => (
              <div key={index} className="item-card">
                <div className="item-header">
                  <div className="item-info">
                    <h5 className="item-name">{item.productName}</h5>
                    <div className="item-meta">
                      <span className="item-id">ID: {item.productId}</span>
                      {item.productType && (
                        <span className={`item-type ${item.productType?.toLowerCase() === 'digital' ? 'digital' : ''}`}>
                          {item.productType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="item-actions">
                    <div className="item-pricing">
                      <div className="price-row">
                        <span className="price-label">Unit Price</span>
                        <span className="price-value">{formatCurrency(item.price, order.currency)}</span>
                      </div>
                      <div className="price-row">
                        <span className="price-label">Quantity</span>
                        <span className="price-value">{item.quantity}</span>
                      </div>
                      <div className="price-row total">
                        <span className="price-label">Total</span>
                        <span className="price-value">{formatCurrency(item.price * item.quantity, order.currency)}</span>
                      </div>
                    </div>
                    
                    {/* Download button for digital products */}
                    {isDigitalProduct(item) && (
                      <div className="item-download">
                        {allowsDownloads ? (
                          <button
                            className="item-download-btn"
                            onClick={() => handleProductDownload(item.productId, item.productName)}
                            disabled={downloadingItemId === item.productId}
                          >
                            <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7,10 12,15 17,10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            <span>
                              {downloadingItemId === item.productId ? 'Downloading…' : 'Download'}
                            </span>
                          </button>
                        ) : (
                          <div className="download-unavailable">
                            <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                              <circle cx="12" cy="16" r="1"/>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            <span>Available after payment</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="order-total">
            <div className="total-row">
              <span className="total-label">Order Total</span>
              <span className="total-value">{formatCurrency(order.totalAmount, order.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsCard;
