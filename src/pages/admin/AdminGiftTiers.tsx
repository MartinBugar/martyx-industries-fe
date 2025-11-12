import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, Upload, X, Gift, CheckCircle, XCircle, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
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
      <div className="admin-page">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div className="admin-header-content">
              <h1 className="admin-title">
                <Gift size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                Gift Tiers Management
              </h1>
              <p className="admin-subtitle">
                Manage reward tiers based on cart value. Create and configure gifts that unlock at specific spending thresholds.
              </p>
            </div>
            {activeTab === 'all-tiers' && (
              <div className="admin-header-actions">
                <Button
                  onClick={() => { resetCreate(); setActiveTab('create-tier'); }}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <Plus size={18} />
                  Create Gift Tier
                </Button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="admin-card" style={{
              background: 'var(--admin-error-bg)',
              border: '1px solid var(--admin-error)',
              marginBottom: '24px',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <XCircle size={20} color="var(--admin-error)" />
              <span style={{ flex: 1, color: 'var(--admin-error)', fontWeight: 500 }}>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--admin-error)'
                }}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* All Tiers Tab */}
          {activeTab === 'all-tiers' && (
            <>
              {loading ? (
                <div className="admin-card">
                  <SkeletonTable rows={5} columns={6} />
                </div>
              ) : tiers.length === 0 ? (
                <div className="admin-card" style={{ textAlign: 'center', padding: '64px 32px' }}>
                  <Gift size={64} color="var(--admin-secondary)" style={{ marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--admin-primary)', marginBottom: '8px' }}>
                    No Gift Tiers Yet
                  </h3>
                  <p style={{ color: 'var(--admin-secondary)', marginBottom: '24px' }}>
                    Create your first gift tier to start rewarding customers based on cart value.
                  </p>
                  <Button
                    onClick={() => setActiveTab('create-tier')}
                    className="btn btn-primary"
                  >
                    <Plus size={18} />
                    Create Gift Tier
                  </Button>
                </div>
              ) : (
                <div className="admin-card">
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Gift Name</th>
                          <th>Threshold</th>
                          <th>Image</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiers.map((tier) => (
                          <tr key={tier.id}>
                            <td>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--admin-bg-secondary)',
                                color: 'var(--admin-accent)',
                                fontWeight: 700,
                                fontSize: '14px',
                                border: '2px solid var(--admin-border)'
                              }}>
                                {tier.tierOrder}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--admin-primary)', fontWeight: 600 }}>
                                {tier.name}
                              </strong>
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: 'var(--admin-success-bg)',
                                color: 'var(--admin-success)',
                                fontWeight: 600,
                                fontSize: '13px'
                              }}>
                                {formatCurrency(tier.thresholdAmount)}
                              </span>
                            </td>
                            <td>
                              {tier.imageUrl ? (
                                <div style={{
                                  width: '50px',
                                  height: '50px',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '2px solid var(--admin-border)'
                                }}>
                                  <img
                                    src={tier.imageUrl}
                                    alt={tier.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                </div>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  background: 'var(--admin-bg-secondary)',
                                  color: 'var(--admin-secondary)',
                                  fontSize: '12px',
                                  fontWeight: 500
                                }}>
                                  <ImageIcon size={14} />
                                  No Image
                                </span>
                              )}
                            </td>
                            <td>
                              {tier.isActive ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  background: 'var(--admin-success-bg)',
                                  color: 'var(--admin-success)',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}>
                                  <CheckCircle size={14} />
                                  Active
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  background: 'var(--admin-bg-secondary)',
                                  color: 'var(--admin-secondary)',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}>
                                  <XCircle size={14} />
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td style={{ color: 'var(--admin-secondary)', fontSize: '13px' }}>
                              {formatDate(tier.createdAt)}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleEdit(tier)}
                                  title="Edit tier"
                                >
                                  <Edit size={16} />
                                </button>
                                {tier.imageUrl && (
                                  <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() => handleDeleteImage(tier.id)}
                                    title="Delete image"
                                    disabled={uploading}
                                  >
                                    <ImageIcon size={16} />
                                  </button>
                                )}
                                <button
                                  className="btn btn-sm btn-danger"
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
                </div>
              )}
            </>
          )}

          {/* Create/Edit Tier Tab */}
          {activeTab === 'create-tier' && (
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button
                  onClick={() => { resetCreate(); setActiveTab('all-tiers'); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--admin-secondary)',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--admin-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--admin-secondary)'}
                >
                  <ArrowLeft size={20} />
                </button>
                <h3 className="section-title" style={{ margin: 0, fontSize: '24px' }}>
                  {editingId ? 'Edit Gift Tier' : 'Create New Gift Tier'}
                </h3>
              </div>

              <form onSubmit={handleCreate}>
                <div className="form-grid">
                  {/* Gift Name */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Gift Name *</label>
                    <input
                      type="text"
                      id="name"
                      className="form-control"
                      placeholder="e.g., Balíček nálepiek Martyx Industries"
                      value={createData.name}
                      onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid var(--admin-border)',
                        borderRadius: '8px',
                        background: 'var(--admin-bg-primary)',
                        color: 'var(--admin-primary)',
                        transition: 'border-color 0.2s'
                      }}
                    />
                  </div>

                  {/* Threshold Amount */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="thresholdAmount">Threshold Amount (€) *</label>
                    <input
                      type="number"
                      id="thresholdAmount"
                      className="form-control"
                      step="0.01"
                      min="0.01"
                      placeholder="30.00"
                      value={createData.thresholdAmount || ''}
                      onChange={(e) => setCreateData({ ...createData, thresholdAmount: parseFloat(e.target.value) || 0 })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid var(--admin-border)',
                        borderRadius: '8px',
                        background: 'var(--admin-bg-primary)',
                        color: 'var(--admin-primary)'
                      }}
                    />
                    <small style={{ color: 'var(--admin-secondary)', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                      Minimum cart value required to unlock this gift
                    </small>
                  </div>

                  {/* Tier Order */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="tierOrder">Tier Order *</label>
                    <input
                      type="number"
                      id="tierOrder"
                      className="form-control"
                      min="1"
                      placeholder="1"
                      value={createData.tierOrder || ''}
                      onChange={(e) => setCreateData({ ...createData, tierOrder: parseInt(e.target.value) || 1 })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid var(--admin-border)',
                        borderRadius: '8px',
                        background: 'var(--admin-bg-primary)',
                        color: 'var(--admin-primary)'
                      }}
                    />
                    <small style={{ color: 'var(--admin-secondary)', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                      Display order (1 = lowest tier, 4 = highest)
                    </small>
                  </div>

                  {/* Is Active */}
                  <div className="form-group">
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      padding: '12px 0'
                    }}>
                      <input
                        type="checkbox"
                        checked={createData.isActive}
                        onChange={(e) => setCreateData({ ...createData, isActive: e.target.checked })}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          accentColor: 'var(--admin-accent)'
                        }}
                      />
                      <span style={{ fontWeight: 500, color: 'var(--admin-primary)', fontSize: '14px' }}>
                        Active (visible to customers)
                      </span>
                    </label>
                  </div>

                  {/* Gift Image Upload */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="giftImage">Gift Image</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 20px',
                          border: '2px dashed var(--admin-border)',
                          borderRadius: '8px',
                          background: 'var(--admin-bg-secondary)',
                          color: 'var(--admin-primary)',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          width: 'fit-content',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--admin-accent)';
                          e.currentTarget.style.background = 'var(--admin-bg-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--admin-border)';
                          e.currentTarget.style.background = 'var(--admin-bg-secondary)';
                        }}
                      >
                        <Upload size={18} />
                        Choose Image
                      </button>
                      <small style={{ color: 'var(--admin-secondary)', fontSize: '12px' }}>
                        Max 5MB. Allowed: JPEG, PNG, WebP, GIF
                      </small>

                      {imagePreview && (
                        <div style={{
                          position: 'relative',
                          width: '200px',
                          height: '200px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '2px solid var(--admin-border)',
                          marginTop: '12px'
                        }}>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setImagePreview(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '32px',
                  paddingTop: '32px',
                  borderTop: '1px solid var(--admin-border)'
                }}>
                  <Button
                    type="button"
                    onClick={() => { resetCreate(); setActiveTab('all-tiers'); }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="btn btn-primary"
                  >
                    {creating ? 'Saving...' : editingId ? 'Update Gift Tier' : 'Create Gift Tier'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminGiftTiers;
