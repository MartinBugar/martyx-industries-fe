import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Lock, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminGallery.css';
import './AdminGalleryUserDetail.css';
import {
  adminGalleryService,
  type AdminPhotoInfo,
} from '../../services/adminGalleryService';
import { Button, Badge } from '../../components/ui';
import GalleryPhotoCard from '../../components/admin/GalleryPhotoCard';
import BulkActionsBar from '../../components/admin/BulkActionsBar';
import toast from 'react-hot-toast';

const AdminGalleryUserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // State
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [lightboxPhoto, setLightboxPhoto] = useState<AdminPhotoInfo | null>(null);
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'product_name'>('recent');

  // Data state
  const [userInfo, setUserInfo] = useState<{ userId: number; email: string; firstName: string; lastName: string } | null>(null);
  const [photos, setPhotos] = useState<AdminPhotoInfo[]>([]);
  const [stats, setStats] = useState<{ totalPhotos: number; publicPhotos: number; privatePhotos: number; pendingPhotos: number } | null>(null);
  const [modelStatuses, setModelStatuses] = useState<Record<string, { isPublic: boolean; isCompleted: boolean }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Loading states for mutations
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [isUpdatingModelStatus, setIsUpdatingModelStatus] = useState<boolean>(false);

  // Notification preferences
  const [notifyOnDelete, setNotifyOnDelete] = useState<boolean>(true);
  const [notifyOnBulkDelete, setNotifyOnBulkDelete] = useState<boolean>(true);
  const [notifyOnStatusChange, setNotifyOnStatusChange] = useState<boolean>(true);

  // Confirmation dialog state
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ photoId: number; show: boolean } | null>(null);
  const [bulkDeleteConfirmDialog, setBulkDeleteConfirmDialog] = useState<boolean>(false);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    productId: string;
    action: 'visibility' | 'completion';
    currentStatus: boolean;
    show: boolean;
  } | null>(null);

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
        notifyUser: notifyOnDelete,
      });
      setSelectedPhotos(new Set());
      setDeleteConfirmDialog(null);
      await loadUserPhotos(); // Reload data
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete photo');
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
        notifyUsers: notifyOnBulkDelete,
      });
      setSelectedPhotos(new Set());
      setBulkDeleteConfirmDialog(false);
      await loadUserPhotos(); // Reload data
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete photos');
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
        notifyUser: notifyOnStatusChange,
      });
      setStatusChangeDialog(null);
      await loadUserPhotos(); // Reload data
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update model status');
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
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    setDeleteConfirmDialog({ photoId, show: true });
  };

  const handleBulkDelete = async () => {
    setBulkDeleteConfirmDialog(true);
  };

  const handleBulkMakePublic = async () => {
    // This would need backend support for bulk make public/private
    // For now, show message
    toast.error('Bulk visibility change feature coming soon!');
  };

  const handleToggleModelVisibility = async (productId: string, currentStatus: boolean) => {
    setStatusChangeDialog({
      productId,
      action: 'visibility',
      currentStatus,
      show: true,
    });
  };

  const handleToggleModelCompletion = async (productId: string, currentStatus: boolean) => {
    setStatusChangeDialog({
      productId,
      action: 'completion',
      currentStatus,
      show: true,
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
            <Button variant="outline" onClick={() => navigate('/admin/gallery')}>
              <ArrowLeft size={14} className="admin-gallery-user-icon-mr" />
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
          <div className="admin-header admin-gallery-user-header">
            <Button variant="outline" onClick={() => navigate('/admin/gallery')}>
              <ArrowLeft size={14} className="admin-gallery-user-icon-mr" />
              Back to Users
            </Button>
          </div>

          {/* User Info Card */}
          {userInfo && (
            <div className="admin-card admin-gallery-user-info-card">
              <h3 className="section-title">User Information</h3>
              <div className="form-grid admin-gallery-user-info-grid">
                <div>
                  <div className="form-label">Name</div>
                  <div className="admin-gallery-user-info-value">
                    {userInfo.firstName && userInfo.lastName
                      ? `${userInfo.firstName} ${userInfo.lastName}`
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Email</div>
                  <div className="admin-gallery-user-info-value">{userInfo.email}</div>
                </div>
                <div>
                  <div className="form-label">User ID</div>
                  <div className="admin-gallery-user-info-value">{userInfo.userId}</div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="gallery-stats-grid admin-gallery-user-stats-grid">
              <div className="stat-card">
                <div className="stat-icon admin-gallery-user-stat-icon-total">
                  <ImageIcon size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Photos</div>
                  <div className="stat-value">{stats.totalPhotos}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon admin-gallery-user-stat-icon-public">
                  <Globe size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Public Photos</div>
                  <div className="stat-value">{stats.publicPhotos}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon admin-gallery-user-stat-icon-private">
                  <Lock size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Private Photos</div>
                  <div className="stat-value">{stats.privatePhotos}</div>
                </div>
              </div>
              {stats.pendingPhotos > 0 && (
                <div className="stat-card">
                  <div className="stat-icon admin-gallery-user-stat-icon-pending">
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
          <div className="gallery-filters admin-gallery-user-filters">
            <div className="filter-group">
              <label className="filter-label">
                <input
                  type="checkbox"
                  checked={selectedPhotos.size === photos.length && photos.length > 0}
                  onChange={handleSelectAll}
                  className="admin-gallery-user-checkbox-mr"
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
            <div className="admin-gallery-user-loading">
              <div>Loading photos...</div>
            </div>
          ) : photosByModel.size === 0 ? (
            <div className="table-empty">
              <ImageIcon size={48} className="admin-gallery-user-empty-icon" />
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
                        onClick={() => handleToggleModelVisibility(productId, isPublic)}
                        disabled={isUpdatingModelStatus}
                      >
                        {isPublic ? <Lock size={14} className="admin-gallery-user-icon-mr" /> : <Globe size={14} className="admin-gallery-user-icon-mr" />}
                        {isPublic ? 'Make Private' : 'Make Public'}
                      </Button>
                      <Button
                        variant={isCompleted ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleModelCompletion(productId, isCompleted)}
                        disabled={isUpdatingModelStatus}
                      >
                        {isCompleted ? <XCircle size={14} className="admin-gallery-user-icon-mr" /> : <CheckCircle size={14} className="admin-gallery-user-icon-mr" />}
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
              className="lightbox-overlay admin-gallery-user-lightbox-overlay"
              onClick={() => setLightboxPhoto(null)}
            >
              <button
                onClick={() => setLightboxPhoto(null)}
                className="admin-gallery-user-lightbox-close"
              >
                ×
              </button>
              <div onClick={(e) => e.stopPropagation()} className="admin-gallery-user-lightbox-content">
                <img
                  src={lightboxPhoto.cdnUrl}
                  alt={lightboxPhoto.originalFilename}
                  className="admin-gallery-user-lightbox-img"
                />
                <div className="admin-gallery-user-lightbox-info">
                  <div className="admin-gallery-user-lightbox-filename">{lightboxPhoto.originalFilename}</div>
                  <div className="admin-gallery-user-lightbox-meta">
                    {formatFileSize(lightboxPhoto.fileSize)} • Uploaded {formatDate(lightboxPhoto.uploadDate)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Photo Confirmation Dialog */}
          {deleteConfirmDialog?.show && (
            <div
              className="lightbox-overlay admin-gallery-user-dialog-overlay"
              onClick={() => setDeleteConfirmDialog(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="admin-gallery-user-dialog-box"
              >
                <h3 className="admin-gallery-user-dialog-title">Delete Photo</h3>
                <p className="admin-gallery-user-dialog-text">
                  Are you sure you want to delete this photo?
                </p>
                <label className="admin-gallery-user-dialog-checkbox-label">
                  <input
                    type="checkbox"
                    checked={notifyOnDelete}
                    onChange={(e) => setNotifyOnDelete(e.target.checked)}
                    className="admin-gallery-user-dialog-checkbox"
                  />
                  <span className="admin-gallery-user-dialog-checkbox-text">Notify user via email</span>
                </label>
                <div className="admin-gallery-user-dialog-actions">
                  <Button variant="outline" onClick={() => setDeleteConfirmDialog(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => deletePhoto(deleteConfirmDialog.photoId)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Delete Confirmation Dialog */}
          {bulkDeleteConfirmDialog && (
            <div
              className="lightbox-overlay admin-gallery-user-dialog-overlay"
              onClick={() => setBulkDeleteConfirmDialog(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="admin-gallery-user-dialog-box"
              >
                <h3 className="admin-gallery-user-dialog-title">Delete Multiple Photos</h3>
                <p className="admin-gallery-user-dialog-text">
                  Are you sure you want to delete {selectedPhotos.size} selected photos?
                </p>
                <label className="admin-gallery-user-dialog-checkbox-label">
                  <input
                    type="checkbox"
                    checked={notifyOnBulkDelete}
                    onChange={(e) => setNotifyOnBulkDelete(e.target.checked)}
                    className="admin-gallery-user-dialog-checkbox"
                  />
                  <span className="admin-gallery-user-dialog-checkbox-text">Notify user via email</span>
                </label>
                <div className="admin-gallery-user-dialog-actions">
                  <Button variant="outline" onClick={() => setBulkDeleteConfirmDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => bulkDelete(Array.from(selectedPhotos))}
                    disabled={isBulkDeleting}
                  >
                    {isBulkDeleting ? 'Deleting...' : 'Delete All'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Model Status Change Confirmation Dialog */}
          {statusChangeDialog?.show && (
            <div
              className="lightbox-overlay admin-gallery-user-dialog-overlay"
              onClick={() => setStatusChangeDialog(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="admin-gallery-user-dialog-box"
              >
                <h3 className="admin-gallery-user-dialog-title">
                  {statusChangeDialog.action === 'visibility' ? 'Change Model Visibility' : 'Change Model Status'}
                </h3>
                <p className="admin-gallery-user-dialog-text">
                  {statusChangeDialog.action === 'visibility'
                    ? `Make this model ${statusChangeDialog.currentStatus ? 'private' : 'public'}?`
                    : `Mark this model as ${statusChangeDialog.currentStatus ? 'in progress' : 'completed'}?`}
                </p>
                <label className="admin-gallery-user-dialog-checkbox-label">
                  <input
                    type="checkbox"
                    checked={notifyOnStatusChange}
                    onChange={(e) => setNotifyOnStatusChange(e.target.checked)}
                    className="admin-gallery-user-dialog-checkbox"
                  />
                  <span className="admin-gallery-user-dialog-checkbox-text">Notify user via email</span>
                </label>
                <div className="admin-gallery-user-dialog-actions">
                  <Button variant="outline" onClick={() => setStatusChangeDialog(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (statusChangeDialog.action === 'visibility') {
                        updateModelStatus({
                          productId: statusChangeDialog.productId,
                          isPublic: !statusChangeDialog.currentStatus,
                        });
                      } else {
                        updateModelStatus({
                          productId: statusChangeDialog.productId,
                          isCompleted: !statusChangeDialog.currentStatus,
                        });
                      }
                    }}
                    disabled={isUpdatingModelStatus}
                  >
                    {isUpdatingModelStatus ? 'Updating...' : 'Confirm'}
                  </Button>
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
