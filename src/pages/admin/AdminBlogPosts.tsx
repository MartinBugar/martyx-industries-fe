/**
 * Admin Blog Posts Page
 * Správa blogových článkov
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  getAllPosts,
  filterPosts,
  searchPosts,
  deletePost,
  publishPost,
  unpublishPost,
  archivePost,
  getAllCategories,
  getStats,
  type BlogPostDto,
  type BlogCategoryDto,
  type BlogStatsDto,
  type PostStatus,
  formatDate,
  getStatusColor,
  getStatusBgColor
} from '../../services/adminBlogService';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag,
  Clock,
  ChevronLeft,
  ChevronRight,
  Archive,
  Send,
  X,
  Filter
} from 'lucide-react';
import './AdminBlogPosts.css';

const AdminBlogPosts: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPostDto[]>([]);
  const [categories, setCategories] = useState<BlogCategoryDto[]>([]);
  const [stats, setStats] = useState<BlogStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // UI state
  const [activeTab, setActiveTab] = useState<'all' | PostStatus>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;

      if (searchQuery) {
        response = await searchPosts(searchQuery, page, pageSize);
      } else if (activeTab !== 'all' || categoryFilter) {
        const status = activeTab !== 'all' ? activeTab : (statusFilter || undefined);
        response = await filterPosts(
          status,
          categoryFilter ? parseInt(categoryFilter) : undefined,
          undefined,
          page,
          pageSize
        );
      } else {
        response = await getAllPosts(page, pageSize);
      }

      setPosts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Failed to load posts:', err);
      setError('Nepodarilo sa načítať články');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, activeTab, statusFilter, categoryFilter]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    loadCategories();
    loadStats();
  }, [loadCategories, loadStats]);

  const handleRefresh = () => {
    loadPosts();
    loadStats();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadPosts();
  };

  const handleTabChange = (tab: 'all' | PostStatus) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleDelete = async (id: number) => {
    setActionLoading(id);
    try {
      await deletePost(id);
      setDeleteConfirm(null);
      loadPosts();
      loadStats();
    } catch (err) {
      console.error('Failed to delete post:', err);
      setError('Nepodarilo sa vymazať článok');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (id: number) => {
    setActionLoading(id);
    try {
      await publishPost(id);
      loadPosts();
      loadStats();
    } catch (err) {
      console.error('Failed to publish post:', err);
      setError('Nepodarilo sa publikovať článok');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (id: number) => {
    setActionLoading(id);
    try {
      await unpublishPost(id);
      loadPosts();
      loadStats();
    } catch (err) {
      console.error('Failed to unpublish post:', err);
      setError('Nepodarilo sa zrušiť publikovanie');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (id: number) => {
    setActionLoading(id);
    try {
      await archivePost(id);
      loadPosts();
      loadStats();
    } catch (err) {
      console.error('Failed to archive post:', err);
      setError('Nepodarilo sa archivovať článok');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout title="Blog - Články">
      <div className="admin-blog-posts">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>
              <FileText size={24} />
              Blogové články
            </h1>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              Obnoviť
            </button>
            <button className="btn-primary" onClick={() => navigate('/admin/blog/posts/new')}>
              <Plus size={16} />
              Nový článok
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{stats.totalPosts}</div>
              <div className="stat-label">Celkom článkov</div>
            </div>
            <div className="stat-card published">
              <div className="stat-value">{stats.publishedPosts}</div>
              <div className="stat-label">Publikovaných</div>
            </div>
            <div className="stat-card draft">
              <div className="stat-value">{stats.draftPosts}</div>
              <div className="stat-label">Konceptov</div>
            </div>
            <div className="stat-card scheduled">
              <div className="stat-value">{stats.scheduledPosts}</div>
              <div className="stat-label">Naplánovaných</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            Všetky
          </button>
          <button
            className={`tab ${activeTab === 'PUBLISHED' ? 'active' : ''}`}
            onClick={() => handleTabChange('PUBLISHED')}
          >
            Publikované
          </button>
          <button
            className={`tab ${activeTab === 'DRAFT' ? 'active' : ''}`}
            onClick={() => handleTabChange('DRAFT')}
          >
            Koncepty
          </button>
          <button
            className={`tab ${activeTab === 'SCHEDULED' ? 'active' : ''}`}
            onClick={() => handleTabChange('SCHEDULED')}
          >
            Naplánované
          </button>
          <button
            className={`tab ${activeTab === 'ARCHIVED' ? 'active' : ''}`}
            onClick={() => handleTabChange('ARCHIVED')}
          >
            Archivované
          </button>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Hľadať články..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(0);
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="btn-search">
              Hľadať
            </button>
          </form>

          <div className="filter-group">
            <Filter size={16} />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Všetky kategórie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.postCount})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-state">
            <RefreshCw size={32} className="spinning" />
            <span>Načítavam články...</span>
          </div>
        )}

        {/* Posts List */}
        {!loading && (
          <>
            {posts.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <p>Žiadne články</p>
                <button className="btn-primary" onClick={() => navigate('/admin/blog/posts/new')}>
                  <Plus size={16} />
                  Vytvoriť prvý článok
                </button>
              </div>
            ) : (
              <div className="posts-table-wrapper">
                <table className="posts-table">
                  <thead>
                    <tr>
                      <th>Článok</th>
                      <th>Stav</th>
                      <th>Kategória</th>
                      <th>Autor</th>
                      <th>Dátum</th>
                      <th>Zobrazenia</th>
                      <th>Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id}>
                        <td className="post-title-cell">
                          <div className="post-info">
                            {post.featuredImage && (
                              <img
                                src={post.featuredImage}
                                alt={post.featuredImageAlt || post.title}
                                className="post-thumbnail"
                              />
                            )}
                            <div className="post-details">
                              <span className="post-title">{post.title}</span>
                              <span className="post-slug">/{post.slug}</span>
                              {post.featured && <span className="featured-badge">Odporúčaný</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              color: getStatusColor(post.status),
                              backgroundColor: getStatusBgColor(post.status)
                            }}
                          >
                            {post.statusLabel}
                          </span>
                        </td>
                        <td>{post.categoryName || '-'}</td>
                        <td>
                          <div className="author-cell">
                            <User size={14} />
                            {post.authorName || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="date-cell">
                            {post.status === 'PUBLISHED' ? (
                              <>
                                <Calendar size={14} />
                                {formatDate(post.publishedAt)}
                              </>
                            ) : post.status === 'SCHEDULED' ? (
                              <>
                                <Clock size={14} />
                                {formatDate(post.scheduledAt)}
                              </>
                            ) : (
                              <>
                                <Calendar size={14} />
                                {formatDate(post.updatedAt)}
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="views-cell">
                            <Eye size={14} />
                            {post.viewCount}
                          </div>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="btn-icon"
                              title="Upraviť"
                              onClick={() => navigate(`/admin/blog/posts/${post.id}`)}
                            >
                              <Edit size={16} />
                            </button>

                            {post.status === 'DRAFT' && (
                              <button
                                className="btn-icon publish"
                                title="Publikovať"
                                onClick={() => handlePublish(post.id)}
                                disabled={actionLoading === post.id}
                              >
                                <Send size={16} />
                              </button>
                            )}

                            {post.status === 'PUBLISHED' && (
                              <button
                                className="btn-icon unpublish"
                                title="Zrušiť publikovanie"
                                onClick={() => handleUnpublish(post.id)}
                                disabled={actionLoading === post.id}
                              >
                                <X size={16} />
                              </button>
                            )}

                            {post.status !== 'ARCHIVED' && (
                              <button
                                className="btn-icon archive"
                                title="Archivovať"
                                onClick={() => handleArchive(post.id)}
                                disabled={actionLoading === post.id}
                              >
                                <Archive size={16} />
                              </button>
                            )}

                            <button
                              className="btn-icon delete"
                              title="Vymazať"
                              onClick={() => setDeleteConfirm(post.id)}
                              disabled={actionLoading === post.id}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-page"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="page-info">
                  Strana {page + 1} z {totalPages} ({totalElements} článkov)
                </span>
                <button
                  className="btn-page"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Potvrdiť vymazanie</h3>
              <p>Naozaj chcete vymazať tento článok? Táto akcia je nevratná.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Zrušiť
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={actionLoading === deleteConfirm}
                >
                  {actionLoading === deleteConfirm ? 'Mazanie...' : 'Vymazať'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBlogPosts;
