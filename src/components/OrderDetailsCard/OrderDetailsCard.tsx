import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Order } from '../../context/authTypes';
import { orderService, type ModularDownloadLink } from '../../services/orderService';
import { stripeService } from '../../services/stripeService';
import './OrderDetailsCard.css';

type OrderDetailsCardProps = {
  order: Order;
  onError?: (error: string) => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
}

const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({
  order,
  onError,
  onOrderUpdated
}) => {
  const { t } = useTranslation('common');
  const [invoiceDownloadingId, setInvoiceDownloadingId] = useState<string | null>(null);
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null);
  const [downloadingTokenId, setDownloadingTokenId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [retryingPayment, setRetryingPayment] = useState<boolean>(false);
  const [modularDownloads, setModularDownloads] = useState<Record<string, ModularDownloadLink[]>>({});
  const [loadingDownloads, setLoadingDownloads] = useState<Record<string, boolean>>({});

  // Check if order can be cancelled by user
  // - Only before SHIPPED status
  // - Has at least some physical items (digital-only orders can't be cancelled after payment)
  const canUserCancel = (): boolean => {
    const status = order.status.toUpperCase();
    const nonCancellableStatuses = ['SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (nonCancellableStatuses.includes(status)) return false;

    // If only digital items and already paid, can't cancel
    const hasPhysical = order.hasPhysicalItems || order.items.some(i => i.productType?.toUpperCase() !== 'DIGITAL');
    const hasDigital = order.hasDigitalItems || order.items.some(i => i.productType?.toUpperCase() === 'DIGITAL');

    // If PAID and only digital items - can't cancel (already delivered digitally)
    if (status === 'PAID' && hasDigital && !hasPhysical) return false;

    return true;
  };

  // Check if partial refund applies (has both physical and digital)
  const isPartialRefund = (): boolean => {
    const hasPhysical = order.hasPhysicalItems || order.items.some(i => i.productType?.toUpperCase() !== 'DIGITAL');
    const hasDigital = order.hasDigitalItems || order.items.some(i => i.productType?.toUpperCase() === 'DIGITAL');
    return hasPhysical && hasDigital;
  };

  // Check if order contains only digital products
  const isDigitalOnlyOrder = (): boolean => {
    const hasDigital = order.hasDigitalItems || order.items.some(i => i.productType?.toUpperCase() === 'DIGITAL');
    const hasPhysical = order.hasPhysicalItems || order.items.some(i => i.productType?.toUpperCase() !== 'DIGITAL' && i.productType);
    return hasDigital && !hasPhysical;
  };

  // Calculate physical items total for partial refund info
  const getPhysicalItemsTotal = (): number => {
    return order.items
      .filter(i => i.productType?.toUpperCase() !== 'DIGITAL')
      .reduce((sum, i) => sum + (i.price * i.quantity), 0);
  };

  // Check if order can retry payment (PENDING or CANCELLED status)
  const canRetryPayment = (): boolean => {
    const status = order.status.toUpperCase();
    return status === 'PENDING' || status === 'CANCELLED';
  };

  // Handle retry payment
  const handleRetryPayment = async () => {
    const orderId = Number(order.backendId || order.id);
    if (!orderId) return;

    setRetryingPayment(true);
    try {
      const response = await stripeService.retryPayment(orderId);
      // Redirect to Stripe Checkout
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to initiate payment');
      }
    } finally {
      setRetryingPayment(false);
    }
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!order.backendId && !order.id) return;

    setCancelling(true);
    try {
      const orderId = Number(order.backendId || order.id);
      await orderService.cancelOrder(orderId, 'User requested cancellation');

      // Update local order state
      if (onOrderUpdated) {
        onOrderUpdated({
          ...order,
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString(),
          cancellationReason: 'User requested cancellation'
        });
      }

      setShowCancelConfirm(false);
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to cancel order');
      }
    } finally {
      setCancelling(false);
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

  // Currency formatter
  const formatCurrency = (amount: number, currency?: string) => {
    const code = (currency || 'EUR').toUpperCase();
    const symbol = code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : '';
    if (symbol) return `${symbol}${amount.toFixed(2)}`;
    return `${amount.toFixed(2)} ${code}`;
  };

  // Format address string into structured lines
  // Backend format: "Street, City, State, PostalCode, Country"
  const formatAddressLines = (address: string): string[] => {
    if (!address) return [];
    const parts = address.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length <= 1) return parts;

    // Group into logical lines:
    // Line 1: Street
    // Line 2: City, Postal Code
    // Line 3: State/Country
    const lines: string[] = [];

    if (parts.length >= 1) lines.push(parts[0]); // Street
    if (parts.length >= 3) {
      // City + Postal Code on same line
      lines.push(`${parts[1]}, ${parts[3] || ''}`);
    } else if (parts.length >= 2) {
      lines.push(parts[1]);
    }
    if (parts.length >= 5) {
      // State + Country
      lines.push(`${parts[2]}, ${parts[4]}`);
    } else if (parts.length >= 4) {
      lines.push(parts[parts.length - 1]);
    }

    return lines.filter(l => l && l.trim() !== ',');
  };

  // Handle invoice download
  const handleInvoiceDownload = async (order: Order) => {
    const apiOrderId = order.backendId || order.id;
    try {
      setInvoiceDownloadingId(order.id);
      await orderService.downloadInvoice(apiOrderId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.failed_download_invoice');
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
      const msg = e instanceof Error ? e.message : t('admin.failed_download_product');
      onError?.(msg);
    } finally {
      setDownloadingItemId(null);
    }
  };

  // Check if order allows downloads (paid status)
  const allowsDownloads = ['completed', 'paid'].includes(order.status.toLowerCase());

  // Stable dependency: stringify item IDs to avoid re-fetching when items object reference changes
  const digitalItemIds = order.items
    .filter(item => item.productType?.toLowerCase() === 'digital')
    .map(item => item.id)
    .join(',');

  // Fetch modular downloads for digital items (parallel API calls)
  useEffect(() => {
    if (!allowsDownloads || !digitalItemIds) return;

    // AbortController for cleanup on unmount or dependency change
    const abortController = new AbortController();
    let isMounted = true;

    const fetchModularDownloads = async () => {
      const apiOrderId = order.backendId || order.id;

      // Parse item IDs from stable dependency
      const itemIdList = digitalItemIds.split(',');
      const digitalItems = order.items.filter(item => itemIdList.includes(item.id));

      if (digitalItems.length === 0) return;

      // Set all items to loading state
      const loadingState: Record<string, boolean> = {};
      digitalItems.forEach(item => { loadingState[item.id] = true; });
      if (isMounted) setLoadingDownloads(loadingState);

      try {
        // Fetch all downloads in parallel using Promise.allSettled
        const results = await Promise.allSettled(
          digitalItems.map(async item => {
            // Check if aborted before each request
            if (abortController.signal.aborted) {
              throw new Error('Aborted');
            }
            const response = await orderService.getOrderItemDownloads(apiOrderId, item.id);
            return { itemId: item.id, downloads: response.downloads };
          })
        );

        // Don't update state if unmounted or aborted
        if (!isMounted || abortController.signal.aborted) return;

        // Process results
        const newDownloads: Record<string, ModularDownloadLink[]> = {};
        const newLoadingState: Record<string, boolean> = {};

        results.forEach((result, index) => {
          const itemId = digitalItems[index].id;
          newLoadingState[itemId] = false;

          if (result.status === 'fulfilled' && result.value.downloads?.length > 0) {
            newDownloads[itemId] = result.value.downloads;
          }
          // If rejected, fallback to legacy download (no entry in newDownloads)
        });

        setModularDownloads(newDownloads);
        setLoadingDownloads(newLoadingState);
      } catch (err) {
        // Only log if not aborted (aborted is expected on cleanup)
        if (!abortController.signal.aborted) {
          console.error('Failed to fetch modular downloads:', err);
        }
        if (isMounted) {
          setLoadingDownloads({});
        }
      }
    };

    void fetchModularDownloads();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [order.id, order.backendId, digitalItemIds, allowsDownloads]);

  // Check if product is digital and downloadable
  const isDigitalProduct = (item: Order['items'][number]) => {
    return item.productType?.toLowerCase() === 'digital';
  };

  // Handle modular download by token
  const handleModularDownload = async (download: ModularDownloadLink) => {
    const tokenKey = `${download.downloadToken}`;
    try {
      setDownloadingTokenId(tokenKey);
      await orderService.downloadByToken(download.downloadToken, download.displayName);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.failed_download_product');
      onError?.(msg);
    } finally {
      setDownloadingTokenId(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="order-details-card" id={`order-details-${order.id}`} role="region" aria-label={t('aria.order_details')}>
      <div className="order-details-header">
        <div className="order-info">
          <div className="order-meta">
            <span className="order-label">Order #{(order.orderNumber || order.id).toString()}</span>
            <span className="order-date-detail">{formatDateTime(order.date)}</span>
          </div>
        </div>
        <div className="order-total-section">
          <span className="total-label">Total</span>
          <span className="total-amount">{formatCurrency(order.totalAmount, order.currency)}</span>
        </div>
      </div>

      {/* Payment Required - Show Pay Now button for PENDING/CANCELLED orders */}
      {canRetryPayment() && (
        <div className="order-progress-card payment-required">
          <div className="payment-required-content">
            <div className="payment-required-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div className="payment-required-text">
              <span className="payment-required-title">
                {order.status.toUpperCase() === 'CANCELLED' ? 'Payment Failed' : 'Payment Required'}
              </span>
              <span className="payment-required-desc">
                {order.status.toUpperCase() === 'CANCELLED'
                  ? 'Your payment was not completed. Click below to try again.'
                  : 'Complete your payment to process this order.'}
              </span>
            </div>
          </div>
          <button
            className="pay-now-btn"
            onClick={handleRetryPayment}
            disabled={retryingPayment}
          >
            {retryingPayment ? (
              <>
                <span className="spinner" />
                Processing...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M12 2v20M17 7l-5-5-5 5"/>
                </svg>
                Pay Now
              </>
            )}
          </button>
        </div>
      )}

      {/* Order Progress - Compact Timeline (for paid orders) */}
      {!canRetryPayment() && order.status.toLowerCase() !== 'cancelled' && (
        <div className="order-progress-card">
          {(() => {
            const status = order.status.toUpperCase();
            const isDigitalOnly = isDigitalOnlyOrder();

            const steps = isDigitalOnly
              ? [
                  { key: 'ordered', label: 'Ordered', done: true },
                  { key: 'paid', label: 'Paid', done: ['PAID', 'COMPLETED'].includes(status) },
                  { key: 'completed', label: 'Completed', done: status === 'COMPLETED' || (status === 'PAID' && isDigitalOnly) }
                ]
              : [
                  { key: 'ordered', label: 'Ordered', done: true },
                  { key: 'paid', label: 'Paid', done: ['PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED'].includes(status) },
                  { key: 'processing', label: 'Processing', done: ['PROCESSING','SHIPPED','DELIVERED','COMPLETED'].includes(status) },
                  { key: 'shipped', label: 'Shipped', done: ['SHIPPED','DELIVERED','COMPLETED'].includes(status) },
                  { key: 'delivered', label: 'Delivered', done: ['DELIVERED','COMPLETED'].includes(status) }
                ];

            const completedCount = steps.filter(s => s.done).length;
            const progressPercent = ((completedCount - 1) / (steps.length - 1)) * 100;

            return (
              <>
                {/* Progress Bar with Checkmarks */}
                <div className="progress-bar-container">
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="progress-bar-steps">
                    {steps.map((step) => (
                      <div key={step.key} className={`progress-bar-step ${step.done ? 'done' : ''}`}>
                        <span className="step-icon">
                          {step.done ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10">
                              <polyline points="20,6 9,17 4,12" />
                            </svg>
                          ) : (
                            <span className="step-dot" />
                          )}
                        </span>
                        <span className="step-label">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digital delivery notice */}
                {isDigitalOnly && ['PAID', 'COMPLETED'].includes(status) && (
                  <div className="digital-notice">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                    Delivered to your email
                  </div>
                )}
              </>
            );
          })()}

          {/* Tracking Info - Compact inline */}
          {!isDigitalOnlyOrder() && (order.trackingNumber || order.shippingTrackingNumber || order.shippingCarrier) && (
            <div className="tracking-inline">
              <div className="tracking-inline-info">
                {order.shippingCarrier && <span className="tracking-carrier">{order.shippingCarrier}</span>}
                {(order.trackingNumber || order.shippingTrackingNumber) && (
                  <span className="tracking-code">{order.trackingNumber || order.shippingTrackingNumber}</span>
                )}
              </div>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="tracking-link">
                  Track
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15,3 21,3 21,9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              )}
            </div>
          )}

          {order.estimatedDeliveryDate && !order.deliveredAt && (
            <div className="estimated-delivery-inline">
              Est. delivery: {formatDateTime(order.estimatedDeliveryDate)}
            </div>
          )}
        </div>
      )}

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
                title={t('aria.download_invoice')}
              >
                <svg className="download-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span>{invoiceDownloadingId === order.id ? t('download.downloading') : t('actions.download')}</span>
              </button>
            </div>
          )}
        </div>



        {order.shippingAddress && (
          <div className="order-summary-card">
            <h4 className="card-title">Shipping Address</h4>
            <div className="address-lines">
              {formatAddressLines(order.shippingAddress).map((line, idx) => (
                <div key={idx} className="address-line">{line}</div>
              ))}
            </div>
          </div>
        )}

        {order.billingAddress && (
          <div className="order-summary-card">
            <h4 className="card-title">Billing Address</h4>
            <div className="address-lines">
              {(order.firstName || order.lastName) && (
                <div className="address-line billing-name">
                  {[order.firstName, order.lastName].filter(Boolean).join(' ')}
                </div>
              )}
              {order.userEmail && (
                <div className="address-line billing-email">{order.userEmail}</div>
              )}
              {formatAddressLines(order.billingAddress).map((line, idx) => (
                <div key={idx} className="address-line">{line}</div>
              ))}
            </div>
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

        {/* Cancellation Info */}
        {order.status.toLowerCase() === 'cancelled' && (
          <div className="info-card cancelled-card">
            <h4 className="card-title cancelled-title">
              <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Order Cancelled
            </h4>
            {order.cancelledAt && (
              <div className="detail-row">
                <span className="detail-label">Cancelled At</span>
                <span className="detail-value">{formatDateTime(order.cancelledAt)}</span>
              </div>
            )}
            {order.cancellationReason && (
              <div className="detail-row">
                <span className="detail-label">Reason</span>
                <span className="detail-value">{order.cancellationReason}</span>
              </div>
            )}
          </div>
        )}

        {/* Cancel Order Section - only show if cancellable */}
        {canUserCancel() && (
          <div className="cancel-order-section">
            <div className="cancel-order-card">
              <div className="cancel-order-content">
                <div className="cancel-order-info">
                  <h5>Cancel this order?</h5>
                  <p>
                    {isPartialRefund()
                      ? `Only physical items will be refunded (${formatCurrency(getPhysicalItemsTotal(), order.currency)}). Digital products are non-refundable.`
                      : 'You can cancel this order before it is shipped. A full refund will be processed.'}
                  </p>
                </div>
                <button
                  className="cancel-order-btn"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelling}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="cancel-modal-overlay" onClick={() => setShowCancelConfirm(false)}>
          <div className="cancel-modal" onClick={e => e.stopPropagation()}>
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" style={{color: '#ef4444'}}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Confirm Cancellation
            </h3>

            {isPartialRefund() && (
              <div className="cancel-modal-warning">
                <p>
                  <strong>Important:</strong> This order contains digital products which are non-refundable as per our terms.
                  Only the physical items ({formatCurrency(getPhysicalItemsTotal(), order.currency)}) will be refunded.
                </p>
              </div>
            )}

            <p style={{marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
              Are you sure you want to cancel order <strong>#{order.orderNumber || order.id}</strong>?
              This action cannot be undone.
            </p>

            <div className="cancel-modal-actions">
              <button
                className="cancel-modal-btn secondary"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                className="cancel-modal-btn danger"
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                          <>
                            {loadingDownloads[item.id] ? (
                              <div className="download-loading">Loading downloads...</div>
                            ) : modularDownloads[item.id] && modularDownloads[item.id].length > 0 ? (
                              /* Modular downloads - show individual files */
                              <div className="modular-downloads">
                                {modularDownloads[item.id].map((download, idx) => (
                                  <button
                                    key={idx}
                                    className={`modular-download-btn ${download.downloadType === 'BASE' ? 'base' : 'option'}`}
                                    onClick={() => handleModularDownload(download)}
                                    disabled={downloadingTokenId === download.downloadToken || !download.isValid}
                                    title={download.isValid ? `Download ${download.displayName}` : 'Download expired or limit reached'}
                                  >
                                    <span className="modular-download-icon">
                                      {download.downloadType === 'BASE' ? '📁' : '🔧'}
                                    </span>
                                    <span className="modular-download-info">
                                      <span className="modular-download-name">{download.displayName}</span>
                                      {download.fileSize && (
                                        <span className="modular-download-size">{formatFileSize(download.fileSize)}</span>
                                      )}
                                    </span>
                                    <span className="modular-download-action">
                                      {downloadingTokenId === download.downloadToken ? '...' : '↓'}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              /* Legacy single download */
                              <button
                                className="item-download-btn"
                                onClick={() => handleProductDownload(item.id, item.productName)}
                                disabled={downloadingItemId === item.id}
                              >
                                <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                  <polyline points="7,10 12,15 17,10"/>
                                  <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                <span>
                                  {downloadingItemId === item.id ? t('download.downloading') : t('actions.download')}
                                </span>
                              </button>
                            )}
                          </>
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
