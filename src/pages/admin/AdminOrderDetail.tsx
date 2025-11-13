import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Package, User, MapPin, CreditCard, Calendar, Mail, Download } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import { adminOrdersService, type AdminOrderDTO, type AdminOrderItem } from '../../services/adminOrdersService';
import { manualOrdersService } from '../../services/manualOrdersService';
import { adminInvoiceService } from '../../services/adminInvoiceService';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import OrderEmailHistory from '../../components/admin/OrderEmailHistory';

const AdminOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<AdminOrderDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Action states
  const [resendingEmail, setResendingEmail] = useState<boolean>(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrdersService.getOrderById(orderId);
      setOrder(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load order';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!order) return;

    setResendingEmail(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await manualOrdersService.resendOrderEmail(Number(order.id));
      setSuccessMessage(response.message);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to resend email';
      setError(msg);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order || !order.invoiceNumber) {
      setError('No invoice available for this order');
      return;
    }

    setDownloadingInvoice(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // First get invoice by order ID
      const invoice = await adminInvoiceService.getInvoiceByOrderId(Number(order.id));

      // Then download the PDF
      await adminInvoiceService.downloadAndSaveInvoicePdf(invoice.order_id, invoice.invoice_number);

      setSuccessMessage('Invoice downloaded successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to download invoice';
      setError(msg);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const formatDateTime = (value?: string): string => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  };

  const formatMoney = (amount: number | undefined, currency?: string): string => {
    const a = typeof amount === 'number' && isFinite(amount) ? amount : 0;
    return `${a.toFixed(2)} ${currency ?? 'EUR'}`.trim();
  };

  const calculateTotal = (): number => {
    if (!order || !order.orderItems) return 0;
    return order.orderItems.reduce((sum, item) => {
      const qty = typeof item.quantity === 'number' ? item.quantity : 1;
      const price = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
      return sum + (qty * price);
    }, 0);
  };

  const getStatusVariant = (status?: string): 'success' | 'warning' | 'danger' => {
    switch (status?.toUpperCase()) {
      case 'PAID':
      case 'DELIVERED':
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'danger';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Order Detail">
        <div className="admin-page">
          <div className="admin-container">
            <SkeletonTable rows={10} columns={2} />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Order Detail">
        <div className="admin-page">
          <div className="admin-container">
            <div className="alert alert-error">{error}</div>
            <Button variant="outline" onClick={() => navigate('/admin/orders')}>
              <ArrowLeft size={16} style={{ marginRight: '8px' }} />
              Back to Orders
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Order Detail">
        <div className="admin-page">
          <div className="admin-container">
            <div className="alert alert-error">Order not found</div>
            <Button variant="outline" onClick={() => navigate('/admin/orders')}>
              <ArrowLeft size={16} style={{ marginRight: '8px' }} />
              Back to Orders
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Order #${order.orderNumber || order.id}`}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          {/* Header Actions */}
          <div className="admin-header-actions" style={{ marginBottom: '20px' }}>
            <Button variant="outline" onClick={() => navigate('/admin/orders')}>
              <ArrowLeft size={16} style={{ marginRight: '8px' }} />
              Back to Orders
            </Button>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {order.invoiceNumber && (
                <Button
                  variant="outline"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  title="Download invoice PDF"
                >
                  <Download size={16} style={{ marginRight: '8px' }} />
                  {downloadingInvoice ? 'Downloading...' : 'Download Invoice'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={resendingEmail}
                title="Resend order confirmation email"
              >
                <Mail size={16} style={{ marginRight: '8px' }} />
                {resendingEmail ? 'Sending...' : 'Resend Email'}
              </Button>
              <Badge variant={getStatusVariant(order.status)} size="lg">
                {order.status}
              </Badge>
            </div>
          </div>

          {/* Order Summary */}
          <div className="admin-card" style={{ marginBottom: '20px' }}>
            <h3 className="section-title">
              <FileText size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Order Summary
            </h3>
            <div className="form-grid">
              <div>
                <label className="form-label">Order Number</label>
                <div className="form-value">{order.orderNumber || '—'}</div>
              </div>
              <div>
                <label className="form-label">Invoice Number</label>
                <div className="form-value">{order.invoiceNumber || '—'}</div>
              </div>
              <div>
                <label className="form-label">Order Date</label>
                <div className="form-value">
                  <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {formatDateTime(order.orderDate)}
                </div>
              </div>
              <div>
                <label className="form-label">Payment Date</label>
                <div className="form-value">
                  {order.paymentDate ? formatDateTime(order.paymentDate) : '—'}
                </div>
              </div>
              <div>
                <label className="form-label">Total Amount</label>
                <div className="form-value" style={{ fontWeight: 'bold', fontSize: '18px' }}>
                  {formatMoney(order.totalAmount || calculateTotal(), order.currency)}
                </div>
              </div>
              <div>
                <label className="form-label">Payment Method</label>
                <div className="form-value">
                  <CreditCard size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {order.paymentMethod || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="admin-card" style={{ marginBottom: '20px' }}>
            <h3 className="section-title">
              <User size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Customer Information
            </h3>
            <div className="form-grid">
              <div>
                <label className="form-label">Email</label>
                <div className="form-value">{order.userEmail || '—'}</div>
              </div>
              <div>
                <label className="form-label">Name</label>
                <div className="form-value">
                  {order.firstName || order.lastName
                    ? `${order.firstName || ''} ${order.lastName || ''}`.trim()
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          {(order.shippingAddress || order.billingAddress) && (
            <div className="admin-card" style={{ marginBottom: '20px' }}>
              <h3 className="section-title">
                <MapPin size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Addresses
              </h3>
              <div className="form-grid">
                {order.shippingAddress && (
                  <div>
                    <label className="form-label">Shipping Address</label>
                    <div className="form-value" style={{ whiteSpace: 'pre-wrap' }}>
                      {order.shippingAddress}
                    </div>
                  </div>
                )}
                {order.billingAddress && (
                  <div>
                    <label className="form-label">Billing Address</label>
                    <div className="form-value" style={{ whiteSpace: 'pre-wrap' }}>
                      {order.billingAddress}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="admin-card" style={{ marginBottom: '20px' }}>
            <h3 className="section-title">
              <Package size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Order Items
            </h3>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: '120px' }}>Unit Price</th>
                    <th style={{ width: '80px' }}>Quantity</th>
                    <th style={{ width: '120px' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.orderItems || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-empty">
                        No items in this order
                      </td>
                    </tr>
                  ) : (
                    (order.orderItems || []).map((item: AdminOrderItem, idx: number) => {
                      const name = (item.productName || item.name || item.title || '—') as string;
                      const qty = typeof item.quantity === 'number' ? item.quantity : 1;
                      const price = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
                      const subtotal = qty * price;

                      return (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{name}</div>
                            {item.productId && (
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                ID: {item.productId}
                              </div>
                            )}
                          </td>
                          <td>{formatMoney(price, order.currency)}</td>
                          <td>{qty}</td>
                          <td>{formatMoney(subtotal, order.currency)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      Total:
                    </td>
                    <td style={{ fontWeight: 'bold' }}>
                      {formatMoney(order.totalAmount || calculateTotal(), order.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="admin-card" style={{ marginBottom: '20px' }}>
              <h3 className="section-title">Notes</h3>
              <div style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{order.notes}</div>
            </div>
          )}

          {/* Email History */}
          <div className="admin-card">
            <h3 className="section-title">Email History</h3>
            <OrderEmailHistory orderId={Number(order.id)} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDetail;
