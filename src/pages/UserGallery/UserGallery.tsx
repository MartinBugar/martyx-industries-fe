import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import UserCard from './UserCard';
import PhotoGrid from './PhotoGrid';
import { userGalleryService } from '../../services/userGalleryService';
import type { PublicUser, PublicPhotoWithUser, GalleryStats, GalleryFilter, GallerySort, GalleryView } from '../../types/userGallery';
import './UserGallery.css';

const UserGallery: React.FC = () => {
  const { t } = useTranslation('gallery');
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [photos, setPhotos] = useState<PublicPhotoWithUser[]>([]);
  const [stats, setStats] = useState<GalleryStats>({
    total_users: 0,
    total_public_models: 0,
    total_public_photos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode & Filters from URL params
  const [view, setView] = useState<GalleryView>(
    (searchParams.get('view') as GalleryView) || 'photos'
  );
  const [filter, setFilter] = useState<GalleryFilter>(
    (searchParams.get('filter') as GalleryFilter) || 'all'
  );
  const [sort, setSort] = useState<GallerySort>(
    (searchParams.get('sort') as GallerySort) || 'recent'
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Fetch gallery data
  const fetchGallery = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (view === 'photos') {
        // Fetch all photos (now includes stats)
        const data = await userGalleryService.getAllPublicPhotos({
          sort,
          page: currentPage,
          limit: itemsPerPage
        });

        setPhotos(data.photos);
        setStats(data.stats);
        setTotalPages(data.pagination.total_pages);
      } else {
        // Fetch users
        const data = await userGalleryService.getPublicGallery({
          filter,
          sort,
          page: currentPage,
          limit: itemsPerPage
        });

        setUsers(data.users);
        setStats(data.stats);
        setTotalPages(data.pagination.total_pages);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setError(err instanceof Error ? err.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, [view, filter, sort, currentPage]);

  // Load data on mount and when params change
  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Update URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (view !== 'photos') params.view = view;
    if (filter !== 'all' && view === 'users') params.filter = filter;
    if (sort !== 'recent') params.sort = sort;
    if (currentPage > 1) params.page = currentPage.toString();

    setSearchParams(params, { replace: true });
  }, [view, filter, sort, currentPage, setSearchParams]);

  // Handle view change
  const handleViewChange = (newView: GalleryView) => {
    setView(newView);
    setCurrentPage(1); // Reset to first page
  };

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value as GalleryFilter);
    setCurrentPage(1); // Reset to first page
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as GallerySort);
    setCurrentPage(1); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Error state
  if (error) {
    return (
      <div className="user-gallery-page">
        <div className="gallery-error">
          <div className="error-icon">⚠️</div>
          <h3>{t('errors.load_failed', 'Failed to load gallery')}</h3>
          <p>{error}</p>
          <button onClick={fetchGallery} className="retry-button">
            {t('actions.retry', 'Try again')}
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && ((view === 'users' && users.length === 0) || (view === 'photos' && photos.length === 0))) {
    return (
      <div className="user-gallery-page">
        <div className="gallery-header">
          <h1>{t('title', 'Community Gallery')}</h1>
          <p className="subtitle">{t('subtitle', 'Check out amazing models from our builders')}</p>
        </div>

        <div className="gallery-empty">
          <div className="empty-icon">🎨</div>
          <h3>{t('empty.title', 'No public galleries yet')}</h3>
          <p>{t('empty.description', 'Be the first to share your model!')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-gallery-page">
      {/* Header with stats */}
      <div className="gallery-header">
        <h1>{t('title', 'Community Gallery')}</h1>
        <p className="subtitle">{t('subtitle', 'Check out amazing models from our builders')}</p>

        <div className="gallery-stats">
          <div className="stat">
            <span className="stat-number">{stats.total_users}</span>
            <span className="stat-label">{t('stats.builders', 'Builders')}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">{stats.total_public_models}</span>
            <span className="stat-label">{t('stats.models', 'Models')}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">{stats.total_public_photos}</span>
            <span className="stat-label">{t('stats.photos', 'Photos')}</span>
          </div>
        </div>
      </div>

      {/* View Tabs & Filters */}
      <div className="gallery-controls">
        <div className="view-tabs">
          <button
            className={`view-tab ${view === 'photos' ? 'active' : ''}`}
            onClick={() => handleViewChange('photos')}
          >
            {t('view.all_photos', 'All Photos')}
          </button>
          <button
            className={`view-tab ${view === 'users' ? 'active' : ''}`}
            onClick={() => handleViewChange('users')}
          >
            {t('view.users', 'Builders')}
          </button>
        </div>

        {view === 'users' && (
          <div className="filter-group">
            <label htmlFor="gallery-filter">{t('filter.label', 'Filter')}</label>
            <select
              id="gallery-filter"
              value={filter}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">{t('filter.all', 'All models')}</option>
              <option value="completed">{t('filter.completed', 'Completed only')}</option>
            </select>
          </div>
        )}

        <div className="sort-group">
          <label htmlFor="gallery-sort">{t('sort.label', 'Sort by')}</label>
          <select
            id="gallery-sort"
            value={sort}
            onChange={handleSortChange}
            className="sort-select"
          >
            {view === 'users' ? (
              <>
                <option value="recent">{t('sort.recent', 'Recent photos')}</option>
                <option value="most_photos">{t('sort.most_photos', 'Most photos')}</option>
                <option value="alphabetic">{t('sort.alphabetic', 'Alphabetical')}</option>
                <option value="most_liked">{t('sort.most_liked', 'Most liked')}</option>
              </>
            ) : (
              <>
                <option value="recent">{t('sort.recent', 'Newest first')}</option>
                <option value="most_liked">{t('sort.most_liked', 'Most liked')}</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {view === 'users' ? (
        <div className="users-grid">
          {users.map(user => (
            <UserCard key={user.user_id} user={user} />
          ))}
        </div>
      ) : (
        <PhotoGrid photos={photos} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            {t('pagination.previous', 'Previous')}
          </button>

          <div className="pagination-pages">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t('pagination.next', 'Next')}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserGallery;
