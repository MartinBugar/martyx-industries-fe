import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import { adminUsersService, type AdminUser } from '../../services/adminUsersService';
import { userGalleryService } from '../../services/userGalleryService';
import { adminGalleryService, type AdminUserPhotosResponse, type AdminModelInfo } from '../../services/adminGalleryService';
import { adminAbandonedCartService, type ShoppingCartDto } from '../../services/adminAbandonedCartService';
import type { UserGalleryDetail } from '../../types/userGallery';
import { logInfo, logError } from '../../services/logger';

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
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // Admin gallery state
  const [adminGalleryData, setAdminGalleryData] = useState<AdminUserPhotosResponse | null>(null);
  const [adminGalleryLoading, setAdminGalleryLoading] = useState<boolean>(false);
  const [adminGalleryError, setAdminGalleryError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false);
  const [modelActionLoading, setModelActionLoading] = useState<Set<string>>(new Set());

  // Abandoned cart state
  const [cartData, setCartData] = useState<ShoppingCartDto | null>(null);
  const [cartLoading, setCartLoading] = useState<boolean>(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [sendingRecoveryEmail, setSendingRecoveryEmail] = useState<boolean>(false);

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
    setGalleryError(null);
    try {
      const data = await userGalleryService.getUserGallery(parseInt(id));
      setGalleryData(data);
      setGalleryError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load user gallery';
      logError(msg);
      setGalleryError(msg);
    } finally {
      setGalleryLoading(false);
    }
  };

  // Load admin gallery (using admin endpoints with model status)
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
      
      logInfo('Admin gallery data received:', data);
      logInfo('Photos array:', data.photos);
      logInfo('First photo structure:', data.photos[0]);
      
      // Debug: Check if backend provides model-level status
      logInfo('=== BACKEND DATA DEBUG ===');
      logInfo('Model statuses from backend:', data.modelStatuses);
      logInfo('Photos array length:', data.photos.length);
      if (data.photos.length > 0) {
        const firstPhoto = data.photos[0];
        logInfo('First photo structure:', firstPhoto);
        logInfo('All photo fields:', Object.keys(firstPhoto));
      }
      logInfo('========================');
      
      // Check if data has photos array
      if (!data.photos || !Array.isArray(data.photos)) {
        throw new Error('Invalid data structure: photos array not found');
      }
      
      // Transform flat photos array into models structure
      const modelsMap = new Map<string, AdminModelInfo>();
      
      data.photos.forEach(photo => {
        const modelKey = `${photo.productId}-${photo.productName}`;
        
        if (!modelsMap.has(modelKey)) {
          // Get model status from backend modelStatuses object
          const modelStatus = data.modelStatuses?.[photo.productId];
          
          logInfo(`Model ${photo.productId} status from backend:`, modelStatus);
          
          modelsMap.set(modelKey, {
            productId: photo.productId,
            productName: photo.productName,
            // Use model status from backend modelStatuses object
            isPublic: modelStatus?.isPublic ?? false, // Real backend data
            isCompleted: modelStatus?.isCompleted ?? false, // Real backend data
            photoCount: 0,
            photos: []
          });
        }
        
        const model = modelsMap.get(modelKey)!;
        model.photos.push(photo);
        model.photoCount = model.photos.length;
      });
      
      const transformedData: AdminUserPhotosResponse = {
        ...data,
        models: Array.from(modelsMap.values())
      };
      
      logInfo('Transformed admin gallery data:', transformedData);
      
      // Debug: Check transformed model data
      if (transformedData.models.length > 0) {
        const firstModel = transformedData.models[0];
        logInfo('=== TRANSFORMED MODEL DEBUG ===');
        logInfo('Model isPublic (transformed):', firstModel.isPublic, typeof firstModel.isPublic);
        logInfo('Model isCompleted (transformed):', firstModel.isCompleted, typeof firstModel.isCompleted);
        logInfo('Model name:', firstModel.productName);
        logInfo('===============================');
      }
      
      setAdminGalleryData(transformedData);
    } catch (err) {
      logError('Admin gallery loading error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load admin gallery';
      setAdminGalleryError(msg);
    } finally {
      setAdminGalleryLoading(false);
    }
  }, [id]);

  // Load abandoned cart
  const loadCart = async () => {
    if (!id) return;
    setCartLoading(true);
    setCartError(null);
    try {
      const cart = await adminAbandonedCartService.getUserCart(parseInt(id));
      setCartData(cart);
    } catch (err: unknown) {
      // No cart found is not an error - just means user has no active cart
      setCartData(null);
      setCartError(null);
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load gallery when tab changes to gallery
  useEffect(() => {
    if (activeTab === 'gallery' && !galleryData && !galleryLoading && !galleryError) {
      loadUserGallery();
    }
    if (activeTab === 'gallery' && !adminGalleryData && !adminGalleryLoading) {
      loadAdminGallery();
    }
  }, [activeTab, galleryData, galleryLoading, galleryError, adminGalleryData, adminGalleryLoading, loadAdminGallery]);

  // Load cart when tab changes to details
  useEffect(() => {
    if (activeTab === 'details' && !cartData && !cartLoading) {
      loadCart();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSendRecoveryEmail = async (cartId: number) => {
    const discountCode = window.prompt('Enter discount code (optional):');
    setSendingRecoveryEmail(true);
    setCartError(null);
    try {
      await adminAbandonedCartService.sendRecoveryEmail(cartId, discountCode || undefined);
      alert('Recovery email sent successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send recovery email';
      setCartError(msg);
      alert(`Error: ${msg}`);
    } finally {
      setSendingRecoveryEmail(false);
    }
  };

  // Removed individual photo actions - use bulk actions instead
  // Removed moderation functionality - photos are auto-approved on upload

  const handleBulkAction = async (action: 'delete') => {
    if (selectedPhotos.size === 0) {
      alert('Please select photos first');
      return;
    }

    const photoIds = Array.from(selectedPhotos);
    const reason = window.prompt(`Enter reason for deleting ${photoIds.length} photos:`) || '';
    
    if (!reason.trim()) {
      alert('Reason is required for photo deletion');
      return;
    }

    setBulkActionLoading(true);
    try {
      await adminGalleryService.bulkAction({
        action,
        photoIds,
        reason: reason.trim(),
        notifyUsers: true
      });
      
      // Reload admin gallery data and clear selection
      await loadAdminGallery();
      setSelectedPhotos(new Set());
      alert(`Successfully deleted ${photoIds.length} photos`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete photos';
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
    if (adminGalleryData?.models) {
      const allPhotos = adminGalleryData.models.flatMap(model => model.photos);
      setSelectedPhotos(new Set(allPhotos.map(photo => photo.id)));
    }
  };

  const clearSelection = () => {
    setSelectedPhotos(new Set());
  };

  // Model-level actions
  const handleModelAction = async (productId: string, action: 'toggle_public' | 'toggle_completed') => {
    const modelKey = productId;
    setModelActionLoading(prev => new Set(prev).add(modelKey));
    
    try {
      // Get current model data
      const model = adminGalleryData?.models.find(m => m.productId === productId);
      if (!model || !id) return;
      
      let updates: { isPublic?: boolean; isCompleted?: boolean; reason?: string; notifyUser?: boolean } = {};
      
      if (action === 'toggle_public') {
        const newPublicStatus = !model.isPublic;
        updates = {
          isPublic: newPublicStatus,
          reason: `Admin changed model to ${newPublicStatus ? 'Public' : 'Private'}`,
          notifyUser: true
        };
      } else if (action === 'toggle_completed') {
        const newCompletedStatus = !model.isCompleted;
        updates = {
          isCompleted: newCompletedStatus,
          reason: `Admin marked model as ${newCompletedStatus ? 'Completed' : 'In Progress'}`,
          notifyUser: true
        };
      }
      
      // Update model status via new endpoint
      await adminGalleryService.updateModelStatus(parseInt(id), productId, updates);
      
      // Reload admin gallery data
      await loadAdminGallery();
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to perform model ${action}`;
      alert(`Error: ${msg}`);
    } finally {
      setModelActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelKey);
        return newSet;
      });
    }
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

  // Render cart section
  const renderCartSection = () => {
    if (cartLoading) {
      return (
        <div className="cart-section" style={{ marginTop: '24px', padding: '20px', background: '#2a2a2a', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, color: '#d4af37' }}>🛒 Shopping Cart</h3>
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            Loading cart...
          </div>
        </div>
      );
    }

    if (cartError) {
      return (
        <div className="cart-section" style={{ marginTop: '24px', padding: '20px', background: '#2a2a2a', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, color: '#d4af37' }}>🛒 Shopping Cart</h3>
          <div style={{ textAlign: 'center', padding: '20px', color: '#e74c3c' }}>
            Error: {cartError}
          </div>
        </div>
      );
    }

    if (!cartData) {
      return (
        <div className="cart-section" style={{ marginTop: '24px', padding: '20px', background: '#2a2a2a', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, color: '#d4af37' }}>🛒 Shopping Cart</h3>
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            No active cart found for this user
          </div>
        </div>
      );
    }

    const cartAge = new Date().getTime() - new Date(cartData.lastActivityAt).getTime();
    const hoursAgo = Math.floor(cartAge / (1000 * 60 * 60));
    const minutesAgo = Math.floor((cartAge % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <div className="cart-section" style={{ marginTop: '24px', padding: '20px', background: '#2a2a2a', borderRadius: '8px', border: cartData.isAbandoned ? '2px solid #e74c3c' : '1px solid #444' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ marginTop: 0, color: '#d4af37', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛒 Shopping Cart
              {cartData.isAbandoned && (
                <span style={{ fontSize: '14px', background: '#e74c3c', color: 'white', padding: '4px 12px', borderRadius: '12px' }}>
                  ABANDONED
                </span>
              )}
            </h3>
            <div style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
              <div>Cart ID: {cartData.id}</div>
              <div>Total: €{(cartData.total ?? 0).toFixed(2)}</div>
              <div>Last activity: {hoursAgo > 0 ? `${hoursAgo}h ` : ''}{minutesAgo}m ago</div>
              <div>Created: {new Date(cartData.createdAt).toLocaleString()}</div>
            </div>
          </div>
          {cartData.isAbandoned && (
            <button
              onClick={() => handleSendRecoveryEmail(cartData.id)}
              disabled={sendingRecoveryEmail}
              style={{
                background: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: sendingRecoveryEmail ? 'not-allowed' : 'pointer',
                opacity: sendingRecoveryEmail ? 0.6 : 1,
                fontSize: '14px'
              }}
            >
              {sendingRecoveryEmail ? 'Sending...' : '📧 Send Recovery Email'}
            </button>
          )}
        </div>

        {cartData.items && cartData.items.length > 0 ? (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ color: '#d4af37', marginBottom: '12px' }}>Cart Items:</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {cartData.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#1a1a1a',
                    padding: '12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f0f0f0', fontWeight: 'bold' }}>{item.productName}</div>
                    {item.variantName && (
                      <div style={{ color: '#999', fontSize: '13px' }}>Variant: {item.variantName}</div>
                    )}
                    <div style={{ color: '#d4af37', marginTop: '4px' }}>
                      {item.quantity} × €{(item.unitPrice ?? 0).toFixed(2)} = €{(item.totalPrice ?? 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '16px', padding: '12px', background: '#1a1a1a', borderRadius: '6px', textAlign: 'center', color: '#999' }}>
            No items in cart
          </div>
        )}
      </div>
    );
  };

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

    const { user, models, stats } = adminGalleryData;

    // Calculate total likes from all photos
    const totalLikes = models.reduce((total, model) => {
      return total + model.photos.reduce((modelLikes, photo) => {
        return modelLikes + (photo.likesCount || 0);
      }, 0);
    }, 0);

    return (
      <div className="admin-gallery-content">
        <div className="gallery-header">
          <h2>🎨 Admin Gallery: {user.firstName} {user.lastName}</h2>
          <p>📧 {user.email}</p>
          <div className="gallery-stats">
            <span className="stat-item stat-total">Total: {stats.totalPhotos}</span>
            <span className="stat-item stat-public">Public: {stats.publicPhotos}</span>
            <span className="stat-item stat-private">Private: {stats.privatePhotos}</span>
            <span className="stat-item stat-likes">Likes: {totalLikes}</span>
          </div>
        </div>

        {/* Bulk Actions */}
        {models.length > 0 && (
          <div className="bulk-actions">
            <div className="selection-info">
              <span>📊 {selectedPhotos.size} of {models.reduce((sum, model) => sum + model.photos.length, 0)} photos selected</span>
              <button onClick={selectAllPhotos} className="btn btn-sm btn-outline">✅ Select All</button>
              <button onClick={clearSelection} className="btn btn-sm btn-outline">❌ Clear</button>
            </div>
            <div className="bulk-buttons">
              <button 
                onClick={() => handleBulkAction('delete')} 
                disabled={selectedPhotos.size === 0 || bulkActionLoading}
                className="btn btn-sm btn-danger"
              >
                🗑️ Delete Selected Photos
              </button>
            </div>
          </div>
        )}

        {models.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: '#666' }}>No photos found</div>
            <p style={{ color: '#888', marginTop: '8px' }}>This user hasn't uploaded any photos yet.</p>
          </div>
        ) : (
          <div className="gallery-models">
            {models.map((model) => (
              <div key={`${model.productId}-${model.productName}`} className="gallery-model-card">
                <div className="model-header">
                  <div className="model-title-section">
                    <h4 className="model-name">{model.productName}</h4>
                    <div className="model-controls">
                      <div className="model-toggles">
                        <div className="toggle-group">
                          <label className="toggle-label">
                            <input
                              type="checkbox"
                              checked={model.isPublic}
                              onChange={() => handleModelAction(model.productId, 'toggle_public')}
                              disabled={modelActionLoading.has(model.productId)}
                              className="toggle-checkbox"
                            />
                            <span className="toggle-slider"></span>
                            <span className="toggle-text">Public</span>
                          </label>
                        </div>
                        <div className="toggle-group">
                          <label className="toggle-label">
                            <input
                              type="checkbox"
                              checked={model.isCompleted}
                              onChange={() => handleModelAction(model.productId, 'toggle_completed')}
                              disabled={modelActionLoading.has(model.productId)}
                              className="toggle-checkbox"
                            />
                            <span className="toggle-slider"></span>
                            <span className="toggle-text">Completed</span>
                          </label>
                        </div>
                      </div>
                      {modelActionLoading.has(model.productId) && (
                        <div className="updating-indicator">
                          <div className="mini-spinner"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="model-status">
                    <span className="photo-count">{model.photos.length} photos</span>
                    <span className={`model-badge ${model.isPublic ? 'public' : 'private'}`}>
                      {model.isPublic ? '🌐 Public' : '🔒 Private'}
                    </span>
                    <span className={`model-badge ${model.isCompleted ? 'completed' : 'in-progress'}`}>
                      {model.isCompleted ? '✅ Completed' : '🚧 In Progress'}
                    </span>
                  </div>
                </div>
                
                <div className="model-photos">
                  {model.photos.map((photo) => (
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
                      </div>

                      <div className="photo-info">
                        <div className="photo-name" title={photo.originalFilename}>
                          {photo.originalFilename}
                        </div>
                        <div className="photo-meta">
                          <span className="upload-date">
                            📅 {new Date(photo.uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="photo-stats">
                          <span>❤️ {photo.likesCount || 0}</span>
                        </div>
                        {photo.adminNotes && (
                          <div className="admin-notes">
                            <strong>Admin Notes:</strong> {photo.adminNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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

                  {/* Shopping Cart Section */}
                  {renderCartSection()}
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