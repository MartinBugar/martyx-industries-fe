import React, { useEffect, useMemo, useState } from 'react';
import { Download, Mail, Search, X, FileText, RefreshCw } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import { adminInvoiceService, type PageResponse } from '../../services/adminInvoiceService';
import type { InvoiceDto } from '../../types/invoice';
import { Button, Badge, SkeletonTable } from '../../components/ui';

const AdminInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchDebounce, setSearchDebounce] = useState<string>('');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState<boolean>(false);

  // Resend email modal state
  const [resendModalOpen, setResendModalOpen] = useState<boolean>(false);
  const [resendInvoiceId, setResendInvoiceId] = useState<number | null>(null);
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resending, setResending] = useState<boolean>(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setPage(0); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load invoices
  const loadInvoices = async (pageNum: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse: PageResponse<InvoiceDto> = await adminInvoiceService.getAllInvoices(
        pageNum,
        20,
        'invoice_issued_at',
        'DESC',
        searchDebounce || undefined
      );
      setInvoices(pageResponse.content);
      setTotalPages(pageResponse.totalPages);
      setTotalElements(pageResponse.totalElements);
      setPage(pageResponse.number);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load invoices';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(0);
  }, [searchDebounce]);

  // Format date
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  // Download single invoice
  const handleDownloadInvoice = async (invoice: InvoiceDto) => {
    try {
      await adminInvoiceService.downloadAndSaveInvoicePdf(invoice.order_id, invoice.invoice_number);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Download failed';
      alert(`Error: ${msg}`);
    }
  };

  // Regenerate invoice
  const handleRegenerateInvoice = async (invoice: InvoiceDto) => {
    if (!confirm(`Regenerate invoice ${invoice.invoice_number}?`)) return;

    try {
      await adminInvoiceService.regenerateInvoice(invoice.order_id);
      alert('Invoice regenerated successfully');
      await loadInvoices(page);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Regenerate failed';
      alert(`Error: ${msg}`);
    }
  };

  // Toggle selection
  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map(inv => inv.order_id)));
    }
  };

  // Bulk download
  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) {
      alert('No invoices selected');
      return;
    }

    const selectedInvoices = invoices.filter(inv => selectedIds.has(inv.order_id));

    setBulkDownloading(true);
    try {
      await adminInvoiceService.bulkDownloadInvoices(selectedInvoices);
      alert(`Downloaded ${selectedInvoices.length} invoice(s) successfully`);
      setSelectedIds(new Set());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Bulk download failed';
      alert(`Error: ${msg}`);
    } finally {
      setBulkDownloading(false);
    }
  };

  // Open resend email modal
  const openResendModal = (invoice: InvoiceDto) => {
    setResendInvoiceId(invoice.order_id);
    setResendEmail(''); // Will use order email by default
    setResendModalOpen(true);
  };

  // Resend email
  const handleResendEmail = async () => {
    if (resendInvoiceId === null) return;

    setResending(true);
    setError(null);
    try {
      await adminInvoiceService.resendInvoiceEmail(
        resendInvoiceId,
        resendEmail.trim() || undefined
      );
      alert('Invoice email sent successfully');
      setResendModalOpen(false);
      setResendInvoiceId(null);
      setResendEmail('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Email send failed';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  // Pagination controls
  const handlePrevPage = () => {
    if (page > 0) {
      loadInvoices(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      loadInvoices(page + 1);
    }
  };

  // Computed values
  const hasSelection = selectedIds.size > 0;
  const showBulkActions = hasSelection;

  return (
    <AdminLayout>
      <div className="admin-container">
        <div className="admin-header">
          <h1>Invoice Management</h1>
        </div>

        {error && (
          <div className="error-alert" style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            color: '#c00'
          }}>
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                float: 'right',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }}
            />
            <input
              type="text"
              placeholder="Search by invoice number or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {selectedIds.size} invoice(s) selected
            </span>
            <Button
              onClick={handleBulkDownload}
              disabled={bulkDownloading}
              style={{ marginLeft: 'auto' }}
            >
              <Download size={16} style={{ marginRight: 6 }} />
              {bulkDownloading ? 'Downloading...' : 'Download Selected'}
            </Button>
            <Button
              onClick={() => setSelectedIds(new Set())}
              variant="outline"
            >
              Clear Selection
            </Button>
          </div>
        )}

        {/* Invoice Table */}
        {loading ? (
          <SkeletonTable rows={10} columns={8} />
        ) : invoices.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: '#f9fafb',
            borderRadius: 8,
            border: '1px dashed #e5e7eb'
          }}>
            <FileText size={48} style={{ color: '#9ca3af', marginBottom: 16 }} />
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 8 }}>
              No invoices found
            </p>
            {searchQuery && (
              <p style={{ fontSize: 14, color: '#9ca3af' }}>
                Try adjusting your search criteria
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="table-container" style={{ display: 'block' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === invoices.length && invoices.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Invoice Number</th>
                    <th>Order ID</th>
                    <th>Order Number</th>
                    <th>Issued Date</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th>Status</th>
                    <th style={{ width: 200, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.order_id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(invoice.order_id)}
                          onChange={() => toggleSelection(invoice.order_id)}
                        />
                      </td>
                      <td>
                        <strong>{invoice.invoice_number}</strong>
                      </td>
                      <td>#{invoice.order_id}</td>
                      <td>{invoice.order_number}</td>
                      <td>{formatDate(invoice.invoice_issued_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <strong>{formatCurrency(invoice.total_amount, invoice.currency)}</strong>
                      </td>
                      <td>
                        <Badge variant="success">Issued</Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleDownloadInvoice(invoice)}
                            title="Download PDF"
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: 6,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handleRegenerateInvoice(invoice)}
                            title="Regenerate PDF"
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: 6,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => openResendModal(invoice)}
                            title="Resend Email"
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: 6,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Mail size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-table-cards">
              {invoices.map((invoice) => (
                <div key={invoice.order_id} className="mobile-table-card">
                  <div className="mobile-card-header">
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(invoice.order_id)}
                        onChange={() => toggleSelection(invoice.order_id)}
                        style={{ marginRight: 8 }}
                      />
                      <strong>{invoice.invoice_number}</strong>
                    </div>
                    <Badge variant="success">Issued</Badge>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-card-field">
                      <span>Order ID:</span>
                      <span>#{invoice.order_id}</span>
                    </div>
                    <div className="mobile-card-field">
                      <span>Order Number:</span>
                      <span>{invoice.order_number}</span>
                    </div>
                    <div className="mobile-card-field">
                      <span>Issued:</span>
                      <span>{formatDate(invoice.invoice_issued_at)}</span>
                    </div>
                    <div className="mobile-card-field">
                      <span>Total:</span>
                      <strong>{formatCurrency(invoice.total_amount, invoice.currency)}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <Button
                        onClick={() => handleDownloadInvoice(invoice)}
                        size="sm"
                        variant="outline"
                      >
                        <Download size={14} style={{ marginRight: 4 }} />
                        Download
                      </Button>
                      <Button
                        onClick={() => openResendModal(invoice)}
                        size="sm"
                        variant="outline"
                      >
                        <Mail size={14} style={{ marginRight: 4 }} />
                        Resend
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 20,
                padding: '12px 0'
              }}>
                <span style={{ fontSize: 14, color: '#6b7280' }}>
                  Showing {page * 20 + 1} - {Math.min((page + 1) * 20, totalElements)} of {totalElements}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    onClick={handlePrevPage}
                    disabled={page === 0}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span style={{ padding: '8px 12px', fontSize: 14 }}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    onClick={handleNextPage}
                    disabled={page >= totalPages - 1}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Resend Email Modal */}
        {resendModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 20 }}>
                Resend Invoice Email
              </h2>
              <p style={{ marginBottom: 16, color: '#6b7280', fontSize: 14 }}>
                Send invoice email to customer. Leave email field empty to use the order's email address.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="customer@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => {
                    setResendModalOpen(false);
                    setResendInvoiceId(null);
                    setResendEmail('');
                  }}
                  variant="outline"
                  disabled={resending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResendEmail}
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInvoices;
