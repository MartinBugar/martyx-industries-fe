import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, Upload, X, Gift, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css'; // Reuse existing admin styles
import './AdminButtonOverrides.css';
import { adminGiftTierService, type GiftTierDTO, type GiftTierRequest } from '../../services/giftTierService';
import { Button, SkeletonTable } from '../../components/ui';

type CreateGiftTierData = {
  name: string;
  thresholdAmount: number;
  tierOrder: number;
  isActive: boolean;
};

const initialCreate: CreateGiftTierData = {
  name: '',
  thresholdAmount: 0,
  tierOrder: 1,
  isActive: true,
};

const AdminGiftTiers: React.FC = () => {
  const [tiers, setTiers] = useState<GiftTierDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'all-tiers' | 'create-tier'>('all-tiers');

  // Create/Edit form state
  const [createData, setCreateData] = useState<CreateGiftTierData>({ ...initialCreate });
  const [creating, setCreating] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTiers = async () => {
    setLoading(true);
    setError(null);
    try {
      const tiersList = await adminGiftTierService.getAllGiftTiers();
      setTiers(tiersList);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load gift tiers';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Load tiers on mount
  useEffect(() => {
    loadTiers();
  }, []);

  const resetCreate = () => {
    setCreateData({ ...initialCreate });
    setEditingId(null);
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!createData.name?.trim()) {
      setError('Gift name is required');
      return;
    }

    if (createData.thresholdAmount <= 0) {
      setError('Threshold amount must be greater than 0');
      return;
    }

    if (createData.tierOrder <= 0) {
      setError('Tier order must be greater than 0');
      return;
    }

    setCreating(true);
    try {
      const payload: GiftTierRequest = {
        name: createData.name.trim(),
        thresholdAmount: createData.thresholdAmount,
        tierOrder: createData.tierOrder,
        isActive: createData.isActive,
      };

      let savedTier: GiftTierDTO;

      if (editingId) {
        savedTier = await adminGiftTierService.updateGiftTier(editingId, payload);
      } else {
        savedTier = await adminGiftTierService.createGiftTier(payload);
      }

      // If there's a selected file, upload it
      if (selectedFile && savedTier.id) {
        await adminGiftTierService.uploadGiftImage(savedTier.id, selectedFile);
      }

      // Reload tiers to show the new/updated one
      await loadTiers();

      resetCreate();
      setActiveTab('all-tiers');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : editingId ? 'Failed to update gift tier' : 'Failed to create gift tier';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (tier: GiftTierDTO) => {
    setEditingId(tier.id);
    setCreateData({
      name: tier.name,
      thresholdAmount: tier.thresholdAmount,
      tierOrder: tier.tierOrder,
      isActive: tier.isActive,
    });
    setImagePreview(tier.imageUrl || null);
    setActiveTab('create-tier');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this gift tier?')) {
      return;
    }

    try {
      await adminGiftTierService.deleteGiftTier(id);
      await loadTiers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete gift tier';
      setError(msg);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setUploading(true);
    try {
      await adminGiftTierService.deleteGiftImage(id);
      await loadTiers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete image';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout title="Gift Tiers Management">
      <div className="admin-discounts-container">
        {/* Header with tabs */}
        <div className="admin-discounts-header">
          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === 'all-tiers' ? 'active' : ''}`}
              onClick={() => { resetCreate(); setActiveTab('all-tiers'); }}
            >
              <Gift size={18} />
              All Gift Tiers ({tiers.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'create-tier' ? 'active' : ''}`}
              onClick={() => { resetCreate(); setActiveTab('create-tier'); }}
            >
              <Plus size={18} />
              {editingId ? 'Edit Gift Tier' : 'Create Gift Tier'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="admin-error-banner">
            <XCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="admin-error-close">
              <X size={16} />
            </button>
          </div>
        )}

        {/* All Tiers Tab */}
        {activeTab === 'all-tiers' && (
          <div className="admin-discounts-content">
            {loading ? (
              <SkeletonTable rows={5} columns={6} />
            ) : (
              <>
                {tiers.length === 0 ? (
                  <div className="admin-empty-state">
                    <Gift size={64} />
                    <h3>No Gift Tiers Yet</h3>
                    <p>Create your first gift tier to start rewarding customers based on cart value.</p>
                    <Button onClick={() => setActiveTab('create-tier')}>
                      <Plus size={18} />
                      Create Gift Tier
                    </Button>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Gift Name</th>
                          <th>Threshold</th>
                          <th>Image</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiers.map((tier) => (
                          <tr key={tier.id}>
                            <td>
                              <span className="tier-order-badge">{tier.tierOrder}</span>
                            </td>
                            <td>
                              <strong>{tier.name}</strong>
                            </td>
                            <td>
                              <span className="threshold-badge">{formatCurrency(tier.thresholdAmount)}</span>
                            </td>
                            <td>
                              {tier.imageUrl ? (
                                <div className="tier-image-preview">
                                  <img src={tier.imageUrl} alt={tier.name} />
                                </div>
                              ) : (
                                <span className="no-image-badge">
                                  <ImageIcon size={16} />
                                  No Image
                                </span>
                              )}
                            </td>
                            <td>
                              {tier.isActive ? (
                                <span className="status-badge status-active">
                                  <CheckCircle size={14} />
                                  Active
                                </span>
                              ) : (
                                <span className="status-badge status-inactive">
                                  <XCircle size={14} />
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td>{formatDate(tier.createdAt)}</td>
                            <td>
                              <div className="admin-table-actions">
                                <button
                                  className="admin-action-btn admin-action-edit"
                                  onClick={() => handleEdit(tier)}
                                  title="Edit tier"
                                >
                                  <Edit size={16} />
                                </button>
                                {tier.imageUrl && (
                                  <button
                                    className="admin-action-btn admin-action-delete"
                                    onClick={() => handleDeleteImage(tier.id)}
                                    title="Delete image"
                                    disabled={uploading}
                                  >
                                    <ImageIcon size={16} />
                                  </button>
                                )}
                                <button
                                  className="admin-action-btn admin-action-delete"
                                  onClick={() => handleDelete(tier.id)}
                                  title="Delete tier"
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
              </>
            )}
          </div>
        )}

        {/* Create/Edit Tier Tab */}
        {activeTab === 'create-tier' && (
          <div className="admin-discounts-content">
            <div className="admin-form-container">
              <h3>{editingId ? 'Edit Gift Tier' : 'Create New Gift Tier'}</h3>

              <form onSubmit={handleCreate}>
                <div className="admin-form-grid">
                  {/* Gift Name */}
                  <div className="admin-form-group">
                    <label htmlFor="name">Gift Name *</label>
                    <input
                      type="text"
                      id="name"
                      placeholder="e.g., Balíček nálepiek Martyx Industries"
                      value={createData.name}
                      onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Threshold Amount */}
                  <div className="admin-form-group">
                    <label htmlFor="thresholdAmount">Threshold Amount (€) *</label>
                    <input
                      type="number"
                      id="thresholdAmount"
                      step="0.01"
                      min="0.01"
                      placeholder="30.00"
                      value={createData.thresholdAmount || ''}
                      onChange={(e) => setCreateData({ ...createData, thresholdAmount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                    <small>Minimum cart value required to unlock this gift</small>
                  </div>

                  {/* Tier Order */}
                  <div className="admin-form-group">
                    <label htmlFor="tierOrder">Tier Order *</label>
                    <input
                      type="number"
                      id="tierOrder"
                      min="1"
                      placeholder="1"
                      value={createData.tierOrder || ''}
                      onChange={(e) => setCreateData({ ...createData, tierOrder: parseInt(e.target.value) || 1 })}
                      required
                    />
                    <small>Display order (1 = lowest tier, 4 = highest)</small>
                  </div>

                  {/* Is Active */}
                  <div className="admin-form-group">
                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={createData.isActive}
                        onChange={(e) => setCreateData({ ...createData, isActive: e.target.checked })}
                      />
                      <span>Active (visible to customers)</span>
                    </label>
                  </div>

                  {/* Gift Image Upload */}
                  <div className="admin-form-group admin-form-full-width">
                    <label htmlFor="giftImage">Gift Image</label>
                    <div className="admin-image-upload-area">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="giftImage"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="admin-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={18} />
                        Choose Image
                      </button>
                      <small>Max 5MB. Allowed: JPEG, PNG, WebP, GIF</small>

                      {imagePreview && (
                        <div className="admin-image-preview">
                          <img src={imagePreview} alt="Preview" />
                          <button
                            type="button"
                            className="admin-remove-image-btn"
                            onClick={() => {
                              setSelectedFile(null);
                              setImagePreview(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="admin-form-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => { resetCreate(); setActiveTab('all-tiers'); }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Saving...' : editingId ? 'Update Gift Tier' : 'Create Gift Tier'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .tier-order-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e3f2fd;
          color: #1976d2;
          font-weight: 600;
          font-size: 14px;
        }

        .threshold-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          background: #e8f5e9;
          color: #2e7d32;
          font-weight: 600;
          font-size: 14px;
        }

        .tier-image-preview {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #e0e0e0;
        }

        .tier-image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-image-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 6px;
          background: #f5f5f5;
          color: #757575;
          font-size: 12px;
        }

        .admin-image-upload-area {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .admin-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: 2px dashed #ccc;
          border-radius: 8px;
          background: #fafafa;
          color: #333;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          width: fit-content;
        }

        .admin-upload-btn:hover {
          border-color: #2196f3;
          background: #e3f2fd;
          color: #1976d2;
        }

        .admin-image-preview {
          position: relative;
          width: 200px;
          height: 200px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #e0e0e0;
          margin-top: 12px;
        }

        .admin-image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .admin-remove-image-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .admin-remove-image-btn:hover {
          background: rgba(0, 0, 0, 0.8);
        }

        .admin-form-full-width {
          grid-column: 1 / -1;
        }
      `}</style>
    </AdminLayout>
  );
};

export default AdminGiftTiers;
