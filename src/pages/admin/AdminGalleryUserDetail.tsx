import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Lock, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminGallery.css';
import {
  adminGalleryService,
  type AdminPhotoInfo,
} from '../../services/adminGalleryService';
import { Button, Badge } from '../../components/ui';
import GalleryPhotoCard from '../../components/admin/GalleryPhotoCard';
import BulkActionsBar from '../../components/admin/BulkActionsBar';

const AdminGalleryUserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // State
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [lightboxPhoto, setLightboxPhoto] = useState<AdminPhotoInfo | null>(null);
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'product_name'>('recent');

  // Data state
  const [userInfo, setUserInfo] = useState<any>(null);
  const [photos, setPhotos] = useState<AdminPhotoInfo[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [modelStatuses, setModelStatuses] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Loading states for mutations
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [isUpdatingModelStatus, setIsUpdatingModelStatus] = useState<boolean>(false);

  // Fetch user photos
  const loadUserPhotos = async () => {
    if (!userId) {
      setError(new Error('User ID is required'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await adminGalleryService.getUserPhotos(parseInt(userId), {
        page: 1,
        limit: 500, // Load all photos
        filter: filterBy,
        sort: sortBy,
      });

      setUserInfo(response.user);
      setPhotos(response.photos || []);
      setStats(response.stats);
      setModelStatuses(response.modelStatuses || {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e : new Error('Failed to load user photos'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when filters change
  useEffect(() => {
    loadUserPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filterBy, sortBy]);

  // Group photos by model
  const photosByModel = useMemo(() => {
    const grouped = new Map<string, AdminPhotoInfo[]>();
    photos.forEach(photo => {
      const existing = grouped.get(photo.productId) || [];
      grouped.set(photo.productId, [...existing, photo]);
    });
    return grouped;
  }, [photos]);

  // Delete photo handler
  const deletePhoto = async (photoId: number) => {
    setIsDeleting(true);
    try {
      await adminGalleryService.deletePhoto(photoId, {
        reason: 'Removed by admin',
        notifyUser: true,
      });
      setSelectedPhotos(new Set());
      await loadUserPhotos(); // Reload data
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete photo');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete handler
  const bulkDelete = async (photoIds: number[]) => {
    setIsBulkDeleting(true);
    try {
      await adminGalleryService.bulkAction({
        action: 'delete',
        photoIds,
        reason: 'Bulk removal by admin',
        notifyUsers: true,
      });
      setSelectedPhotos(new Set());
      await loadUserPhotos(); // Reload data
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete photos');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Update model status handler
  const updateModelStatus = async ({
    productId,
    isPublic,
    isCompleted,
  }: {
    productId: string;
    isPublic?: boolean;
    isCompleted?: boolean;
  }) => {
    if (!userId) return;
    setIsUpdatingModelStatus(true);
    try {
      await adminGalleryService.updateModelStatus(parseInt(userId), productId, {
        isPublic,
        isCompleted,
        notifyUser: true,
      });
      await loadUserPhotos(); // Reload data
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update model status');
    } finally {
      setIsUpdatingModelStatus(false);
    }
  };

  // Handlers
  const handleSelectPhoto = (photoId: number) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map((p: any) => p.id)));
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      await deletePhoto(photoId);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedPhotos.size} selected photos?`)) {
      await bulkDelete(Array.from(selectedPhotos));
    }
  };

  const handleBulkMakePublic = async () => {
    // This would need backend support for bulk make public/private
    // For now, show message
    alert('Bulk visibility change feature coming soon!');
  };

  const handleToggleModelVisibility = async (productId: string, currentStatus: boolean) => {
    await updateModelStatus({
      productId,
      isPublic: !currentStatus,
    });
  };

  const handleToggleModelCompletion = async (productId: string, currentStatus: boolean) => {
    await updateModelStatus({
      productId,
      isCompleted: !currentStatus,
    });
  };

  // Format date
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (error) {
    return (
      <AdminLayout title="User Gallery">
        <div className="admin-page">
          <div className="admin-container">
            <div className="alert alert-error">
              {error instanceof Error ? error.message : 'Failed to load user gallery'}
            </div>
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/admin/gallery')}>
              Back to Gallery
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Gallery - ${userInfo?.email || 'User'}`}>
      <div className="admin-page">
        <div className="admin-container">
          {/* Header with Back Button */}
          <div className="admin-header" style={{ marginBottom: '24px' }}>
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/admin/gallery')}>
              Back to Users
            </Button>
          </div>

          {/* User Info Card */}
          {userInfo && (
            <div className="admin-card" style={{ marginBottom: '24px' }}>
              <h3 className="section-title">User Information</h3>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div>
                  <div className="form-label">Name</div>
                  <div style={{ fontWeight: 500 }}>
                    {userInfo.firstName && userInfo.lastName
                      ? `${userInfo.firstName} ${userInfo.lastName}`
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Email</div>
                  <div style={{ fontWeight: 500 }}>{userInfo.email}</div>
                </div>
                <div>
                  <div className="form-label">User ID</div>
                  <div style={{ fontWeight: 500 }}>{userInfo.userId}</div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="gallery-stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#3b82f6' }}>
                  <ImageIcon size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Photos</div>
                  <div className="stat-value">{stats.totalPhotos}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
                  <Globe size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Public Photos</div>
                  <div className="stat-value">{stats.publicPhotos}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#6b7280' }}>
                  <Lock size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Private Photos</div>
                  <div className="stat-value">{stats.privatePhotos}</div>
                </div>
              </div>
              {stats.pendingPhotos > 0 && (
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#f59e0b' }}>
                    <ImageIcon size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Pending Review</div>
                    <div className="stat-value">{stats.pendingPhotos}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="gallery-filters" style={{ marginBottom: '24px' }}>
            <div className="filter-group">
              <label className="filter-label">
                <input
                  type="checkbox"
                  checked={selectedPhotos.size === photos.length && photos.length > 0}
                  onChange={handleSelectAll}
                  style={{ marginRight: '8px' }}
                />
                Select All ({selectedPhotos.size} selected)
              </label>
            </div>

            <div className="filter-group">
              <label className="filter-label">Filter:</label>
              <select className="form-select" value={filterBy} onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}>
                <option value="all">All Photos</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Sort By:</label>
              <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <option value="recent">Recent First</option>
                <option value="oldest">Oldest First</option>
                <option value="product_name">By Product Name</option>
              </select>
            </div>
          </div>

          {/* Photos Grouped by Model */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div>Loading photos...</div>
            </div>
          ) : photosByModel.size === 0 ? (
            <div className="table-empty">
              <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No photos found for this user.</p>
            </div>
          ) : (
            Array.from(photosByModel.entries()).map(([productId, modelPhotos]) => {
              const modelStatus = modelStatuses[productId];
              const isPublic = modelStatus?.isPublic || false;
              const isCompleted = modelStatus?.isCompleted || false;

              return (
                <div key={productId} className="gallery-model-section">
                  <div className="gallery-model-header">
                    <div>
                      <h3 className="gallery-model-title">{modelPhotos[0].productName}</h3>
                      <div className="gallery-model-meta">
                        <span>{modelPhotos.length} photos</span>
                        <Badge variant={isPublic ? 'success' : 'default'} size="sm">
                          {isPublic ? <><Globe size={12} /> Public</> : <><Lock size={12} /> Private</>}
                        </Badge>
                        <Badge variant={isCompleted ? 'info' : 'default'} size="sm">
                          {isCompleted ? <><CheckCircle size={12} /> Completed</> : 'In Progress'}
                        </Badge>
                      </div>
                    </div>
                    <div className="gallery-model-actions">
                      <Button
                        variant={isPublic ? 'outline' : 'primary'}
                        size="sm"
                        icon={isPublic ? Lock : Globe}
                        onClick={() => handleToggleModelVisibility(productId, isPublic)}
                        disabled={isUpdatingModelStatus}
                      >
                        {isPublic ? 'Make Private' : 'Make Public'}
                      </Button>
                      <Button
                        variant={isCompleted ? 'outline' : 'primary'}
                        size="sm"
                        icon={isCompleted ? XCircle : CheckCircle}
                        onClick={() => handleToggleModelCompletion(productId, isCompleted)}
                        disabled={isUpdatingModelStatus}
                      >
                        {isCompleted ? 'Mark In Progress' : 'Mark Completed'}
                      </Button>
                    </div>
                  </div>

                  <div className="gallery-photo-grid">
                    {modelPhotos.map(photo => (
                      <GalleryPhotoCard
                        key={photo.id}
                        photo={photo}
                        isSelected={selectedPhotos.has(photo.id)}
                        onSelect={() => handleSelectPhoto(photo.id)}
                        onDelete={() => handleDeletePhoto(photo.id)}
                        onView={() => setLightboxPhoto(photo)}
                        isDeleting={isDeleting}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Bulk Actions Bar */}
          {selectedPhotos.size > 0 && (
            <BulkActionsBar
              selectedCount={selectedPhotos.size}
              onDelete={handleBulkDelete}
              onMakePublic={handleBulkMakePublic}
              onCancel={() => setSelectedPhotos(new Set())}
              isLoading={isBulkDeleting}
            />
          )}

          {/* Lightbox */}
          {lightboxPhoto && (
            <div
              className="lightbox-overlay"
              onClick={() => setLightboxPhoto(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
              }}
            >
              <button
                onClick={() => setLightboxPhoto(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
              <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%' }}>
                <img
                  src={lightboxPhoto.cdnUrl}
                  alt={lightboxPhoto.originalFilename}
                  style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                />
                <div style={{ color: 'white', marginTop: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>{lightboxPhoto.originalFilename}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    {formatFileSize(lightboxPhoto.fileSize)} • Uploaded {formatDate(lightboxPhoto.uploadDate)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminGalleryUserDetail;
