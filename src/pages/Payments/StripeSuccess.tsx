import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stripeService, type StripeSuccessResponse } from '../../services/stripeService';
import { API_BASE_URL } from '../../services/apiUtils';
import { useCart } from '../../context/useCart';
import './StripeSuccess.css';
import { logInfo, logError } from '../../services/logger';

/**
 * Formats file size in bytes to human-readable format (KB, MB, GB).
 */
const formatFileSize = (bytes: number): string => {
  if (bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

/**
 * Validates and sanitizes download URLs to prevent injection attacks.
 * Only allows URLs starting with /api/download/
 *
 * @param url - The URL to validate
 * @returns Validated full URL or null if invalid
 */
const validateDownloadUrl = (url: string | undefined): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Only allow URLs starting with /api/download/
  if (!trimmedUrl.startsWith('/api/download/')) {
    logError('Invalid download URL format:', trimmedUrl);
    return null;
  }

  // HIGH FIX #14: Prevent directory traversal attacks - check for encoded dots/slashes too
  if (trimmedUrl.includes('..') || trimmedUrl.includes('//') ||
      trimmedUrl.includes('%2E%2E') || trimmedUrl.includes('%2e%2e') ||
      trimmedUrl.includes('%2F%2F') || trimmedUrl.includes('%2f%2f')) {
    logError('Potential directory traversal in URL:', trimmedUrl);
    return null;
  }

  // Verify URL is from allowed download paths (remove query params for check)
  const pathOnly = trimmedUrl.split('?')[0];
  const allowedPrefixes = ['/api/download/', '/api/download/invoice/', '/api/download/modular/'];
  const isAllowed = allowedPrefixes.some(prefix => pathOnly.startsWith(prefix));

  if (!isAllowed) {
    logError('URL does not match allowed download paths:', trimmedUrl);
    return null;
  }

  // Use backend API URL instead of frontend URL
  return `${API_BASE_URL}${trimmedUrl}`;
};

const StripeSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<StripeSuccessResponse | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    // Validate session ID format before making API call
    if (!sessionId) {
      setError('No payment session found');
      setLoading(false);
      return;
    }

    // HIGH FIX #9: Validate Stripe session ID format with realistic length limit
    // Stripe session IDs are typically ~66 characters, max 100 for safety
    if (sessionId.length > 100 || !/^cs_[a-zA-Z0-9_]{1,96}$/.test(sessionId)) {
      logError('Invalid payment session ID length or format');
      setError('Invalid payment session ID');
      setLoading(false);
      return;
    }

    // CRITICAL: Clear payment_in_progress flag that was set before Stripe redirect
    // This allows CartContext to resume normal sync after payment completes
    logInfo('[StripeSuccess] Clearing payment_in_progress flag and cart localStorage');
    sessionStorage.removeItem('payment_in_progress');

    // Set flag to prevent CartContext from restoring localStorage cart
    // This flag is checked in CartContext's sync logic
    sessionStorage.setItem('cart_cleared_after_payment', 'true');

    // Clear localStorage cart immediately
    // Backend already cleared cart via webhook, this is redundant safety measure
    logInfo('[StripeSuccess] Clearing cart localStorage');
    localStorage.removeItem('martyx_cart_v1');
    clearCart();

    // Remove the flag after 10 seconds (enough time for any syncs to complete)
    setTimeout(() => {
      sessionStorage.removeItem('cart_cleared_after_payment');
    }, 10000);

    // Fetch payment details from backend
    const fetchPaymentDetails = async () => {
      try {
        const details = await stripeService.getSuccessDetails(sessionId);

        setPaymentData(details);

        setLoading(false);
      } catch (err) {
        logError('Failed to fetch payment details:', err);
        setError('Failed to verify payment. Please contact support.');
        setLoading(false);
      }
    };

    fetchPaymentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - sessionId comes from URL and won't change

  // Loading State
  if (loading) {
    return (
      <div className="status-container">
        <div className="loading-spinner" role="status" aria-label="Loading"></div>
        <h2>Verifying payment...</h2>
        <p>Please wait while we confirm your order</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="status-container error">
        <div className="status-icon error">
          <span>✕</span>
        </div>
        <h2>Payment Verification Failed</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate('/products')}
          className="btn-primary"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <main className="order-confirmation-container" role="main">
      {/* Success Header */}
      <div className="success-header">
        <div className="success-icon">
          <span>✓</span>
        </div>
        <h1>Payment Successful!</h1>
        <p>Thank you for your purchase</p>
      </div>

      {/* Order Details Card */}
      <div className="confirmation-card">
        <div className="card-header">
          <span className="card-icon">📋</span>
          <h2>Order Details</h2>
        </div>

        <div className="detail-row">
          <span className="detail-label">Order Number:</span>
          <span className="detail-value">
            {paymentData?.orderNumber || 'N/A'}
          </span>
        </div>

        {paymentData?.payerEmail && (
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{paymentData.payerEmail}</span>
          </div>
        )}

        {paymentData?.amount && paymentData?.currency && (
          <div className="detail-row">
            <span className="detail-label">Amount Paid:</span>
            <span className="detail-value amount">
              {paymentData.currency.toUpperCase()} {paymentData.amount.toFixed(2)}
            </span>
          </div>
        )}

        {paymentData?.status && (
          <div className="detail-row">
            <span className="detail-label">Payment Status:</span>
            <span className="detail-value">{paymentData.status}</span>
          </div>
        )}

        {paymentData?.transactionId && (
          <div className="detail-row">
            <span className="detail-label">Transaction ID:</span>
            <span className="detail-value mono">
              {paymentData.transactionId.substring(0, 32)}...
            </span>
          </div>
        )}
      </div>

      {/* Order Items Card */}
      {paymentData?.orderItems && paymentData.orderItems.length > 0 && (
        <div className="confirmation-card">
          <div className="card-header">
            <span className="card-icon">🛍️</span>
            <h2>Order Items</h2>
          </div>

          <div className="order-items-list">
            {paymentData.orderItems.map((item, index) => {
              const quantity = item.quantity || 1;
              const unitPrice = item.unitPrice || 0;
              const lineTotal = quantity * unitPrice;

              return (
                <div key={index} className="order-item">
                  <div className="item-details">
                    <div className="item-name">
                      {item.productName || 'Product'}
                    </div>
                    <div className="item-quantity">
                      Quantity: {quantity}
                    </div>
                  </div>
                  <div className="item-price">
                    €{lineTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Download Links Card - Only show if there are digital products */}
      {paymentData?.downloadLinks && paymentData.downloadLinks.length > 0 && (
        <div className="confirmation-card downloads-card">
          <div className="card-header">
            <span className="card-icon">📦</span>
            <h2>Your Digital Products</h2>
          </div>

          <div className="order-items-list">
            {(() => {
              // Group downloads by productId for modular display
              const groupedByProduct = new Map<string | number, typeof paymentData.downloadLinks>();
              paymentData.downloadLinks
                .filter(link => validateDownloadUrl(link.url) !== null)
                .forEach(link => {
                  const pid = link.productId || 'unknown';
                  if (!groupedByProduct.has(pid)) {
                    groupedByProduct.set(pid, []);
                  }
                  groupedByProduct.get(pid)!.push(link);
                });

              return Array.from(groupedByProduct.entries()).map(([productId, links]) => {
                const productName = links[0]?.productName || 'Product';
                const isModular = links.length > 1 ||
                  (links.length === 1 && links[0].downloadType && links[0].downloadType !== 'LEGACY');

                if (isModular) {
                  // Modular product - show product header with individual file buttons
                  return (
                    <div key={productId} className="modular-download-group">
                      <div className="modular-product-header">
                        <span className="modular-product-icon">📦</span>
                        <span className="modular-product-name">{productName}</span>
                      </div>
                      <div className="modular-download-files">
                        {links.map((link, idx) => {
                          const validatedUrl = validateDownloadUrl(link.url);
                          if (!validatedUrl) return null;

                          const isBase = link.downloadType === 'BASE';
                          const displayName = link.displayName || link.productName || 'Download';
                          const fileSize = link.fileSize ? formatFileSize(link.fileSize) : null;

                          return (
                            <a
                              key={idx}
                              href={validatedUrl}
                              download
                              className={`download-link modular-file ${isBase ? 'base-file' : 'option-file'}`}
                            >
                              <div className="download-link-icon">
                                <span>{isBase ? '📁' : '🔧'}</span>
                              </div>
                              <div className="download-link-info">
                                <div className="download-link-name">{displayName}</div>
                                <div className="download-link-hint">
                                  {isBase ? 'Base model files' : 'Configuration option'}
                                  {fileSize && ` • ${fileSize}`}
                                </div>
                              </div>
                              <span className="download-link-action">Download →</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  );
                } else {
                  // Legacy single file
                  const link = links[0];
                  const validatedUrl = validateDownloadUrl(link.url);
                  if (!validatedUrl) return null;

                  return (
                    <a
                      key={productId}
                      href={validatedUrl}
                      download
                      className="download-link"
                    >
                      <div className="download-link-icon">
                        <span>📥</span>
                      </div>
                      <div className="download-link-info">
                        <div className="download-link-name">{link.productName || 'Download'}</div>
                        <div className="download-link-hint">Click to download</div>
                      </div>
                      <span className="download-link-action">Download →</span>
                    </a>
                  );
                }
              });
            })()}
          </div>
        </div>
      )}

      {/* Invoice Download */}
      {paymentData?.invoiceDownloadUrl && validateDownloadUrl(paymentData.invoiceDownloadUrl) && (
        <a
          href={validateDownloadUrl(paymentData.invoiceDownloadUrl) || '#'}
          download
          className="invoice-btn"
        >
          📄 Download Invoice
        </a>
      )}

      {/* Email Confirmation Notice */}
      <div className="info-box success">
        <span className="info-box-icon">📧</span>
        <div className="info-box-content">
          <p>
            <strong>Confirmation email sent!</strong><br />
            A confirmation email with your order details and download links has been sent to <strong>{paymentData?.payerEmail || 'your email address'}</strong>.
          </p>
        </div>
      </div>

      {/* Delivery Information - Only show for physical/hybrid products */}
      {paymentData?.orderItems && paymentData.orderItems.some(item => item.requiresShipping === true) && (
        <div className="info-box">
          <span className="info-box-icon">🚚</span>
          <div className="info-box-content">
            <p>
              <strong>Physical items delivery:</strong><br />
              Your physical items will be shipped to the address provided during checkout. You will receive tracking information via email once your order ships.
            </p>
          </div>
        </div>
      )}

      {/* Customer Support Section */}
      <div className="support-section">
        <h3>Need Help?</h3>
        <p>
          If you have any questions about your order or need assistance, please contact our support team.
        </p>
        <a href="/contact" className="support-link">
          Contact Support
        </a>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={() => navigate('/products')}
          className="btn-primary"
        >
          Continue Shopping
        </button>
        <button
          onClick={() => navigate('/account')}
          className="btn-secondary"
        >
          View My Orders
        </button>
      </div>
    </main>
  );
};

export default StripeSuccess;
