import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Globe, MapPin, ChevronRight, Percent, Check, X } from 'lucide-react';
import { adminTaxService, TaxZone } from '../../services/adminTaxService';
import { logError } from '../../services/logger';
import toast from 'react-hot-toast';
import './AdminTaxZones.css';

/**
 * Admin Tax Zones Management Page
 *
 * Displays all tax zones with their rates.
 * Allows CRUD operations on zones and rates.
 */
const AdminTaxZones: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<TaxZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [expandedZone, setExpandedZone] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'zone' | 'rate'; id: number } | null>(null);

  // Load tax zones with proper cleanup to prevent memory leaks
  const loadTaxZones = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      // Backend now returns zones with rates in single query (no N+1)
      const data = await adminTaxService.getAllTaxZones();

      // Check if component was unmounted
      if (signal?.aborted) return;

      setZones(data);
    } catch (error) {
      if (signal?.aborted) return;
      logError('Failed to load tax zones:', error);
      toast.error('Failed to load tax zones');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Load tax zones on mount with cleanup
  useEffect(() => {
    const abortController = new AbortController();
    loadTaxZones(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [loadTaxZones]);

  const handleDeleteZone = useCallback(async (id: number) => {
    try {
      setDeleting(true);
      setDeleteConfirm(null);
      await adminTaxService.deleteTaxZone(id);
      toast.success('Tax zone deleted');
      await loadTaxZones();
    } catch (error) {
      logError('Failed to delete tax zone:', error);
      toast.error('Failed to delete tax zone');
    } finally {
      setDeleting(false);
    }
  }, [loadTaxZones]);

  const handleDeleteRate = useCallback(async (id: number) => {
    try {
      setDeleting(true);
      setDeleteConfirm(null);
      await adminTaxService.deleteTaxRate(id);
      toast.success('Tax rate deleted');
      await loadTaxZones();
    } catch (error) {
      logError('Failed to delete tax rate:', error);
      toast.error('Failed to delete tax rate');
    } finally {
      setDeleting(false);
    }
  }, [loadTaxZones]);

  const toggleZone = (zoneId: number) => {
    setExpandedZone(expandedZone === zoneId ? null : zoneId);
  };

  const formatCountryCodes = (codes: string[]) => {
    if (!codes || codes.length === 0) return 'All other countries';
    if (codes.length <= 5) return codes.join(', ');
    return `${codes.slice(0, 5).join(', ')} +${codes.length - 5} more`;
  };

  if (loading) {
    return (
      <div className="admin-tax-zones">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading tax zones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tax-zones">
      <div className="page-header">
        <div className="header-content">
          <h1>Tax Management</h1>
          <p>Manage tax zones and VAT rates for different regions</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/admin/tax/zones/new')}
        >
          <Plus size={18} />
          Add Tax Zone
        </button>
      </div>

      <div className="tax-zones-list">
        {zones.length === 0 ? (
          <div className="empty-state">
            <Globe size={48} />
            <h3>No Tax Zones</h3>
            <p>Create your first tax zone to start managing VAT rates.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/admin/tax/zones/new')}
            >
              Create Tax Zone
            </button>
          </div>
        ) : (
          zones.map((zone) => (
            <div key={zone.id} className={`tax-zone-card ${!zone.active ? 'inactive' : ''}`}>
              <div
                className="zone-header"
                onClick={() => toggleZone(zone.id)}
              >
                <div className="zone-info">
                  <ChevronRight
                    size={20}
                    className={`chevron ${expandedZone === zone.id ? 'expanded' : ''}`}
                  />
                  <div className="zone-title">
                    <h3>{zone.name}</h3>
                    {zone.code && <span className="zone-code">{zone.code}</span>}
                  </div>
                  <div className="zone-meta">
                    <span className={`status-badge ${zone.active ? 'active' : 'inactive'}`}>
                      {zone.active ? 'Active' : 'Inactive'}
                    </span>
                    {zone.reverseChargeEligible && (
                      <span className="badge reverse-charge">Reverse Charge</span>
                    )}
                  </div>
                </div>
                <div className="zone-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-icon"
                    onClick={() => navigate(`/admin/tax/zones/${zone.id}/edit`)}
                    title="Edit zone"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => setDeleteConfirm({ type: 'zone', id: zone.id })}
                    title="Delete zone"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="zone-countries">
                <MapPin size={14} />
                <span>{formatCountryCodes(zone.countryCodes)}</span>
              </div>

              {zone.description && (
                <p className="zone-description">{zone.description}</p>
              )}

              {expandedZone === zone.id && (
                <div className="zone-rates">
                  <div className="rates-header">
                    <h4>Tax Rates</h4>
                    <button
                      className="btn btn-sm"
                      onClick={() => navigate(`/admin/tax/zones/${zone.id}/rates/new`)}
                    >
                      <Plus size={14} />
                      Add Rate
                    </button>
                  </div>

                  {zone.taxRates && zone.taxRates.length > 0 ? (
                    <table className="rates-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Rate</th>
                          <th>Default</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zone.taxRates.map((rate) => (
                          <tr key={rate.id} className={!rate.active ? 'inactive' : ''}>
                            <td>{rate.name}</td>
                            <td>
                              <span className={`rate-type ${rate.rateType.toLowerCase()}`}>
                                {rate.rateType}
                              </span>
                            </td>
                            <td>
                              <span className="rate-value">
                                <Percent size={14} />
                                {rate.rate}
                              </span>
                            </td>
                            <td>
                              {rate.isDefault ? (
                                <Check size={16} className="check-icon" />
                              ) : (
                                <X size={16} className="x-icon" />
                              )}
                            </td>
                            <td>
                              <span className={`status-dot ${rate.active ? 'active' : 'inactive'}`} />
                            </td>
                            <td>
                              <div className="rate-actions">
                                <button
                                  className="btn-icon sm"
                                  onClick={() => navigate(`/admin/tax/rates/${rate.id}/edit`)}
                                  title="Edit rate"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="btn-icon sm danger"
                                  onClick={() => setDeleteConfirm({ type: 'rate', id: rate.id })}
                                  title="Delete rate"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-rates">
                      <Percent size={24} />
                      <p>No tax rates configured for this zone.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete this {deleteConfirm.type}?
              {deleteConfirm.type === 'zone' && ' This will also delete all associated tax rates.'}
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={deleting}
                onClick={() => {
                  if (deleteConfirm.type === 'zone') {
                    handleDeleteZone(deleteConfirm.id);
                  } else {
                    handleDeleteRate(deleteConfirm.id);
                  }
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTaxZones;
