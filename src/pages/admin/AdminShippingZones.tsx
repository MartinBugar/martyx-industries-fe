import React, { useEffect, useState, useCallback } from 'react';
import { Globe, Plus, X, Edit, Package, Truck } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css';
import './AdminButtonOverrides.css';
import { adminShippingService } from '../../services/adminShippingService';
import type { ShippingZoneDto, ShippingRateDto } from '../../types/shipping';
import { Badge, Button, SkeletonTable, ConfirmDialog, useConfirmDialog } from '../../components/ui';

type TabType = 'zones' | 'rates' | 'create-zone' | 'create-rate';

type CreateZoneData = {
  zone_name: string;
  zone_code: string;
  country_codes: string[];
  priority: number;
  estimated_delivery_days_min?: number;
  estimated_delivery_days_max?: number;
  is_active: boolean;
  description?: string;
};

type CreateRateData = {
  shipping_zone_id?: number;
  rate_name: string;
  calculation_method: 'FLAT_RATE' | 'WEIGHT_BASED' | 'PRICE_BASED' | 'FREE';
  flat_rate?: number;
  min_weight_kg?: number;
  max_weight_kg?: number;
  price_per_kg?: number;
  base_rate?: number;
  min_order_value?: number;
  max_order_value?: number;
  shipping_cost?: number;
  free_shipping_threshold?: number;
  carrier_name?: string;
  carrier_service?: string;
  delivery_days_min?: number;
  delivery_days_max?: number;
  is_active: boolean;
  description?: string;
};

const initialZone: CreateZoneData = {
  zone_name: '',
  zone_code: '',
  country_codes: [],
  priority: 1,
  is_active: true,
};

const initialRate: CreateRateData = {
  rate_name: '',
  calculation_method: 'FLAT_RATE',
  is_active: true,
};

const AdminShippingZones: React.FC = () => {
  const [zones, setZones] = useState<ShippingZoneDto[]>([]);
  const [rates, setRates] = useState<ShippingRateDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<TabType>('zones');

  // Create/Edit form state
  const [zoneData, setZoneData] = useState<CreateZoneData>({ ...initialZone });
  const [rateData, setRateData] = useState<CreateRateData>({ ...initialRate });
  const [countryCodesInput, setCountryCodesInput] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editingRateId, setEditingRateId] = useState<number | null>(null);

  // Confirm dialog
  const { confirm, dialogProps } = useConfirmDialog({
    title: 'Confirm Delete',
    message: 'Are you sure?',
    variant: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });

  const loadZones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminShippingService.getAllZones();
      setZones(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load shipping zones';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminShippingService.getAllRates();
      setRates(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load shipping rates';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
    loadRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetZoneForm = () => {
    setZoneData({ ...initialZone });
    setCountryCodesInput('');
    setEditingZoneId(null);
  };

  const resetRateForm = () => {
    setRateData({ ...initialRate });
    setEditingRateId(null);
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!zoneData.zone_name?.trim()) {
      setError('Zone name is required');
      return;
    }

    if (!zoneData.zone_code?.trim()) {
      setError('Zone code is required');
      return;
    }

    if (zoneData.country_codes.length === 0) {
      setError('At least one country code is required');
      return;
    }

    setCreating(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        zone_name: zoneData.zone_name.trim(),
        zone_code: zoneData.zone_code.trim().toUpperCase(),
        country_codes: zoneData.country_codes,
        priority: zoneData.priority,
        estimated_delivery_days_min: zoneData.estimated_delivery_days_min || undefined,
        estimated_delivery_days_max: zoneData.estimated_delivery_days_max || undefined,
        is_active: zoneData.is_active,
        description: zoneData.description?.trim() || undefined,
      };

      if (editingZoneId) {
        await adminShippingService.updateZone(editingZoneId, payload);
      } else {
        await adminShippingService.createZone(payload);
      }

      await loadZones();
      resetZoneForm();
      setActiveTab('zones');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : editingZoneId ? 'Failed to update zone' : 'Failed to create zone';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rateData.shipping_zone_id) {
      setError('Shipping zone is required');
      return;
    }

    if (!rateData.rate_name?.trim()) {
      setError('Rate name is required');
      return;
    }

    setCreating(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        shipping_zone_id: rateData.shipping_zone_id,
        rate_name: rateData.rate_name.trim(),
        calculation_method: rateData.calculation_method,
        flat_rate: rateData.flat_rate || undefined,
        min_weight_kg: rateData.min_weight_kg || undefined,
        max_weight_kg: rateData.max_weight_kg || undefined,
        price_per_kg: rateData.price_per_kg || undefined,
        base_rate: rateData.base_rate || undefined,
        min_order_value: rateData.min_order_value || undefined,
        max_order_value: rateData.max_order_value || undefined,
        shipping_cost: rateData.shipping_cost || undefined,
        free_shipping_threshold: rateData.free_shipping_threshold || undefined,
        carrier_name: rateData.carrier_name?.trim() || undefined,
        carrier_service: rateData.carrier_service?.trim() || undefined,
        delivery_days_min: rateData.delivery_days_min || undefined,
        delivery_days_max: rateData.delivery_days_max || undefined,
        is_active: rateData.is_active,
        description: rateData.description?.trim() || undefined,
      };

      if (editingRateId) {
        await adminShippingService.updateRate(editingRateId, payload);
      } else {
        await adminShippingService.createRate(payload);
      }

      await loadRates();
      resetRateForm();
      setActiveTab('rates');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : editingRateId ? 'Failed to update rate' : 'Failed to create rate';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEditZone = (zone: ShippingZoneDto) => {
    setEditingZoneId(zone.id);
    setZoneData({
      zone_name: zone.zone_name,
      zone_code: zone.zone_code,
      country_codes: zone.country_codes,
      priority: zone.priority,
      estimated_delivery_days_min: zone.estimated_delivery_days_min,
      estimated_delivery_days_max: zone.estimated_delivery_days_max,
      is_active: zone.is_active,
      description: zone.description,
    });
    setCountryCodesInput(zone.country_codes.join(', '));
    setActiveTab('create-zone');
  };

  const handleEditRate = (rate: ShippingRateDto) => {
    setEditingRateId(rate.id);
    setRateData({
      shipping_zone_id: rate.shipping_zone_id,
      rate_name: rate.rate_name,
      calculation_method: rate.calculation_method as any,
      flat_rate: rate.flat_rate,
      min_weight_kg: rate.min_weight_kg,
      max_weight_kg: rate.max_weight_kg,
      price_per_kg: rate.price_per_kg,
      base_rate: rate.base_rate,
      min_order_value: rate.min_order_value,
      max_order_value: rate.max_order_value,
      shipping_cost: rate.shipping_cost,
      free_shipping_threshold: rate.free_shipping_threshold,
      carrier_name: rate.carrier_name,
      carrier_service: rate.carrier_service,
      delivery_days_min: rate.delivery_days_min,
      delivery_days_max: rate.delivery_days_max,
      is_active: rate.is_active,
      description: rate.description,
    });
    setActiveTab('create-rate');
  };

  const handleDeleteZone = useCallback(async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Shipping Zone',
      message: 'Are you sure you want to delete this shipping zone?',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    setError(null);
    try {
      await adminShippingService.deleteZone(id);
      setZones(prev => prev.filter(z => z.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete zone';
      setError(msg);
    }
  }, [confirm]);

  const handleDeleteRate = useCallback(async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Shipping Rate',
      message: 'Are you sure you want to delete this shipping rate?',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    setError(null);
    try {
      await adminShippingService.deleteRate(id);
      setRates(prev => prev.filter(r => r.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete rate';
      setError(msg);
    }
  }, [confirm]);

  const parseCountryCodes = (input: string) => {
    const codes = input
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(c => c.length > 0);
    setCountryCodesInput(input);
    setZoneData({ ...zoneData, country_codes: codes });
  };

  const formatCurrency = (amount?: number): string => {
    if (amount == null) return '—';
    return `€${amount.toFixed(2)}`;
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'zones' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('zones');
          resetZoneForm();
        }}
        aria-label="Shipping zones"
      >
        <Globe size={16} />
        Shipping Zones
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'rates' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('rates');
          resetRateForm();
        }}
        aria-label="Shipping rates"
      >
        <Package size={16} />
        Shipping Rates
      </button>
      {activeTab === 'create-zone' && (
        <button className="dashboard-tab active" aria-label="Create zone">
          <Plus size={16} />
          {editingZoneId ? 'Edit Zone' : 'Create Zone'}
        </button>
      )}
      {activeTab === 'create-rate' && (
        <button className="dashboard-tab active" aria-label="Create rate">
          <Plus size={16} />
          {editingRateId ? 'Edit Rate' : 'Create Rate'}
        </button>
      )}
    </nav>
  );

  return (
    <AdminLayout title="Shipping Configuration" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Shipping Zones Tab */}
          {activeTab === 'zones' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <Button variant="primary" onClick={() => setActiveTab('create-zone')}>
                  <Plus size={16} /> Create New Zone
                </Button>
              </div>

              <div className="mobile-table-cards">
                {loading ? (
                  <div className="mobile-table-card">
                    <SkeletonTable rows={5} columns={4} />
                  </div>
                ) : zones.length === 0 ? (
                  <div className="mobile-table-card">
                    <div className="table-empty">No shipping zones found.</div>
                  </div>
                ) : (
                  zones.map(zone => (
                    <div key={`mobile-zone-${zone.id}`} className="mobile-table-card">
                      <div className="mobile-card-header">
                        <div>
                          <h4 className="mobile-card-title">{zone.zone_name}</h4>
                          <p className="mobile-card-subtitle">{zone.zone_code}</p>
                        </div>
                        <div className="mobile-card-actions">
                          <Button variant="outline" size="sm" onClick={() => handleEditZone(zone)} title="Edit">
                            <Edit size={14} />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteZone(zone.id)} title="Delete">
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-field">
                          <span className="mobile-field-label">Countries:</span>
                          <span className="mobile-field-value">{zone.country_codes.join(', ')}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Priority:</span>
                          <span className="mobile-field-value">{zone.priority}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Status:</span>
                          <span className="mobile-field-value">
                            <Badge variant={zone.is_active ? 'success' : 'default'} size="sm">
                              {zone.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Zone Name</th>
                      <th>Code</th>
                      <th>Country Codes</th>
                      <th>Priority</th>
                      <th>Delivery Days</th>
                      <th>Status</th>
                      <th style={{ width: 120 }} className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="table-empty">
                        <SkeletonTable rows={5} columns={7} />
                      </td></tr>
                    ) : zones.length === 0 ? (
                      <tr><td colSpan={7} className="table-empty">No shipping zones found.</td></tr>
                    ) : (
                      zones.map(zone => (
                        <tr key={zone.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{zone.zone_name}</div>
                            {zone.description && (
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{zone.description}</div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>{zone.zone_code}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px' }}>
                              {zone.country_codes.slice(0, 5).map(code => (
                                <Badge key={code} variant="info" size="sm" style={{ marginRight: '4px' }}>
                                  {code}
                                </Badge>
                              ))}
                              {zone.country_codes.length > 5 && (
                                <span style={{ color: '#6b7280' }}>+{zone.country_codes.length - 5} more</span>
                              )}
                            </div>
                          </td>
                          <td>{zone.priority}</td>
                          <td>
                            {zone.estimated_delivery_days_min && zone.estimated_delivery_days_max ? (
                              `${zone.estimated_delivery_days_min}-${zone.estimated_delivery_days_max} days`
                            ) : '—'}
                          </td>
                          <td>
                            <Badge variant={zone.is_active ? 'success' : 'default'} size="sm">
                              {zone.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <Button variant="outline" size="sm" onClick={() => handleEditZone(zone)} title="Edit">
                                <Edit size={14} />
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDeleteZone(zone.id)} title="Delete">
                                <X size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Create/Edit Zone Tab */}
          {activeTab === 'create-zone' && (
            <div className="admin-card">
              <h3 className="section-title">{editingZoneId ? 'Edit Shipping Zone' : 'Create New Shipping Zone'}</h3>
              <form onSubmit={handleCreateZone} className="form-grid">
                <div>
                  <label className="form-label">Zone Name *</label>
                  <input
                    className="form-input"
                    value={zoneData.zone_name}
                    onChange={(e) => setZoneData({ ...zoneData, zone_name: e.target.value })}
                    placeholder="e.g., Europe"
                    required
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="form-label">Zone Code *</label>
                  <input
                    className="form-input"
                    value={zoneData.zone_code}
                    onChange={(e) => setZoneData({ ...zoneData, zone_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., EU"
                    required
                    maxLength={20}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Country Codes * (comma-separated)</label>
                  <input
                    className="form-input"
                    value={countryCodesInput}
                    onChange={(e) => parseCountryCodes(e.target.value)}
                    placeholder="e.g., SK, CZ, PL, HU"
                    required
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {zoneData.country_codes.length > 0 && (
                      <>Parsed: {zoneData.country_codes.join(', ')}</>
                    )}
                  </div>
                </div>
                <div>
                  <label className="form-label">Priority *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={zoneData.priority}
                    onChange={(e) => setZoneData({ ...zoneData, priority: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Min Delivery Days</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={zoneData.estimated_delivery_days_min || ''}
                    onChange={(e) => setZoneData({ ...zoneData, estimated_delivery_days_min: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="form-label">Max Delivery Days</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={zoneData.estimated_delivery_days_max || ''}
                    onChange={(e) => setZoneData({ ...zoneData, estimated_delivery_days_max: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={zoneData.description || ''}
                    onChange={(e) => setZoneData({ ...zoneData, description: e.target.value })}
                    placeholder="Optional description..."
                  />
                </div>
                <div>
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={zoneData.is_active}
                      onChange={(e) => setZoneData({ ...zoneData, is_active: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    Active
                  </label>
                </div>
                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                  <Button variant="primary" type="submit" disabled={creating} loading={creating}>
                    {editingZoneId ? 'Update Zone' : 'Create Zone'}
                  </Button>
                  <Button variant="outline" type="button" onClick={() => { resetZoneForm(); setActiveTab('zones'); }} disabled={creating}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Shipping Rates Tab */}
          {activeTab === 'rates' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <Button variant="primary" onClick={() => setActiveTab('create-rate')}>
                  <Plus size={16} /> Create New Rate
                </Button>
              </div>

              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Rate Name</th>
                      <th>Zone</th>
                      <th>Method</th>
                      <th>Cost</th>
                      <th>Carrier</th>
                      <th>Delivery Days</th>
                      <th>Status</th>
                      <th style={{ width: 120 }} className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="table-empty">
                        <SkeletonTable rows={5} columns={8} />
                      </td></tr>
                    ) : rates.length === 0 ? (
                      <tr><td colSpan={8} className="table-empty">No shipping rates found.</td></tr>
                    ) : (
                      rates.map(rate => (
                        <tr key={rate.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{rate.rate_name}</div>
                            {rate.description && (
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{rate.description}</div>
                            )}
                          </td>
                          <td>{rate.shipping_zone_name || `Zone #${rate.shipping_zone_id}`}</td>
                          <td>
                            <Badge variant="info" size="sm">{rate.calculation_method}</Badge>
                          </td>
                          <td>
                            {rate.flat_rate ? formatCurrency(rate.flat_rate) :
                             rate.shipping_cost ? formatCurrency(rate.shipping_cost) :
                             rate.price_per_kg ? `${formatCurrency(rate.price_per_kg)}/kg` :
                             'Variable'}
                          </td>
                          <td>
                            {rate.carrier_name && (
                              <>
                                <Truck size={14} style={{ marginRight: 4, verticalAlign: 'middle', color: '#6b7280' }} />
                                {rate.carrier_name}
                                {rate.carrier_service && <div style={{ fontSize: '11px', color: '#6b7280' }}>{rate.carrier_service}</div>}
                              </>
                            )}
                            {!rate.carrier_name && '—'}
                          </td>
                          <td>
                            {rate.delivery_days_min && rate.delivery_days_max ? (
                              `${rate.delivery_days_min}-${rate.delivery_days_max} days`
                            ) : '—'}
                          </td>
                          <td>
                            <Badge variant={rate.is_active ? 'success' : 'default'} size="sm">
                              {rate.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <Button variant="outline" size="sm" onClick={() => handleEditRate(rate)} title="Edit">
                                <Edit size={14} />
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDeleteRate(rate.id)} title="Delete">
                                <X size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Create/Edit Rate Tab */}
          {activeTab === 'create-rate' && (
            <div className="admin-card">
              <h3 className="section-title">{editingRateId ? 'Edit Shipping Rate' : 'Create New Shipping Rate'}</h3>
              <form onSubmit={handleCreateRate} className="form-grid">
                <div>
                  <label className="form-label">Shipping Zone *</label>
                  <select
                    className="form-input"
                    value={rateData.shipping_zone_id || ''}
                    onChange={(e) => setRateData({ ...rateData, shipping_zone_id: Number(e.target.value) })}
                    required
                  >
                    <option value="">Select Zone</option>
                    {zones.filter(z => z.is_active).map(z => (
                      <option key={z.id} value={z.id}>{z.zone_name} ({z.zone_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Rate Name *</label>
                  <input
                    className="form-input"
                    value={rateData.rate_name}
                    onChange={(e) => setRateData({ ...rateData, rate_name: e.target.value })}
                    placeholder="e.g., Standard Shipping"
                    required
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="form-label">Calculation Method *</label>
                  <select
                    className="form-input"
                    value={rateData.calculation_method}
                    onChange={(e) => setRateData({ ...rateData, calculation_method: e.target.value as any })}
                    required
                  >
                    <option value="FLAT_RATE">Flat Rate</option>
                    <option value="WEIGHT_BASED">Weight Based</option>
                    <option value="PRICE_BASED">Price Based</option>
                    <option value="FREE">Free Shipping</option>
                  </select>
                </div>

                {/* Conditional fields based on calculation method */}
                {rateData.calculation_method === 'FLAT_RATE' && (
                  <div>
                    <label className="form-label">Flat Rate (€) *</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={rateData.flat_rate || ''}
                      onChange={(e) => setRateData({ ...rateData, flat_rate: e.target.value ? Number(e.target.value) : undefined })}
                      required
                    />
                  </div>
                )}

                {rateData.calculation_method === 'WEIGHT_BASED' && (
                  <>
                    <div>
                      <label className="form-label">Min Weight (kg)</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={rateData.min_weight_kg || ''}
                        onChange={(e) => setRateData({ ...rateData, min_weight_kg: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Max Weight (kg)</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={rateData.max_weight_kg || ''}
                        onChange={(e) => setRateData({ ...rateData, max_weight_kg: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Price per kg (€) *</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={rateData.price_per_kg || ''}
                        onChange={(e) => setRateData({ ...rateData, price_per_kg: e.target.value ? Number(e.target.value) : undefined })}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Base Rate (€)</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={rateData.base_rate || ''}
                        onChange={(e) => setRateData({ ...rateData, base_rate: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                  </>
                )}

                {rateData.calculation_method === 'PRICE_BASED' && (
                  <>
                    <div>
                      <label className="form-label">Min Order Value (€)</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={rateData.min_order_value || ''}
                        onChange={(e) => setRateData({ ...rateData, min_order_value: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Max Order Value (€)</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={rateData.max_order_value || ''}
                        onChange={(e) => setRateData({ ...rateData, max_order_value: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Shipping Cost (€) *</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={rateData.shipping_cost || ''}
                        onChange={(e) => setRateData({ ...rateData, shipping_cost: e.target.value ? Number(e.target.value) : undefined })}
                        required
                      />
                    </div>
                  </>
                )}

                {rateData.calculation_method === 'FREE' && (
                  <div>
                    <label className="form-label">Free Shipping Threshold (€)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={rateData.free_shipping_threshold || ''}
                      onChange={(e) => setRateData({ ...rateData, free_shipping_threshold: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                )}

                <div>
                  <label className="form-label">Carrier Name</label>
                  <input
                    className="form-input"
                    value={rateData.carrier_name || ''}
                    onChange={(e) => setRateData({ ...rateData, carrier_name: e.target.value })}
                    placeholder="e.g., DHL"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="form-label">Carrier Service</label>
                  <input
                    className="form-input"
                    value={rateData.carrier_service || ''}
                    onChange={(e) => setRateData({ ...rateData, carrier_service: e.target.value })}
                    placeholder="e.g., Express"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="form-label">Min Delivery Days</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={rateData.delivery_days_min || ''}
                    onChange={(e) => setRateData({ ...rateData, delivery_days_min: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="form-label">Max Delivery Days</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={rateData.delivery_days_max || ''}
                    onChange={(e) => setRateData({ ...rateData, delivery_days_max: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={rateData.description || ''}
                    onChange={(e) => setRateData({ ...rateData, description: e.target.value })}
                    placeholder="Optional description..."
                  />
                </div>
                <div>
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={rateData.is_active}
                      onChange={(e) => setRateData({ ...rateData, is_active: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    Active
                  </label>
                </div>
                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                  <Button variant="primary" type="submit" disabled={creating} loading={creating}>
                    {editingRateId ? 'Update Rate' : 'Create Rate'}
                  </Button>
                  <Button variant="outline" type="button" onClick={() => { resetRateForm(); setActiveTab('rates'); }} disabled={creating}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          <ConfirmDialog {...dialogProps} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminShippingZones;
