import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Search, Users, Image, AlertCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminGallery.css';
import { adminGalleryService, type AdminUserSummary } from '../../services/adminGalleryService';
import { Button, Badge, SkeletonTable } from '../../components/ui';

const AdminGallery: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users');

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'most_photos' | 'alphabetic'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'has_public' | 'has_private'>('all');

  // Data state
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch users with photos
  const loadGalleryData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminGalleryService.getUsersWithPhotos({
        page,
        limit,
        sort: sortBy,
        filter: filterBy,
        search: searchQuery || undefined
      });

      setUsers(response.data?.users || []);
      setPagination(response.data?.pagination);
      setStats(response.data?.stats);
    } catch (e: unknown) {
      setError(e instanceof Error ? e : new Error('Failed to load gallery data'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when filters change
  useEffect(() => {
    loadGalleryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, filterBy, searchQuery]);

  // Format date helper
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) {
      if (hours === 0) return 'Just now';
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Navigation tabs
  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'users' ? 'active' : ''}`}
        onClick={() => setActiveTab('users')}
        aria-label="View users with photos"
      >
        All Users
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'stats' ? 'active' : ''}`}
        onClick={() => setActiveTab('stats')}
        aria-label="View gallery statistics"
      >
        Statistics
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Gallery Management" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={16} />
              {error instanceof Error ? error.message : 'Failed to load gallery data'}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && stats && (
            <div className="gallery-stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#3b82f6' }}>
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Users</div>
                  <div className="stat-value">{stats.totalUsers || 0}</div>
                  <div className="stat-change">Users who uploaded photos</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
                  <Image size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Photos</div>
                  <div className="stat-value">{stats.totalPhotos || 0}</div>
                  <div className="stat-change">All uploaded photos</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#f59e0b' }}>
                  <AlertCircle size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Pending Review</div>
                  <div className="stat-value">{stats.pendingPhotos || 0}</div>
                  <div className="stat-change">Awaiting moderation</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#ef4444' }}>
                  <AlertCircle size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Rejected</div>
                  <div className="stat-value">{stats.rejectedPhotos || 0}</div>
                  <div className="stat-change">Rejected photos</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#8b5cf6' }}>
                  <Image size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Approved</div>
                  <div className="stat-value">{stats.approvedPhotos || 0}</div>
                  <div className="stat-change">Approved photos</div>
                </div>
              </div>
            </div>
          )}

          {/* All Users Tab */}
          {activeTab === 'users' && (
            <>
              {/* Filters and Search */}
              <div className="gallery-filters">
                <div className="filter-group">
                  <label className="filter-label">Search Users:</label>
                  <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search by email or name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1); // Reset to first page on search
                      }}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Sort By:</label>
                  <select
                    className="form-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  >
                    <option value="recent">Recent Uploads</option>
                    <option value="most_photos">Most Photos</option>
                    <option value="alphabetic">Alphabetical</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Filter:</label>
                  <select
                    className="form-select"
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
                  >
                    <option value="all">All Users</option>
                    <option value="has_public">Has Public Photos</option>
                    <option value="has_private">Has Private Photos</option>
                  </select>
                </div>
              </div>

              {/* Mobile Card Layout */}
              <div className="mobile-table-cards">
                {isLoading ? (
                  <div className="mobile-table-card">
                    <SkeletonTable rows={5} columns={4} />
                  </div>
                ) : users.length === 0 ? (
                  <div className="mobile-table-card">
                    <div className="table-empty">
                      <Image size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p>No users with photos found.</p>
                    </div>
                  </div>
                ) : (
                  users.map((user: AdminUserSummary) => (
                    <div key={`mobile-${user.userId}`} className="mobile-table-card">
                      <div className="mobile-card-header">
                        <div>
                          <h4 className="mobile-card-title">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email}
                          </h4>
                          <p className="mobile-card-subtitle">{user.email}</p>
                        </div>
                        <div className="mobile-card-actions">
                          <Link to={`/admin/gallery/users/${user.userId}`} className="btn btn-primary btn-sm" title="View user gallery">
                            <Eye size={16} />
                          </Link>
                        </div>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-field">
                          <span className="mobile-field-label">Total Photos:</span>
                          <span className="mobile-field-value">
                            <Badge variant="info" size="sm">{user.totalPhotos}</Badge>
                          </span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Public:</span>
                          <span className="mobile-field-value">
                            <Badge variant="success" size="sm">{user.publicPhotos}</Badge>
                          </span>
                        </div>
                        {user.pendingPhotos > 0 && (
                          <div className="mobile-field">
                            <span className="mobile-field-label">Pending:</span>
                            <span className="mobile-field-value">
                              <Badge variant="warning" size="sm">{user.pendingPhotos}</Badge>
                            </span>
                          </div>
                        )}
                        <div className="mobile-field">
                          <span className="mobile-field-label">Last Upload:</span>
                          <span className="mobile-field-value">{formatDate(user.lastUploadDate)}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Status:</span>
                          <span className="mobile-field-value">
                            <Badge variant={user.isActive ? 'success' : 'danger'} size="sm">
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table */}
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 70 }}>ID</th>
                      <th>User</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Total</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Public</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Pending</th>
                      <th style={{ width: 140 }}>Last Upload</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Status</th>
                      <th style={{ width: 120, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="table-empty">
                          <SkeletonTable rows={10} columns={8} />
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="table-empty">
                          <Image size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                          <p>No users with photos found.</p>
                        </td>
                      </tr>
                    ) : (
                      users.map((user: AdminUserSummary) => (
                        <tr key={user.userId}>
                          <td>{user.userId}</td>
                          <td>
                            <div>
                              <div style={{ fontWeight: 500 }}>
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : 'N/A'}
                              </div>
                              <div style={{ fontSize: '13px', color: '#6b7280' }}>{user.email}</div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Badge variant="info" size="sm">{user.totalPhotos}</Badge>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Badge variant="success" size="sm">{user.publicPhotos}</Badge>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {user.pendingPhotos > 0 ? (
                              <Badge variant="warning" size="sm">{user.pendingPhotos}</Badge>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>—</span>
                            )}
                          </td>
                          <td>{formatDate(user.lastUploadDate)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <Badge variant={user.isActive ? 'success' : 'danger'} size="sm">
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="action-buttons">
                              <Link
                                to={`/admin/gallery/users/${user.userId}`}
                                className="btn btn-primary btn-sm"
                                title="View user gallery"
                              >
                                <Eye size={16} /> View Gallery
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {users.length > 0 ? ((pagination.currentPage - 1) * limit + 1) : 0} - {Math.min(pagination.currentPage * limit, pagination.totalItems)} of {pagination.totalItems} users
                  </div>
                  <div className="pagination-buttons">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrev || isLoading}
                    >
                      Previous
                    </Button>
                    <span className="pagination-page">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNext || isLoading}
                    >
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

export default AdminGallery;
