import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, X, Star } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminReviewsService, type AdminReview, type PageResponse, type ReviewCreateRequest } from '../../services/adminReviewsService';
import { Button, Badge, SkeletonTable } from '../../components/ui';

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

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'all-reviews' | 'create-review'>('all-reviews');

  const [createData, setCreateData] = useState<Partial<ReviewCreateRequest>>({ rating: 5 });

  // Edit row
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<AdminReview>>({});
  const [saving, setSaving] = useState<boolean>(false);

  // Expanded details (view mode)
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const toggleExpanded = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Search/filter (by userName/comment/rating)
  const [query, setQuery] = useState<string>('');
  const filtered = useMemo(() => {
    if (!query.trim()) return reviews;
    const q = query.toLowerCase();
    return reviews.filter(r => `${r.userName ?? ''} ${r.comment ?? ''} ${r.rating ?? ''}`.toLowerCase().includes(q));
  }, [reviews, query]);

  const loadReviews = async (pageNum: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse: PageResponse<AdminReview> = await adminReviewsService.getAllReviews(pageNum, 20, 'createdAt', 'DESC');
      setReviews(pageResponse.content);
      setTotalPages(pageResponse.totalPages);
      setTotalElements(pageResponse.totalElements);
      setPage(pageResponse.number);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load reviews';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(0);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!createData.productId || !createData.userId || !createData.rating || !createData.comment) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      const payload: ReviewCreateRequest = {
        productId: createData.productId,
        userId: createData.userId,
        rating: createData.rating,
        title: createData.title,
        comment: createData.comment
      };
      const created = await adminReviewsService.createReview(payload);
      setReviews(prev => [created, ...prev]);
      setCreateData({ rating: 5 });
      setActiveTab('all-reviews');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Create failed';
      setError(msg);
    }
  };

  const startEdit = (r: AdminReview) => {
    setEditingId(r.id);
    setEditData({ ...r });
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
      const updated = await adminReviewsService.updateReview(id, {
        rating: editData.rating,
        title: editData.title,
        comment: editData.comment
      });
      setReviews(prev => prev.map(r => (r.id === id ? updated : r)));
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
    if (!confirm('Delete this review?')) return;
    setError(null);
    try {
      await adminReviewsService.deleteReview(id);
      setReviews(prev => prev.filter(x => x.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      setError(msg);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={14}
            fill={star <= rating ? '#fbbf24' : 'none'}
            stroke={star <= rating ? '#fbbf24' : '#d1d5db'}
          />
        ))}
      </div>
    );
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'all-reviews' ? 'active' : ''}`}
        data-tab="all-reviews"
        onClick={() => setActiveTab('all-reviews')}
        aria-label="View all reviews"
      >
        All Reviews
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'create-review' ? 'active' : ''}`}
        data-tab="create-review"
        onClick={() => setActiveTab('create-review')}
        aria-label="Create new review"
      >
        Create New Review
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Reviews" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h2 className="admin-title">Review Management</h2>
              <p className="admin-subtitle">Manage customer reviews, moderate content, and track product feedback.</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Create Review Tab */}
          {activeTab === 'create-review' && (
            <div className="admin-card">
              <h3 className="section-title">Create New Review</h3>
              <form onSubmit={handleCreate} className="form-grid">
                <div>
                  <label className="form-label">Product ID *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={createData.productId ?? ''}
                    onChange={(e) => setCreateData({ ...createData, productId: parseInt(e.target.value) })}
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">User ID *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={createData.userId ?? ''}
                    onChange={(e) => setCreateData({ ...createData, userId: parseInt(e.target.value) })}
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Rating *</label>
                  <select
                    className="form-input"
                    value={createData.rating ?? 5}
                    onChange={(e) => setCreateData({ ...createData, rating: parseInt(e.target.value) })}
                    required
                  >
                    <option value={1}>⭐ 1 - Poor</option>
                    <option value={2}>⭐⭐ 2 - Fair</option>
                    <option value={3}>⭐⭐⭐ 3 - Good</option>
                    <option value={4}>⭐⭐⭐⭐ 4 - Very Good</option>
                    <option value={5}>⭐⭐⭐⭐⭐ 5 - Excellent</option>
                  </select>
                </div>
                <div className="form-field-full">
                  <label className="form-label">Title</label>
                  <input
                    className="form-input"
                    value={createData.title ?? ''}
                    onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                    placeholder="Great product!"
                    maxLength={100}
                  />
                </div>
                <div className="form-field-full">
                  <label className="form-label">Comment *</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={createData.comment ?? ''}
                    onChange={(e) => setCreateData({ ...createData, comment: e.target.value })}
                    placeholder="Write your review..."
                    required
                    maxLength={2000}
                  />
                </div>
                <div className="form-actions">
                  <Button variant="primary" type="submit">Create Review</Button>
                  <Button variant="outline" type="button" onClick={() => setActiveTab('all-reviews')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* All Reviews Tab */}
          {activeTab === 'all-reviews' && (
            <>
              <div className="admin-header-actions">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by user name, comment, or rating..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button variant="outline" onClick={() => loadReviews()}>
                  Refresh
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
                    <div className="table-empty">No reviews found.</div>
                  </div>
                ) : (
                  filtered.map(review => (
                    <div key={`mobile-${review.id}`} className="mobile-table-card">
                      <div className="mobile-card-header">
                        <div>
                          <h4 className="mobile-card-title">{review.userName}</h4>
                          <p className="mobile-card-subtitle">Product ID: {review.productId}</p>
                        </div>
                        <div className="mobile-card-actions">
                          <Button variant="outline" size="sm" icon={Eye} onClick={() => toggleExpanded(review.id)} title="View details" />
                          <Button variant="outline" size="sm" icon={Pencil} onClick={() => startEdit(review)} title="Edit review" />
                          <Button variant="danger" size="sm" icon={X} onClick={() => handleDelete(review.id)} title="Delete review" />
                        </div>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-field">
                          <span className="mobile-field-label">Rating:</span>
                          <span className="mobile-field-value">{renderStars(review.rating)}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Date:</span>
                          <span className="mobile-field-value">{formatDatetime(review.createdAt)}</span>
                        </div>
                        {review.title && (
                          <div className="mobile-field">
                            <span className="mobile-field-label">Title:</span>
                            <span className="mobile-field-value">{review.title}</span>
                          </div>
                        )}
                        <div className="mobile-field" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span className="mobile-field-label">Comment:</span>
                          <span className="mobile-field-value" style={{ marginTop: 4 }}>
                            {review.comment.length > 100 ? `${review.comment.substring(0, 100)}...` : review.comment}
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
                      <th style={{ width: 100 }}>Product</th>
                      <th>User</th>
                      <th style={{ width: 120 }}>Rating</th>
                      <th>Title</th>
                      <th style={{ width: 150 }}>Date</th>
                      <th style={{ width: 170 }} className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="table-empty">
                          <SkeletonTable rows={5} columns={7} />
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="table-empty">No reviews found.</td>
                      </tr>
                    ) : (
                      filtered.map((r) => {
                        const isEditing = editingId === r.id;
                        if (isEditing) {
                          return (
                            <>
                              <tr key={`edit-${r.id}`}>
                                <td style={{ padding: 8 }}>{r.id}</td>
                                <td style={{ padding: 8 }}>{r.productId}</td>
                                <td style={{ padding: 8 }}>{r.userName}</td>
                                <td style={{ padding: 8 }}>
                                  <select value={editData.rating ?? 5} onChange={(e) => setEditData({ ...editData, rating: parseInt(e.target.value) })} style={fieldInputStyle}>
                                    <option value={1}>⭐ 1</option>
                                    <option value={2}>⭐⭐ 2</option>
                                    <option value={3}>⭐⭐⭐ 3</option>
                                    <option value={4}>⭐⭐⭐⭐ 4</option>
                                    <option value={5}>⭐⭐⭐⭐⭐ 5</option>
                                  </select>
                                </td>
                                <td style={{ padding: 8 }}>
                                  <input value={editData.title ?? ''} onChange={(e) => setEditData({ ...editData, title: e.target.value })} style={fieldInputStyle} maxLength={100} />
                                </td>
                                <td style={{ padding: 8 }}>{formatDatetime(r.createdAt)}</td>
                                <td style={{ padding: 8, display: 'flex', gap: 6 }}>
                                  <button disabled={saving} onClick={() => saveEdit(r.id)} style={{ ...smallBtn, background: '#16a34a', color: '#fff' }}>{saving ? 'Saving…' : 'Save'}</button>
                                  <button disabled={saving} onClick={cancelEdit} style={{ ...smallBtn, background: '#6b7280', color: '#fff' }}>Cancel</button>
                                </td>
                              </tr>
                              <tr key={`edit-details-${r.id}`}>
                                <td colSpan={7} style={{ padding: 8, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                                  <label>Comment</label>
                                  <textarea rows={3} value={editData.comment ?? ''} onChange={(e) => setEditData({ ...editData, comment: e.target.value })} style={{ ...fieldInputStyle, resize: 'vertical' }} maxLength={2000} />
                                </td>
                              </tr>
                            </>
                          );
                        }

                        return (
                          <>
                            <tr key={r.id}>
                              <td>{r.id}</td>
                              <td>{r.productId}</td>
                              <td>{r.userName}</td>
                              <td>{renderStars(r.rating)}</td>
                              <td>{r.title || '—'}</td>
                              <td>{formatDatetime(r.createdAt)}</td>
                              <td className="text-right">
                                <div className="action-buttons">
                                  <Button variant="outline" size="sm" icon={Eye} onClick={() => toggleExpanded(r.id)} title={expandedId === r.id ? 'Hide details' : 'View details'} />
                                  <Button variant="outline" size="sm" icon={Pencil} onClick={() => startEdit(r)} title="Edit review" />
                                  <Button variant="danger" size="sm" icon={X} onClick={() => handleDelete(r.id)} title="Delete review" />
                                </div>
                              </td>
                            </tr>
                            {expandedId === r.id && (
                              <tr key={`details-${r.id}`}>
                                <td colSpan={7} style={{ padding: 12, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                    <div>
                                      <h4 style={{ margin: '4px 0' }}>Review Details</h4>
                                      <div><strong>User:</strong> {r.userName}</div>
                                      <div><strong>Product ID:</strong> {r.productId}</div>
                                      <div><strong>User ID:</strong> {r.userId}</div>
                                      <div><strong>Rating:</strong> {r.rating}/5 {renderStars(r.rating)}</div>
                                      <div><strong>Created:</strong> {formatDatetime(r.createdAt)}</div>
                                      {r.updatedAt && <div><strong>Updated:</strong> {formatDatetime(r.updatedAt)}</div>}
                                    </div>
                                    <div>
                                      <h4 style={{ margin: '4px 0' }}>Review Content</h4>
                                      {r.title && <div><strong>Title:</strong> {r.title}</div>}
                                      <div><strong>Comment:</strong></div>
                                      <div style={{ marginTop: 8, padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                                        {r.comment}
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
                    Showing {reviews.length > 0 ? (page * 20 + 1) : 0} - {Math.min((page + 1) * 20, totalElements)} of {totalElements} reviews
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="outline" size="sm" onClick={() => loadReviews(page - 1)} disabled={page === 0 || loading}>
                      Previous
                    </Button>
                    <span style={{ padding: '8px 12px', fontSize: '14px', color: '#374151' }}>
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => loadReviews(page + 1)} disabled={page >= totalPages - 1 || loading}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
