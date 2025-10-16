import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, X, Mail, CheckCircle, Circle, Download } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminContactsService, type AdminContact, type PageResponse } from '../../services/adminContactsService';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import { exportService } from '../../utils/exportHelpers';

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #e5e7eb',
  borderRadius: 6
};
const smallBtn: React.CSSProperties = { padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' };

// Helper functions
const formatDatetime = (value: unknown): string => {
  if (!value) return '—';
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const AdminContacts: React.FC = () => {
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Edit row
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<AdminContact>>({});
  const [saving, setSaving] = useState<boolean>(false);

  // Expanded details (view mode)
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const toggleExpanded = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Search/filter (by email/subject/text)
  const [query, setQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'processed' | 'unprocessed'>('all');

  const filtered = useMemo(() => {
    let result = contacts;

    // Apply status filter
    if (filterStatus === 'processed') {
      result = result.filter(c => c.processed);
    } else if (filterStatus === 'unprocessed') {
      result = result.filter(c => !c.processed);
    }

    // Apply search query
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(c => `${c.email ?? ''} ${c.subject ?? ''} ${c.text ?? ''}`.toLowerCase().includes(q));
    }

    return result;
  }, [contacts, query, filterStatus]);

  const loadContacts = async (pageNum: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse: PageResponse<AdminContact> = await adminContactsService.getAllContacts(pageNum, 20, 'createdAt', 'DESC');
      setContacts(pageResponse.content);
      setTotalPages(pageResponse.totalPages);
      setTotalElements(pageResponse.totalElements);
      setPage(pageResponse.number);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load contacts';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts(0);
  }, []);

  const startEdit = (c: AdminContact) => {
    setEditingId(c.id);
    setEditData({ ...c });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (id: number) => {
    if (id == null) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminContactsService.updateContact(id, {
        email: editData.email,
        subject: editData.subject,
        text: editData.text,
        processed: editData.processed
      });
      setContacts(prev => prev.map(c => (c.id === id ? updated : c)));
      setEditingId(null);
      setEditData({});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (id == null) return;
    if (!confirm('Delete this contact submission?')) return;
    setError(null);
    try {
      await adminContactsService.deleteContact(id);
      setContacts(prev => prev.filter(x => x.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      setError(msg);
    }
  };

  const handleToggleProcessed = async (id: number, currentStatus: boolean) => {
    setError(null);
    try {
      const updated = currentStatus
        ? await adminContactsService.markAsUnprocessed(id)
        : await adminContactsService.markAsProcessed(id);
      setContacts(prev => prev.map(c => (c.id === id ? updated : c)));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      setError(msg);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = contacts.length;
    const processed = contacts.filter(c => c.processed).length;
    const unprocessed = total - processed;
    return { total, processed, unprocessed };
  }, [contacts]);

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${filterStatus === 'all' ? 'active' : ''}`}
        onClick={() => setFilterStatus('all')}
        aria-label="View all contacts"
      >
        All ({stats.total})
      </button>
      <button
        className={`dashboard-tab ${filterStatus === 'unprocessed' ? 'active' : ''}`}
        onClick={() => setFilterStatus('unprocessed')}
        aria-label="View unprocessed contacts"
      >
        Unprocessed ({stats.unprocessed})
      </button>
      <button
        className={`dashboard-tab ${filterStatus === 'processed' ? 'active' : ''}`}
        onClick={() => setFilterStatus('processed')}
        aria-label="View processed contacts"
      >
        Processed ({stats.processed})
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Contact Submissions" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h2 className="admin-title">Contact Form Submissions</h2>
              <p className="admin-subtitle">Manage customer inquiries and contact form submissions.</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="admin-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>Total Submissions</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#1f2937' }}>{stats.total}</div>
            </div>
            <div className="admin-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>Unprocessed</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#f59e0b' }}>{stats.unprocessed}</div>
            </div>
            <div className="admin-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>Processed</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#10b981' }}>{stats.processed}</div>
            </div>
          </div>

          <div className="admin-header-actions">
            <input
              type="text"
              className="form-input"
              placeholder="Search by email, subject, or message..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="outline" onClick={() => loadContacts()}>
              Refresh
            </Button>
            <Button variant="outline" icon={Download} onClick={() => exportService.contacts()}>
              Export CSV
            </Button>
          </div>

          {/* Mobile Card Layout */}
          <div className="mobile-table-cards">
            {loading ? (
              <div className="mobile-table-card">
                <SkeletonTable rows={5} columns={4} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="mobile-table-card">
                <div className="table-empty">No contact submissions found.</div>
              </div>
            ) : (
              filtered.map(contact => (
                <div key={`mobile-${contact.id}`} className="mobile-table-card">
                  <div className="mobile-card-header">
                    <div>
                      <h4 className="mobile-card-title">{contact.subject}</h4>
                      <p className="mobile-card-subtitle">{contact.email}</p>
                    </div>
                    <div className="mobile-card-actions">
                      <Button variant="outline" size="sm" icon={Eye} onClick={() => toggleExpanded(contact.id)} title="View details" />
                      <Button variant="outline" size="sm" icon={Pencil} onClick={() => startEdit(contact)} title="Edit" />
                      <Button variant="danger" size="sm" icon={X} onClick={() => handleDelete(contact.id)} title="Delete" />
                    </div>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-field">
                      <span className="mobile-field-label">Status:</span>
                      <span className="mobile-field-value">
                        <Badge variant={contact.processed ? 'success' : 'warning'} size="sm">
                          {contact.processed ? 'Processed' : 'Unprocessed'}
                        </Badge>
                      </span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Date:</span>
                      <span className="mobile-field-value">{formatDatetime(contact.createdAt)}</span>
                    </div>
                    <div className="mobile-field" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span className="mobile-field-label">Message:</span>
                      <span className="mobile-field-value" style={{ marginTop: 4 }}>
                        {contact.text.length > 100 ? `${contact.text.substring(0, 100)}...` : contact.text}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 150 }}>Date</th>
                  <th style={{ width: 200 }} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      <SkeletonTable rows={5} columns={6} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">No contact submissions found.</td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const isEditing = editingId === c.id;
                    if (isEditing) {
                      return (
                        <>
                          <tr key={`edit-${c.id}`}>
                            <td style={{ padding: 8 }}>{c.id}</td>
                            <td style={{ padding: 8 }}>
                              <input value={editData.email ?? ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} style={fieldInputStyle} />
                            </td>
                            <td style={{ padding: 8 }}>
                              <input value={editData.subject ?? ''} onChange={(e) => setEditData({ ...editData, subject: e.target.value })} style={fieldInputStyle} />
                            </td>
                            <td style={{ padding: 8 }}>
                              <select value={editData.processed ? 'true' : 'false'} onChange={(e) => setEditData({ ...editData, processed: e.target.value === 'true' })} style={fieldInputStyle}>
                                <option value="false">Unprocessed</option>
                                <option value="true">Processed</option>
                              </select>
                            </td>
                            <td style={{ padding: 8 }}>{formatDatetime(c.createdAt)}</td>
                            <td style={{ padding: 8, display: 'flex', gap: 6 }}>
                              <button disabled={saving} onClick={() => saveEdit(c.id)} style={{ ...smallBtn, background: '#16a34a', color: '#fff' }}>{saving ? 'Saving…' : 'Save'}</button>
                              <button disabled={saving} onClick={cancelEdit} style={{ ...smallBtn, background: '#6b7280', color: '#fff' }}>Cancel</button>
                            </td>
                          </tr>
                          <tr key={`edit-details-${c.id}`}>
                            <td colSpan={6} style={{ padding: 8, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                              <label>Message</label>
                              <textarea rows={4} value={editData.text ?? ''} onChange={(e) => setEditData({ ...editData, text: e.target.value })} style={{ ...fieldInputStyle, resize: 'vertical' }} maxLength={5000} />
                              {c.ipAddress && <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>IP Address: {c.ipAddress}</div>}
                            </td>
                          </tr>
                        </>
                      );
                    }

                    return (
                      <>
                        <tr key={c.id}>
                          <td>{c.id}</td>
                          <td>{c.email}</td>
                          <td>{c.subject}</td>
                          <td>
                            <Badge variant={c.processed ? 'success' : 'warning'} size="sm">
                              {c.processed ? 'Processed' : 'Unprocessed'}
                            </Badge>
                          </td>
                          <td>{formatDatetime(c.createdAt)}</td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <Button variant="outline" size="sm" icon={Eye} onClick={() => toggleExpanded(c.id)} title={expandedId === c.id ? 'Hide details' : 'View details'} />
                              <Button variant="outline" size="sm" icon={c.processed ? Circle : CheckCircle} onClick={() => handleToggleProcessed(c.id, c.processed)} title={c.processed ? 'Mark as unprocessed' : 'Mark as processed'} />
                              <Button variant="outline" size="sm" icon={Pencil} onClick={() => startEdit(c)} title="Edit" />
                              <Button variant="danger" size="sm" icon={X} onClick={() => handleDelete(c.id)} title="Delete" />
                            </div>
                          </td>
                        </tr>
                        {expandedId === c.id && (
                          <tr key={`details-${c.id}`}>
                            <td colSpan={6} style={{ padding: 12, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                <div>
                                  <h4 style={{ margin: '4px 0' }}>Contact Details</h4>
                                  <div><strong>From:</strong> {c.email}</div>
                                  <div><strong>Subject:</strong> {c.subject}</div>
                                  <div><strong>Status:</strong> {c.processed ? 'Processed' : 'Unprocessed'}</div>
                                  <div><strong>Submitted:</strong> {formatDatetime(c.createdAt)}</div>
                                  {c.updatedAt && <div><strong>Updated:</strong> {formatDatetime(c.updatedAt)}</div>}
                                  {c.ipAddress && <div><strong>IP Address:</strong> {c.ipAddress}</div>}
                                </div>
                                <div>
                                  <h4 style={{ margin: '4px 0' }}>Message</h4>
                                  <div style={{ marginTop: 8, padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb', whiteSpace: 'pre-wrap' }}>
                                    {c.text}
                                  </div>
                                  <div style={{ marginTop: 12 }}>
                                    <a href={`mailto:${c.email}?subject=Re: ${c.subject}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#2563eb', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
                                      <Mail size={16} />
                                      Reply via Email
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Showing {contacts.length > 0 ? (page * 20 + 1) : 0} - {Math.min((page + 1) * 20, totalElements)} of {totalElements} submissions
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => loadContacts(page - 1)} disabled={page === 0 || loading}>
                  Previous
                </Button>
                <span style={{ padding: '8px 12px', fontSize: '14px', color: '#374151' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => loadContacts(page + 1)} disabled={page >= totalPages - 1 || loading}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContacts;
