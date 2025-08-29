import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import type { Order } from '../../context/authTypes';
import './OrderHistory.css';
import { ordersService } from '../../services/ordersService';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { extractPerProductLinks } from '../../helpers/downloads';


const OrderHistory: React.FC = () => {
  const { user, getOrders, refreshOrders, ordersLoading, hasLoadedOrders } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceDownloadingId, setInvoiceDownloadingId] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [productsDownloadingId, setProductsDownloadingId] = useState<string | null>(null);
  
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
    const [productLinksByOrder, setProductLinksByOrder] = useState<Record<string, Array<{ label: string; url: string }>>>({});
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


  // Handle invoice download
  const handleInvoiceDownload = async (order: Order) => {
    setInvoiceError(null);
    const apiOrderId = order.backendId || order.id;
    try {
      setInvoiceDownloadingId(order.id);
      await orderService.downloadInvoice(apiOrderId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to download invoice';
      setInvoiceError(msg);
    } finally {
      setInvoiceDownloadingId(null);
    }
  };

  // Handle download of all products in an order
  const handleDownloadAllProducts = async (order: Order) => {
    try {
      setProductsDownloadingId(order.id);
      const orderId = order.backendId || order.id;
      for (const item of order.items) {
        await ordersService.downloadProduct(orderId, item.productId, item.productName);
      }
    } catch {
      // Could add error handling per item if needed
    } finally {
      setProductsDownloadingId(null);
    }
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
              <div className="order-details" id={`order-details-${order.id}`} role="region" aria-label="Order details">
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

                  <div className="order-section download-section" aria-label="Downloadable content">
                    <h4 className="section-title">Downloadable content</h4>
                    <div className="download-actions">
                      {(['completed','paid'].includes(order.status.toLowerCase())) ? (
                        <button className="download-button" onClick={() => void handleInvoiceDownload(order)} disabled={invoiceDownloadingId === order.id}>
                          {invoiceDownloadingId === order.id ? 'Downloading…' : 'Download invoice'}
                        </button>
                      ) : (
                        <div className="download-note">Invoice available once the order is paid.</div>
                      )}
                      {/* Dynamic per-product download buttons */}
                      {productLinksByOrder[order.id] && productLinksByOrder[order.id].length > 0 ? (
                        <div className="download-list">
                          {productLinksByOrder[order.id].map((pl, idx) => (
                            <button
                              key={idx}
                              className="download-button"
                              onClick={async () => {
                                try {
                                  console.log('[analytics] order-history per-product download click', { orderId: order.id, index: idx, label: pl.label });
                                  setProductsDownloadingId(order.id);
                                  const ok = await ordersService.downloadByUrl(pl.url, pl.label);
                                  if (!ok) {
                                    // Record a lightweight error for this order if needed
                                    // (we reuse invoiceError slot for simplicity to avoid adding more state)
                                    setInvoiceError('Failed to download file.');
                                  } else {
                                    setInvoiceError(null);
                                  }
                                } catch {
                                  setInvoiceError('Failed to download file.');
                                } finally {
                                  setProductsDownloadingId(null);
                                }
                              }}
                              disabled={productsDownloadingId === order.id}
                            >
                              {productsDownloadingId === order.id ? 'Downloading…' : (pl.label || 'Download')}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <>
                          {linksLoadingId === order.id && (
                            <div className="download-note">Loading links…</div>
                          )}
                          {linksErrorByOrder[order.id] && (
                            <div className="download-error" role="alert">{linksErrorByOrder[order.id]}</div>
                          )}
                          {/* Fallback: legacy one-click to download all items sequentially */}
                          <button className="download-button" onClick={() => void handleDownloadAllProducts(order)} disabled={productsDownloadingId === order.id}>
                            {productsDownloadingId === order.id ? 'Downloading…' : 'Download products'}
                          </button>
                        </>
                      )}
                    </div>
                    {invoiceError && selectedOrder?.id === order.id && (
                      <div className="download-error" role="alert">{invoiceError}</div>
                    )}
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