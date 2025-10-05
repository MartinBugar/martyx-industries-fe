import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminUsersService, type AdminUser } from '../../services/adminUsersService';
import { userGalleryService } from '../../services/userGalleryService';
import { adminGalleryService, type AdminUserPhotosResponse } from '../../services/adminGalleryService';
import type { UserGalleryDetail } from '../../types/userGallery';

type AdminUserTab = 'details' | 'gallery';

const AdminUserDetail: React.FC = () => {
  const { t } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<boolean>(false);
  const [form, setForm] = useState<Record<string, unknown> & { password?: string }>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [fieldTypes, setFieldTypes] = useState<Record<string, 'boolean' | 'number' | 'string' | 'object'>>({});

  // Gallery state
  const [activeTab, setActiveTab] = useState<AdminUserTab>('details');
  const [galleryData, setGalleryData] = useState<UserGalleryDetail | null>(null);
  const [galleryLoading, setGalleryLoading] = useState<boolean>(false);
  // const [galleryError, setGalleryError] = useState<string | null>(null);

  // Admin gallery state
  const [adminGalleryData, setAdminGalleryData] = useState<AdminUserPhotosResponse | null>(null);
  const [adminGalleryLoading, setAdminGalleryLoading] = useState<boolean>(false);
  const [adminGalleryError, setAdminGalleryError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false);
  const [photoActionLoading, setPhotoActionLoading] = useState<Set<number>>(new Set());

  const loadUser = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminUsersService.getUserById(id);
      setUser(data);
      // Initialize form with all editable fields (exclude id and hidden sensitive ones)
      const initialForm: Record<string, unknown> = {};
      const types: Record<string, 'boolean' | 'number' | 'string' | 'object'> = {};
      Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
        if (hiddenKeys.has(key)) return;
        if (key === 'id') return; // keep id read-only
        types[key] = Array.isArray(value) ? 'object' : (typeof value === 'object' && value !== null ? 'object' : (typeof value as 'boolean' | 'number' | 'string' | 'object'));
        if (types[key] === 'object') {
          try {
            initialForm[key] = JSON.stringify(value, null, 2);
          } catch {
            initialForm[key] = String(value);
          }
        } else {
          initialForm[key] = value as unknown;
        }
      });
      setForm(prev => ({ ...prev, ...initialForm }));
      setFieldTypes(types);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load user';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Load user gallery (public view)
  const loadUserGallery = async () => {
    if (!id) return;
    setGalleryLoading(true);
    // setGalleryError(null);
    try {
      const data = await userGalleryService.getUserGallery(parseInt(id));
      setGalleryData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load user gallery';
      console.error(msg);
    } finally {
      setGalleryLoading(false);
    }
  };

  // Load admin gallery (all photos including private)
  const loadAdminGallery = useCallback(async () => {
    if (!id) return;
    setAdminGalleryLoading(true);
    setAdminGalleryError(null);
    try {
      const data = await adminGalleryService.getUserPhotos(parseInt(id), {
        page: 1,
        limit: 100,
        sort: 'recent',
        filter: 'all'
      });
      setAdminGalleryData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load admin gallery';
      setAdminGalleryError(msg);
    } finally {
      setAdminGalleryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load gallery when tab changes to gallery
  useEffect(() => {
    if (activeTab === 'gallery' && !galleryData && !galleryLoading) {
      loadUserGallery();
    }
    if (activeTab === 'gallery' && !adminGalleryData && !adminGalleryLoading) {
      loadAdminGallery();
    }
  }, [activeTab, galleryData, galleryLoading, adminGalleryData, adminGalleryLoading, loadAdminGallery]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      // Build payload converting strings to proper types
      const payload: Record<string, unknown> = {};
      Object.entries(form).forEach(([key, rawVal]) => {
        if (key === 'password') return; // handle separately
        if (key === 'id') return;
        if (hiddenKeys.has(key)) return;
        const t = fieldTypes[key];
        if (!t) {
          payload[key] = rawVal;
          return;
        }
        if (t === 'boolean') {
          payload[key] = Boolean(rawVal);
        } else if (t === 'number') {
          const str = String(rawVal ?? '');
          if (str.trim() === '') {
            payload[key] = null; // treat empty as null
          } else {
            const num = Number(str);
            if (Number.isNaN(num)) {
              throw new Error(`Field "${key}" must be a valid number`);
            }
            payload[key] = num;
          }
        } else if (t === 'object') {
          if (typeof rawVal === 'string') {
            const txt = rawVal as string;
            if (txt.trim() === '') {
              payload[key] = null;
            } else {
              try {
                payload[key] = JSON.parse(txt);
              } catch {
                throw new Error(`Field "${key}" contains invalid JSON`);
              }
            }
          } else {
            payload[key] = rawVal;
          }
        } else {
          payload[key] = String(rawVal ?? '');
        }
      });

      // Handle password separately if provided
      if ((form as { password?: string }).password?.trim()) {
        payload.password = (form as { password?: string }).password;
      }

      await adminUsersService.updateUser(id, payload);
      setEditing(false);
      await loadUser(); // reload to get updated data
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save user';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm(t('admin.confirm_delete_user'))) return;
    setError(null);
    try {
      await adminUsersService.deleteUser(id);
      navigate('/admin/users');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('admin.failed_delete_user');
      setError(msg);
    }
  };

  // Admin gallery functions
  const handleDeletePhoto = async (photoId: number, photoName: string) => {
    const reason = window.prompt(`Enter reason for deleting photo "${photoName}":`);
    if (!reason || reason.trim() === '') {
      alert('Reason is required for photo deletion');
      return;
    }

    const notifyUser = window.confirm('Notify user about photo deletion?');
    const adminNotes = window.prompt('Admin notes (optional):') || '';

    setPhotoActionLoading(prev => new Set(prev).add(photoId));
    try {
      await adminGalleryService.deletePhoto(photoId, {
        reason: reason.trim(),
        notifyUser,
        adminNotes: adminNotes.trim() || undefined
      });
      
      // Reload admin gallery data
      await loadAdminGallery();
      alert('Photo deleted successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete photo';
      alert(`Error: ${msg}`);
    } finally {
      setPhotoActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
    }
  };

  const handleModeratePhoto = async (photoId: number, action: 'approve' | 'reject', photoName: string) => {
    const adminNotes = window.prompt(`Admin notes for ${action}ing photo "${photoName}" (optional):`) || '';
    const notifyUser = window.confirm(`Notify user about photo ${action}?`);

    setPhotoActionLoading(prev => new Set(prev).add(photoId));
    try {
      await adminGalleryService.moderatePhoto(photoId, {
        action,
        adminNotes: adminNotes.trim() || undefined,
        notifyUser
      });
      
      // Reload admin gallery data
      await loadAdminGallery();
      alert(`Photo ${action}d successfully`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to ${action} photo`;
      alert(`Error: ${msg}`);
    } finally {
      setPhotoActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
    }
  };

  // const handleUpdatePhoto = async (photoId: number, updates: { isPublic?: boolean; adminNotes?: string; order?: number }) => {
  //   setPhotoActionLoading(prev => new Set(prev).add(photoId));
  //   try {
  //     await adminGalleryService.updatePhoto(photoId, updates);
      
  //     // Reload admin gallery data
  //     await loadAdminGallery();
  //     alert('Photo updated successfully');
  //   } catch (err) {
  //     const msg = err instanceof Error ? err.message : 'Failed to update photo';
  //     alert(`Error: ${msg}`);
  //   } finally {
  //     setPhotoActionLoading(prev => {
  //       const newSet = new Set(prev);
  //       newSet.delete(photoId);
  //       return newSet;
  //     });
  //   }
  // };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete' | 'make_public' | 'make_private') => {
    if (selectedPhotos.size === 0) {
      alert('Please select photos first');
      return;
    }

    const photoIds = Array.from(selectedPhotos);
    let reason = '';
    let adminNotes = '';
    let notifyUsers = true;

    if (action === 'delete') {
      reason = window.prompt(`Enter reason for deleting ${photoIds.length} photos:`) || '';
      if (!reason.trim()) {
        alert('Reason is required for photo deletion');
        return;
      }
    }

    if (action === 'approve' || action === 'reject') {
      adminNotes = window.prompt(`Admin notes for ${action}ing ${photoIds.length} photos (optional):`) || '';
    }

    if (action !== 'delete') {
      notifyUsers = window.confirm(`Notify users about ${action} action?`);
    }

    setBulkActionLoading(true);
    try {
      await adminGalleryService.bulkAction({
        action,
        photoIds,
        reason: reason.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
        notifyUsers
      });
      
      // Reload admin gallery data and clear selection
      await loadAdminGallery();
      setSelectedPhotos(new Set());
      alert(`Bulk ${action} completed successfully`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to perform bulk ${action}`;
      alert(`Error: ${msg}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const togglePhotoSelection = (photoId: number) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const selectAllPhotos = () => {
    if (adminGalleryData?.photos) {
      setSelectedPhotos(new Set(adminGalleryData.photos.map(photo => photo.id)));
    }
  };

  const clearSelection = () => {
    setSelectedPhotos(new Set());
  };

  // Helper definitions for rendering all fields
  const hiddenKeys = new Set(['password', 'passwordHash', 'salt']);

  const formatValue = (val: unknown): string => {
    if (val === null) return 'null';
    if (val === undefined) return '—';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  };

  const getSortedEntries = (obj: Record<string, unknown>): [string, unknown][] => {
    const preferredOrder = ['id', 'email', 'firstName', 'lastName', 'name', 'phone', 'roles', 'authorities', 'enabled', 'status', 'createdAt', 'updatedAt'];
    const entries = Object.entries(obj).filter(([k]) => !hiddenKeys.has(k));
    return entries.sort(([a], [b]) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  };

  // Navigation tabs component
  const NavTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'details' ? 'active' : ''}`}
        data-tab="details"
        onClick={() => setActiveTab('details')}
        aria-label="User details and information"
      >
        Details
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'gallery' ? 'active' : ''}`}
        data-tab="gallery"
        onClick={() => setActiveTab('gallery')}
        aria-label="User gallery and photos"
      >
        User Gallery
      </button>
    </nav>
  );

  if (loading) {
    return (
      <AdminLayout title="Loading..." navTabs={NavTabs}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading user...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Error" navTabs={NavTabs}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#e74c3c', marginBottom: '16px' }}>Error: {error}</div>
          <button onClick={loadUser} style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="User Not Found" navTabs={NavTabs}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>User not found</div>
          <Link to="/admin/users" style={{ display: 'inline-block', marginTop: '16px', padding: '8px 16px', background: '#3498db', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Back to Users</Link>
        </div>
      </AdminLayout>
    );
  }

  // Render admin gallery content with full management capabilities
  const renderAdminGalleryContent = () => {
    if (adminGalleryLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading admin gallery...</div>
        </div>
      );
    }

    if (adminGalleryError) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#e74c3c', marginBottom: '16px' }}>Error: {adminGalleryError}</div>
          <button onClick={loadAdminGallery} style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
        </div>
      );
    }

    if (!adminGalleryData) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>No admin gallery data available</div>
        </div>
      );
    }

    const { user, photos, stats } = adminGalleryData;

    return (
      <div className="admin-gallery-content">
        <div className="gallery-header">
          <h2>Admin Gallery: {user.firstName} {user.lastName}</h2>
          <p>Email: {user.email}</p>
          <div className="gallery-stats">
            <span className="stat-item">Total: {stats.totalPhotos}</span>
            <span className="stat-item">Public: {stats.publicPhotos}</span>
            <span className="stat-item">Private: {stats.privatePhotos}</span>
            <span className="stat-item">Pending: {stats.pendingPhotos}</span>
            <span className="stat-item">Approved: {stats.approvedPhotos}</span>
            <span className="stat-item">Rejected: {stats.rejectedPhotos}</span>
          </div>
        </div>

        {/* Bulk Actions */}
        {photos.length > 0 && (
          <div className="bulk-actions">
            <div className="selection-info">
              <span>{selectedPhotos.size} of {photos.length} photos selected</span>
              <button onClick={selectAllPhotos} className="btn btn-sm btn-outline">Select All</button>
              <button onClick={clearSelection} className="btn btn-sm btn-outline">Clear</button>
            </div>
            <div className="bulk-buttons">
              <button 
                onClick={() => handleBulkAction('approve')} 
                disabled={selectedPhotos.size === 0 || bulkActionLoading}
                className="btn btn-sm btn-success"
              >
                Approve Selected
              </button>
              <button 
                onClick={() => handleBulkAction('reject')} 
                disabled={selectedPhotos.size === 0 || bulkActionLoading}
                className="btn btn-sm btn-warning"
              >
                Reject Selected
              </button>
              <button 
                onClick={() => handleBulkAction('make_public')} 
                disabled={selectedPhotos.size === 0 || bulkActionLoading}
                className="btn btn-sm btn-info"
              >
                Make Public
              </button>
              <button 
                onClick={() => handleBulkAction('make_private')} 
                disabled={selectedPhotos.size === 0 || bulkActionLoading}
                className="btn btn-sm btn-secondary"
              >
                Make Private
              </button>
              <button 
                onClick={() => handleBulkAction('delete')} 
                disabled={selectedPhotos.size === 0 || bulkActionLoading}
                className="btn btn-sm btn-danger"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: '#666' }}>No photos found</div>
            <p style={{ color: '#888', marginTop: '8px' }}>This user hasn't uploaded any photos yet.</p>
          </div>
        ) : (
          <div className="admin-photos-grid">
            {photos.map((photo) => (
              <div key={photo.id} className={`admin-photo-card ${selectedPhotos.has(photo.id) ? 'selected' : ''}`}>
                <div className="photo-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPhotos.has(photo.id)}
                    onChange={() => togglePhotoSelection(photo.id)}
                  />
                </div>
                
                <div className="photo-image">
                  <img 
                    src={photo.thumbnailUrl || photo.cdnUrl} 
                    alt={photo.originalFilename}
                    className="photo-thumbnail"
                    loading="lazy"
                  />
                  <div className="photo-overlay">
                    <div className="photo-actions">
                      <button
                        onClick={() => window.open(photo.cdnUrl, '_blank')}
                        className="btn btn-sm btn-outline"
                        title="View Full Size"
                      >
                        👁️
                      </button>
                      {photo.verificationStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleModeratePhoto(photo.id, 'approve', photo.originalFilename)}
                            disabled={photoActionLoading.has(photo.id)}
                            className="btn btn-sm btn-success"
                            title="Approve Photo"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleModeratePhoto(photo.id, 'reject', photo.originalFilename)}
                            disabled={photoActionLoading.has(photo.id)}
                            className="btn btn-sm btn-warning"
                            title="Reject Photo"
                          >
                            ✗
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeletePhoto(photo.id, photo.originalFilename)}
                        disabled={photoActionLoading.has(photo.id)}
                        className="btn btn-sm btn-danger"
                        title="Delete Photo"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                <div className="photo-info">
                  <div className="photo-name" title={photo.originalFilename}>
                    {photo.originalFilename}
                  </div>
                  <div className="photo-meta">
                    <span className={`status-badge ${photo.verificationStatus}`}>
                      {photo.verificationStatus}
                    </span>
                    <span className={`visibility-badge ${photo.isPublic ? 'public' : 'private'}`}>
                      {photo.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <div className="photo-stats">
                    <span>❤️ {photo.likesCount}</span>
                    <span>💬 {photo.commentsCount}</span>
                    <span>📅 {new Date(photo.uploadDate).toLocaleDateString()}</span>
                  </div>
                  {photo.adminNotes && (
                    <div className="admin-notes">
                      <strong>Admin Notes:</strong> {photo.adminNotes}
                    </div>
                  )}
                  {photo.moderatedBy && (
                    <div className="moderation-info">
                      <small>Moderated by {photo.moderatedBy} on {new Date(photo.moderatedAt!).toLocaleDateString()}</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout title={`User Detail`} navTabs={NavTabs}>
      <div className="admin-user-detail">
        {activeTab === 'details' ? (
          <div>
            <div className="admin-header">
              <div className="header-actions">
                <Link to="/admin/users" className="btn btn-outline">← Back to Users</Link>
                <div className="action-buttons">
                  {!editing ? (
                    <>
                      <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit User</button>
                      <button className="btn btn-danger" onClick={handleDelete}>Delete User</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="btn btn-outline" onClick={() => { setEditing(false); loadUser(); }} disabled={saving}>Cancel</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message" style={{ background: '#fee', color: '#c33', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div className="user-details">
              {!editing ? (
                <div>
                  <div className="section-title">User Information</div>
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: 240 }}>Field</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSortedEntries(user as unknown as Record<string, unknown>).map(([key, val]) => (
                          <tr key={key}>
                            <td style={{ verticalAlign: 'top' }}><code>{key}</code></td>
                            <td>
                              {typeof val === 'object' && val !== null ? (
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{formatValue(val)}</pre>
                              ) : (
                                <span>{formatValue(val)}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginTop: 8 }}>
                    <h3 className="section-title">Edit All Fields</h3>
                    <div className="table-wrapper" style={{ marginTop: 8 }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th style={{ width: 240 }}>Field</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSortedEntries(user as unknown as Record<string, unknown>).map(([key]) => {
                            if (key === 'id' || hiddenKeys.has(key)) return null;
                            const t = fieldTypes[key] ?? 'string';
                            const val = (form as Record<string, unknown>)[key];
                            return (
                              <tr key={key}>
                                <td style={{ verticalAlign: 'top' }}><code>{key}</code></td>
                                <td>
                                  {t === 'boolean' ? (
                                    <input
                                      type="checkbox"
                                      checked={Boolean(val)}
                                      onChange={(e) => {
                                        const checked = e.currentTarget.checked;
                                        setForm(prev => ({ ...prev, [key]: checked }));
                                      }}
                                    />
                                  ) : t === 'number' ? (
                                    <input
                                      type="number"
                                      className="form-input"
                                      value={String(val ?? '')}
                                      onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        setForm(prev => ({ ...prev, [key]: v }));
                                      }}
                                    />
                                  ) : t === 'object' ? (
                                    <textarea
                                      className="form-input"
                                      rows={4}
                                      value={String(val ?? '')}
                                      onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        setForm(prev => ({ ...prev, [key]: v }));
                                      }}
                                    />
                                  ) : (
                                    <input
                                      className="form-input"
                                      type={key === 'email' ? 'email' : 'text'}
                                      value={String(val ?? '')}
                                      onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        setForm(prev => ({ ...prev, [key]: v }));
                                      }}
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          <tr>
                            <td><code>password</code> <span style={{ color: '#888' }}>(optional)</span></td>
                            <td>
                              <input
                                type="password"
                                className="form-input"
                                value={(form as { password?: string }).password ?? ''}
                                onChange={(e) => {
                                  const v = e.currentTarget.value;
                                  setForm(prev => ({ ...prev, password: v }));
                                }}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-outline" onClick={() => { setEditing(false); loadUser(); }} disabled={saving}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          renderAdminGalleryContent()
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;