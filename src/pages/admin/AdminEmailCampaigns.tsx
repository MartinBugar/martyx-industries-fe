import React, { useEffect, useState } from 'react';
import { Mail, Plus, X, Eye, Send, Calendar, Archive, BarChart2, TrendingUp, Users, MousePointer } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css';
import './AdminButtonOverrides.css';
import { adminCampaignsService, type EmailCampaign, type CampaignPerformance, type CustomerSegment, type CreateCampaignRequest } from '../../services/adminCampaignsService';
import { Badge, Button, SkeletonTable } from '../../components/ui';

type TabType = 'all-campaigns' | 'create-campaign' | 'campaign-details';

const initialCreate: CreateCampaignRequest = {
  campaignName: '',
  campaignCode: '',
  subjectLine: '',
  campaignType: 'NEWSLETTER',
  fromEmail: '',
  fromName: '',
};

const AdminEmailCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<TabType>('all-campaigns');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  // Create/Edit form state
  const [createData, setCreateData] = useState<CreateCampaignRequest>({ ...initialCreate });
  const [creating, setCreating] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Campaign details state
  const [viewingCampaign, setViewingCampaign] = useState<CampaignPerformance | null>(null);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminCampaignsService.getCampaigns({
        page: 0,
        limit: 100,
        status: filterStatus || undefined,
        type: filterType || undefined
      });
      setCampaigns(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load campaigns';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadSegments = async () => {
    try {
      const data = await adminCampaignsService.getSegments();
      setSegments(data);
    } catch (e) {
      console.error('Failed to load segments', e);
    }
  };

  useEffect(() => {
    loadCampaigns();
    loadSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterType]);

  const resetCreate = () => {
    setCreateData({ ...initialCreate });
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!createData.campaignName?.trim()) {
      setError('Campaign name is required');
      return;
    }

    if (!createData.campaignCode?.trim()) {
      setError('Campaign code is required');
      return;
    }

    if (!createData.subjectLine?.trim()) {
      setError('Subject line is required');
      return;
    }

    setCreating(true);
    try {
      const payload: CreateCampaignRequest = {
        ...createData,
        campaignName: createData.campaignName.trim(),
        campaignCode: createData.campaignCode.trim().toUpperCase(),
        subjectLine: createData.subjectLine.trim(),
        fromEmail: createData.fromEmail?.trim() || undefined,
        fromName: createData.fromName?.trim() || undefined,
      };

      if (editingId) {
        await adminCampaignsService.updateCampaign(editingId, payload);
      } else {
        await adminCampaignsService.createCampaign(payload);
      }

      await loadCampaigns();
      resetCreate();
      setActiveTab('all-campaigns');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : editingId ? 'Failed to update campaign' : 'Failed to create campaign';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetails = async (campaignId: number) => {
    try {
      const performance = await adminCampaignsService.getCampaignPerformance(campaignId);
      setViewingCampaign(performance);
      setActiveTab('campaign-details');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load campaign details';
      setError(msg);
    }
  };

  const handleSendNow = async (campaignId: number) => {
    if (!window.confirm('Are you sure you want to send this campaign immediately?')) return;
    setError(null);
    try {
      await adminCampaignsService.sendCampaign(campaignId);
      await loadCampaigns();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send campaign';
      setError(msg);
    }
  };

  const handleArchive = async (campaignId: number) => {
    if (!window.confirm('Are you sure you want to archive this campaign?')) return;
    setError(null);
    try {
      await adminCampaignsService.archiveCampaign(campaignId);
      await loadCampaigns();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to archive campaign';
      setError(msg);
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPercent = (value?: number): string => {
    if (value == null) return '—';
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value?: number): string => {
    if (value == null) return '0';
    return value.toLocaleString('sk-SK');
  };

  const formatCurrency = (value?: number): string => {
    if (value == null) return '€0.00';
    return `€${value.toFixed(2)}`;
  };

  const getStatusBadge = (status: string): React.ReactNode => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      DRAFT: 'default',
      SCHEDULED: 'info',
      SENDING: 'warning',
      SENT: 'success',
      CANCELLED: 'danger',
    };
    return <Badge variant={variants[status] || 'default'} size="sm">{status}</Badge>;
  };

  const getTypeBadge = (type: string): React.ReactNode => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
      NEWSLETTER: 'info',
      PROMOTIONAL: 'warning',
      TRANSACTIONAL: 'default',
      ANNOUNCEMENT: 'success',
      SEASONAL: 'warning',
    };
    return <Badge variant={variants[type] || 'default'} size="sm">{type}</Badge>;
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'all-campaigns' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('all-campaigns');
          setViewingCampaign(null);
          resetCreate();
        }}
        aria-label="View all campaigns"
      >
        <Mail size={16} />
        All Campaigns
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'create-campaign' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('create-campaign');
          if (!editingId) resetCreate();
        }}
        aria-label="Create new campaign"
      >
        <Plus size={16} />
        {editingId ? 'Edit Campaign' : 'Create New'}
      </button>
      {viewingCampaign && (
        <button
          className={`dashboard-tab ${activeTab === 'campaign-details' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaign-details')}
          aria-label="View campaign details"
        >
          <BarChart2 size={16} />
          Campaign Details
        </button>
      )}
    </nav>
  );

  return (
    <AdminLayout title="Email Campaigns" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Create/Edit Campaign Tab */}
          {activeTab === 'create-campaign' && (
            <div className="admin-card">
              <h3 className="section-title">{editingId ? 'Edit Campaign' : 'Create New Campaign'}</h3>
              <form onSubmit={handleCreate} className="form-grid">
                <div>
                  <label className="form-label">Campaign Name *</label>
                  <input
                    className="form-input"
                    value={createData.campaignName}
                    onChange={(e) => setCreateData({ ...createData, campaignName: e.target.value })}
                    placeholder="e.g., Spring Sale 2025"
                    required
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="form-label">Campaign Code *</label>
                  <input
                    className="form-input"
                    value={createData.campaignCode}
                    onChange={(e) => setCreateData({ ...createData, campaignCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., SPRING2025"
                    required
                    maxLength={50}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Subject Line *</label>
                  <input
                    className="form-input"
                    value={createData.subjectLine}
                    onChange={(e) => setCreateData({ ...createData, subjectLine: e.target.value })}
                    placeholder="e.g., 🌸 Spring Sale - Up to 50% Off!"
                    required
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="form-label">Campaign Type *</label>
                  <select
                    className="form-input"
                    value={createData.campaignType}
                    onChange={(e) => setCreateData({ ...createData, campaignType: e.target.value as any })}
                    required
                  >
                    <option value="NEWSLETTER">Newsletter</option>
                    <option value="PROMOTIONAL">Promotional</option>
                    <option value="TRANSACTIONAL">Transactional</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="SEASONAL">Seasonal</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Customer Segment</label>
                  <select
                    className="form-input"
                    value={createData.segmentId || ''}
                    onChange={(e) => setCreateData({ ...createData, segmentId: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">All Customers</option>
                    {segments.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.segmentName} ({s.memberCount} members)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">From Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={createData.fromEmail || ''}
                    onChange={(e) => setCreateData({ ...createData, fromEmail: e.target.value })}
                    placeholder="noreply@example.com"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="form-label">From Name</label>
                  <input
                    className="form-input"
                    value={createData.fromName || ''}
                    onChange={(e) => setCreateData({ ...createData, fromName: e.target.value })}
                    placeholder="Your Company"
                    maxLength={100}
                  />
                </div>

                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                  <Button variant="primary" type="submit" disabled={creating} loading={creating}>
                    {editingId ? 'Update Campaign' : 'Create Campaign (Draft)'}
                  </Button>
                  <Button variant="outline" type="button" onClick={resetCreate} disabled={creating}>
                    {editingId ? 'Cancel' : 'Clear'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* All Campaigns Tab */}
          {activeTab === 'all-campaigns' && (
            <>
              <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select
                  className="form-input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ maxWidth: '200px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="SENDING">Sending</option>
                  <option value="SENT">Sent</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <select
                  className="form-input"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{ maxWidth: '200px' }}
                >
                  <option value="">All Types</option>
                  <option value="NEWSLETTER">Newsletter</option>
                  <option value="PROMOTIONAL">Promotional</option>
                  <option value="TRANSACTIONAL">Transactional</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="SEASONAL">Seasonal</option>
                </select>
              </div>

              {/* Mobile Card Layout */}
              <div className="mobile-table-cards">
                {loading ? (
                  <div className="mobile-table-card">
                    <SkeletonTable rows={5} columns={4} />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="mobile-table-card">
                    <div className="table-empty">No campaigns found.</div>
                  </div>
                ) : (
                  campaigns.map(campaign => (
                    <div key={`mobile-${campaign.id}`} className="mobile-table-card">
                      <div className="mobile-card-header">
                        <div>
                          <h4 className="mobile-card-title">{campaign.campaignName}</h4>
                          <p className="mobile-card-subtitle">{campaign.campaignCode}</p>
                        </div>
                        <div className="mobile-card-actions">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(campaign.id)} title="View details">
                            <Eye size={14} />
                          </Button>
                          {campaign.campaignStatus === 'DRAFT' && (
                            <Button variant="success" size="sm" onClick={() => handleSendNow(campaign.id)} title="Send now">
                              <Send size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-field">
                          <span className="mobile-field-label">Type:</span>
                          <span className="mobile-field-value">{getTypeBadge(campaign.campaignType)}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Status:</span>
                          <span className="mobile-field-value">{getStatusBadge(campaign.campaignStatus)}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-field-label">Recipients:</span>
                          <span className="mobile-field-value">{formatNumber(campaign.totalRecipients)}</span>
                        </div>
                        {campaign.openRate != null && (
                          <div className="mobile-field">
                            <span className="mobile-field-label">Open Rate:</span>
                            <span className="mobile-field-value">{formatPercent(campaign.openRate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table Layout */}
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Campaign Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Recipients</th>
                      <th>Open Rate</th>
                      <th>Click Rate</th>
                      <th>Conv. Rate</th>
                      <th>Revenue</th>
                      <th style={{ width: 180 }} className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="table-empty">
                        <SkeletonTable rows={5} columns={9} />
                      </td></tr>
                    ) : campaigns.length === 0 ? (
                      <tr><td colSpan={9} className="table-empty">No campaigns found.</td></tr>
                    ) : (
                      campaigns.map(campaign => (
                        <tr key={campaign.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{campaign.campaignName}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{campaign.campaignCode}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{campaign.subjectLine}</div>
                          </td>
                          <td>{getTypeBadge(campaign.campaignType)}</td>
                          <td>{getStatusBadge(campaign.campaignStatus)}</td>
                          <td>
                            <div>{formatNumber(campaign.totalRecipients)}</div>
                            {campaign.totalSent > 0 && (
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                Sent: {formatNumber(campaign.totalSent)}
                              </div>
                            )}
                          </td>
                          <td>
                            {campaign.openRate != null ? (
                              <>
                                <div style={{ fontWeight: 600 }}>{formatPercent(campaign.openRate)}</div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                  {formatNumber(campaign.totalOpened)} opens
                                </div>
                              </>
                            ) : '—'}
                          </td>
                          <td>
                            {campaign.clickRate != null ? (
                              <>
                                <div style={{ fontWeight: 600 }}>{formatPercent(campaign.clickRate)}</div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                  {formatNumber(campaign.totalClicked)} clicks
                                </div>
                              </>
                            ) : '—'}
                          </td>
                          <td>
                            {campaign.conversionRate != null ? (
                              <Badge variant={campaign.conversionRate >= 5 ? 'success' : campaign.conversionRate >= 2 ? 'warning' : 'default'} size="sm">
                                {formatPercent(campaign.conversionRate)}
                              </Badge>
                            ) : '—'}
                          </td>
                          <td>
                            {campaign.revenueGenerated != null ? (
                              <strong style={{ color: '#059669' }}>{formatCurrency(campaign.revenueGenerated)}</strong>
                            ) : '—'}
                          </td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(campaign.id)} title="View details">
                                <Eye size={14} />
                              </Button>
                              {campaign.campaignStatus === 'DRAFT' && (
                                <Button variant="success" size="sm" onClick={() => handleSendNow(campaign.id)} title="Send now">
                                  <Send size={14} />
                                </Button>
                              )}
                              {campaign.campaignStatus !== 'CANCELLED' && (
                                <Button variant="danger" size="sm" onClick={() => handleArchive(campaign.id)} title="Archive">
                                  <Archive size={14} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && campaigns.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '13px', color: '#6b7280' }}>
                  <strong>Total: {campaigns.length}</strong> campaigns
                </div>
              )}
            </>
          )}

          {/* Campaign Details Tab */}
          {activeTab === 'campaign-details' && viewingCampaign && (
            <div className="admin-card">
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 className="section-title" style={{ margin: 0 }}>{viewingCampaign.campaignName}</h3>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      {getTypeBadge(viewingCampaign.campaignType)}
                      {viewingCampaign.sentAt && (
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          Sent: {formatDate(viewingCampaign.sentAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  marginTop: '24px'
                }}>
                  {/* Sent */}
                  <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Mail size={18} style={{ color: '#3b82f6' }} />
                      <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Sent</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{formatNumber(viewingCampaign.sentCount)}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      Delivered: {formatNumber(viewingCampaign.deliveredCount)}
                    </div>
                  </div>

                  {/* Opened */}
                  <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Eye size={18} style={{ color: '#059669' }} />
                      <div style={{ fontSize: '12px', color: '#059669', textTransform: 'uppercase', fontWeight: 600 }}>Opened</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>{formatNumber(viewingCampaign.openedCount)}</div>
                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                      Rate: {formatPercent(viewingCampaign.openRate)}
                    </div>
                  </div>

                  {/* Clicked */}
                  <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <MousePointer size={18} style={{ color: '#d97706' }} />
                      <div style={{ fontSize: '12px', color: '#d97706', textTransform: 'uppercase', fontWeight: 600 }}>Clicked</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706' }}>{formatNumber(viewingCampaign.clickedCount)}</div>
                    <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px' }}>
                      Rate: {formatPercent(viewingCampaign.clickRate)}
                    </div>
                  </div>

                  {/* Conversions */}
                  <div style={{ padding: '16px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #c084fc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <TrendingUp size={18} style={{ color: '#7c3aed' }} />
                      <div style={{ fontSize: '12px', color: '#7c3aed', textTransform: 'uppercase', fontWeight: 600 }}>Conversions</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#7c3aed' }}>{formatNumber(viewingCampaign.conversionCount)}</div>
                    <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px' }}>
                      Rate: {formatPercent(viewingCampaign.conversionRate)}
                    </div>
                  </div>
                </div>

                {/* Revenue & Negative Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginTop: '16px'
                }}>
                  {/* Revenue */}
                  <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '8px', border: '2px solid #059669' }}>
                    <div style={{ fontSize: '12px', color: '#059669', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>
                      Total Revenue
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669' }}>
                      {formatCurrency(viewingCampaign.totalRevenue)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                      Per Email: {formatCurrency(viewingCampaign.revenuePerEmail)}
                    </div>
                  </div>

                  {/* Negative Metrics */}
                  <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                    <div style={{ fontSize: '12px', color: '#dc2626', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>
                      Issues
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                      <div>
                        <div style={{ color: '#6b7280' }}>Bounced:</div>
                        <div style={{ fontWeight: 600 }}>
                          {formatNumber(viewingCampaign.bouncedCount)} ({formatPercent(viewingCampaign.bounceRate)})
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280' }}>Unsubscribed:</div>
                        <div style={{ fontWeight: 600 }}>
                          {formatNumber(viewingCampaign.unsubscribedCount)} ({formatPercent(viewingCampaign.unsubscribeRate)})
                        </div>
                      </div>
                    </div>
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

export default AdminEmailCampaigns;
