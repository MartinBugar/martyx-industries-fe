import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Globe, MapPin, ChevronRight, ChevronDown, Percent, Check, X } from 'lucide-react';
import { adminTaxService } from '../../services/adminTaxService';
import type { TaxZone } from '../../services/adminTaxService';
import { logError } from '../../services/logger';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { Button, Badge, SkeletonTable, ConfirmDialog, useConfirmDialog } from '../../components/ui';
import './AdminUsers.css';
import './AdminButtonOverrides.css';

const AdminTaxZones: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<TaxZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedZone, setExpandedZone] = useState<number | null>(null);

  const { confirm, dialogProps } = useConfirmDialog({
    title: 'Confirm Delete',
    variant: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  });

  const loadTaxZones = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const data = await adminTaxService.getAllTaxZones();
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

  useEffect(() => {
    const abortController = new AbortController();
    loadTaxZones(abortController.signal);
    return () => abortController.abort();
  }, [loadTaxZones]);

  const handleDeleteZone = async (id: number, zoneName: string) => {
    const confirmed = await confirm({
      title: 'Delete Tax Zone',
      message: `Are you sure you want to delete "${zoneName}"? This will also delete all associated tax rates.`,
    });
    if (!confirmed) return;

    try {
      await adminTaxService.deleteTaxZone(id);
      toast.success('Tax zone deleted');
      await loadTaxZones();
    } catch (error) {
      logError('Failed to delete tax zone:', error);
      toast.error('Failed to delete tax zone');
    }
  };

  const handleDeleteRate = async (id: number, rateName: string) => {
    const confirmed = await confirm({
      title: 'Delete Tax Rate',
      message: `Are you sure you want to delete "${rateName}"?`,
    });
    if (!confirmed) return;

    try {
      await adminTaxService.deleteTaxRate(id);
      toast.success('Tax rate deleted');
      await loadTaxZones();
    } catch (error) {
      logError('Failed to delete tax rate:', error);
      toast.error('Failed to delete tax rate');
    }
  };

  const toggleZone = (zoneId: number) => {
    setExpandedZone(expandedZone === zoneId ? null : zoneId);
  };

  const formatCountryCodes = (codes: string[]) => {
    if (!codes || codes.length === 0) return 'All other countries';
    if (codes.length <= 5) return codes.join(', ');
    return `${codes.slice(0, 5).join(', ')} +${codes.length - 5} more`;
  };

  return (
    <AdminLayout title="Tax Zones">
      <div className="admin-page">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Globe size={24} style={{ color: 'var(--admin-accent)' }} />
                  Tax Management
                </h2>
                <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
                  Manage tax zones and VAT rates for different regions.
                </p>
              </div>
              <Button variant="primary" onClick={() => navigate('/admin/tax/zones/new')}>
                <Plus size={16} />
                Add Tax Zone
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="admin-card">
              <SkeletonTable rows={4} columns={3} />
            </div>
          ) : zones.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Globe size={48} style={{ color: 'var(--admin-secondary)', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', color: 'var(--admin-primary)' }}>No Tax Zones</h3>
              <p style={{ margin: '0 0 20px', color: 'var(--admin-secondary)' }}>
                Create your first tax zone to start managing VAT rates.
              </p>
              <Button variant="primary" onClick={() => navigate('/admin/tax/zones/new')}>
                Create Tax Zone
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {zones.map((zone) => (
                <div key={zone.id} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Zone Header */}
                  <div
                    onClick={() => toggleZone(zone.id)}
                    style={{
                      padding: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      background: expandedZone === zone.id ? 'var(--admin-bg-secondary)' : 'transparent',
                      transition: 'background 0.2s',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      {expandedZone === zone.id ? (
                        <ChevronDown size={20} style={{ color: 'var(--admin-accent)' }} />
                      ) : (
                        <ChevronRight size={20} style={{ color: 'var(--admin-secondary)' }} />
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-primary)' }}>
                            {zone.name}
                          </h3>
                          {zone.code && (
                            <span style={{ fontSize: '12px', color: 'var(--admin-secondary)', fontFamily: 'monospace', background: 'var(--admin-bg-tertiary)', padding: '2px 8px', borderRadius: '4px' }}>
                              {zone.code}
                            </span>
                          )}
                          <Badge variant={zone.active ? 'success' : 'warning'} size="sm">
                            {zone.active ? 'Active' : 'Inactive'}
                          </Badge>
                          {zone.reverseChargeEligible && (
                            <Badge variant="info" size="sm">Reverse Charge</Badge>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '13px', color: 'var(--admin-secondary)' }}>
                          <MapPin size={14} />
                          <span>{formatCountryCodes(zone.countryCodes)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/tax/zones/${zone.id}/edit`)} title="Edit zone">
                        <Edit size={14} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteZone(zone.id, zone.name)} title="Delete zone">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content - Tax Rates */}
                  {expandedZone === zone.id && (
                    <div style={{ padding: '20px', borderTop: '1px solid var(--admin-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--admin-primary)' }}>
                          Tax Rates
                        </h4>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/tax/zones/${zone.id}/rates/new`)}>
                          <Plus size={14} />
                          Add Rate
                        </Button>
                      </div>

                      {zone.taxRates && zone.taxRates.length > 0 ? (
                        <div className="table-wrapper">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Rate</th>
                                <th>Default</th>
                                <th>Status</th>
                                <th style={{ width: 100 }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {zone.taxRates.map((rate) => (
                                <tr key={rate.id} style={{ opacity: rate.active ? 1 : 0.6 }}>
                                  <td style={{ fontWeight: 500 }}>{rate.name}</td>
                                  <td>
                                    <Badge variant="secondary" size="sm">{rate.rateType}</Badge>
                                  </td>
                                  <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--admin-accent)' }}>
                                      {rate.rate}%
                                    </span>
                                  </td>
                                  <td>
                                    {rate.isDefault ? (
                                      <Check size={16} style={{ color: 'var(--admin-success)' }} />
                                    ) : (
                                      <X size={16} style={{ color: 'var(--admin-secondary)' }} />
                                    )}
                                  </td>
                                  <td>
                                    <Badge variant={rate.active ? 'success' : 'warning'} size="sm">
                                      {rate.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <div className="action-buttons">
                                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/tax/rates/${rate.id}/edit`)} title="Edit rate">
                                        <Edit size={14} />
                                      </Button>
                                      <Button variant="danger" size="sm" onClick={() => handleDeleteRate(rate.id, rate.name)} title="Delete rate">
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '30px', background: 'var(--admin-bg-secondary)', borderRadius: '8px' }}>
                          <Percent size={24} style={{ color: 'var(--admin-secondary)', marginBottom: '8px' }} />
                          <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
                            No tax rates configured for this zone.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  );
};

export default AdminTaxZones;
