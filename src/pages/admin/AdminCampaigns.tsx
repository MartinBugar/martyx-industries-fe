import React, { useEffect, useState } from 'react';
import { Mail, Send, Clock, TrendingUp, Users, BarChart3, Plus } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button, Badge } from '../../components/ui';
import {
  adminCampaignsService,
  type EmailCampaign,
  type CampaignPerformance,
  type CustomerSegment,
  type CreateCampaignRequest
} from '../../services/adminCampaignsService';
import './AdminCampaigns.css';

const AdminCampaigns: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'campaigns' | 'create' | 'analytics'>('campaigns');

  // Data state
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Form state for creating campaign
  const [formData, setFormData] = useState<CreateCampaignRequest>({
    campaignName: '',
    campaignCode: '',
    subjectLine: '',
    campaignType: 'NEWSLETTER',
    fromEmail: '',
    fromName: 'Martyx Industries',
  });

  // Load campaigns
  const loadCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminCampaignsService.getCampaigns();
      setCampaigns(response || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e : new Error('Failed to load campaigns'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load segments
  const loadSegments = async () => {
    try {
      const response = await adminCampaignsService.getSegments();
      setSegments(response || []);
    } catch (e: unknown) {
      console.error('Failed to load segments:', e);
    }
  };

  // Load campaign performance
  const loadPerformance = async (campaignId: number) => {
    try {
      const performance = await adminCampaignsService.getCampaignPerformance(campaignId);
      setCampaignPerformance(performance);
    } catch (e: unknown) {
      console.error('Failed to load performance:', e);
    }
  };

  // Create campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await adminCampaignsService.createCampaign(formData);
      alert('Campaign created successfully!');
      setFormData({
        campaignName: '',
        campaignCode: '',
        subjectLine: '',
        campaignType: 'NEWSLETTER',
        fromEmail: '',
        fromName: 'Martyx Industries',
      });
      await loadCampaigns();
      setActiveTab('campaigns');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  // Send campaign
  const handleSendCampaign = async (campaignId: number) => {
    if (!window.confirm('Are you sure you want to send this campaign now?')) return;

    try {
      await adminCampaignsService.sendCampaign(campaignId);
      alert('Campaign sent successfully!');
      await loadCampaigns();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to send campaign');
    }
  };

  // Load data on mount
  useEffect(() => {
    loadCampaigns();
    loadSegments();
  }, []);

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  // Get campaign status badge variant
  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'SENT': return 'success';
      case 'SENDING': return 'warning';
      case 'SCHEDULED': return 'default';
      case 'DRAFT': return 'default';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  // Navigation tabs
  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'campaigns' ? 'active' : ''}`}
        onClick={() => setActiveTab('campaigns')}
        aria-label="View all campaigns"
      >
        <Mail size={16} />
        All Campaigns
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'create' ? 'active' : ''}`}
        onClick={() => setActiveTab('create')}
        aria-label="Create new campaign"
      >
        <Plus size={16} />
        Create New
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => setActiveTab('analytics')}
        aria-label="View analytics"
      >
        <BarChart3 size={16} />
        Analytics
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Email Campaigns" navTabs={navTabs}>
      <div className="admin-campaigns">

        {/* ALL CAMPAIGNS TAB */}
        {activeTab === 'campaigns' && (
          <div className="campaigns-list">
            {isLoading ? (
              <div className="loading">Loading campaigns...</div>
            ) : error ? (
              <div className="error">Error: {error.message}</div>
            ) : campaigns.length === 0 ? (
              <div className="empty-state">
                <Mail size={48} />
                <h3>No campaigns yet</h3>
                <p>Create your first email campaign to get started</p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus size={16} />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="campaigns-grid">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="campaign-card">
                    <div className="campaign-header">
                      <h3>{campaign.campaignName}</h3>
                      <Badge variant={getStatusVariant(campaign.campaignStatus)}>
                        {campaign.campaignStatus}
                      </Badge>
                    </div>

                    <div className="campaign-meta">
                      <div className="meta-item">
                        <Mail size={14} />
                        <span>{campaign.subjectLine}</span>
                      </div>
                      <div className="meta-item">
                        <Users size={14} />
                        <span>{campaign.segmentName || 'All users'}</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>{formatDate(campaign.sentAt || campaign.scheduledAt)}</span>
                      </div>
                    </div>

                    {campaign.campaignStatus === 'SENT' && (
                      <div className="campaign-stats">
                        <div className="stat">
                          <span className="stat-label">Sent</span>
                          <span className="stat-value">{campaign.totalSent}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Opened</span>
                          <span className="stat-value">
                            {campaign.openRate ? `${campaign.openRate.toFixed(1)}%` : '—'}
                          </span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Clicked</span>
                          <span className="stat-value">
                            {campaign.clickRate ? `${campaign.clickRate.toFixed(1)}%` : '—'}
                          </span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Revenue</span>
                          <span className="stat-value">
                            {campaign.revenueGenerated ? `€${campaign.revenueGenerated.toFixed(2)}` : '—'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="campaign-actions">
                      {campaign.campaignStatus === 'DRAFT' && (
                        <Button
                          size="sm"
                          onClick={() => handleSendCampaign(campaign.id)}
                        >
                          <Send size={14} />
                          Send Now
                        </Button>
                      )}
                      {campaign.campaignStatus === 'SENT' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            loadPerformance(campaign.id);
                            setActiveTab('analytics');
                          }}
                        >
                          <TrendingUp size={14} />
                          View Analytics
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE CAMPAIGN TAB */}
        {activeTab === 'create' && (
          <div className="create-campaign">
            <form onSubmit={handleCreateCampaign} className="campaign-form">
              <h2>Create New Campaign</h2>

              <div className="form-group">
                <label htmlFor="campaignName">Campaign Name *</label>
                <input
                  type="text"
                  id="campaignName"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  placeholder="e.g., Summer Sale 2025"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="campaignCode">Campaign Code *</label>
                <input
                  type="text"
                  id="campaignCode"
                  value={formData.campaignCode}
                  onChange={(e) => setFormData({ ...formData, campaignCode: e.target.value })}
                  placeholder="e.g., SUMMER2025"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subjectLine">Email Subject *</label>
                <input
                  type="text"
                  id="subjectLine"
                  value={formData.subjectLine}
                  onChange={(e) => setFormData({ ...formData, subjectLine: e.target.value })}
                  placeholder="e.g., 🔥 Summer Sale - Up to 50% Off!"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="campaignType">Campaign Type *</label>
                <select
                  id="campaignType"
                  value={formData.campaignType}
                  onChange={(e) => setFormData({ ...formData, campaignType: e.target.value as any })}
                  required
                >
                  <option value="NEWSLETTER">Newsletter</option>
                  <option value="PROMOTIONAL">Promotional</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="SEASONAL">Seasonal</option>
                  <option value="TRANSACTIONAL">Transactional</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="segmentId">Target Segment</label>
                <select
                  id="segmentId"
                  value={formData.segmentId || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    segmentId: e.target.value ? Number(e.target.value) : undefined
                  })}
                >
                  <option value="">All users</option>
                  {segments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.segmentName} ({segment.memberCount} members)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="fromName">From Name</label>
                <input
                  type="text"
                  id="fromName"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  placeholder="Martyx Industries"
                />
              </div>

              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => setActiveTab('campaigns')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="campaign-analytics">
            {selectedCampaign && campaignPerformance ? (
              <>
                <div className="analytics-header">
                  <h2>{selectedCampaign.campaignName}</h2>
                  <Badge variant={getStatusVariant(selectedCampaign.campaignStatus)}>
                    {selectedCampaign.campaignStatus}
                  </Badge>
                </div>

                <div className="analytics-grid">
                  <div className="analytics-card">
                    <div className="analytics-label">Sent</div>
                    <div className="analytics-value">{campaignPerformance.sentCount.toLocaleString()}</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Delivered</div>
                    <div className="analytics-value">{campaignPerformance.deliveredCount.toLocaleString()}</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Open Rate</div>
                    <div className="analytics-value">{campaignPerformance.openRate.toFixed(1)}%</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Click Rate</div>
                    <div className="analytics-value">{campaignPerformance.clickRate.toFixed(1)}%</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Bounce Rate</div>
                    <div className="analytics-value">{campaignPerformance.bounceRate.toFixed(1)}%</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Conversions</div>
                    <div className="analytics-value">{campaignPerformance.conversionCount}</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Total Revenue</div>
                    <div className="analytics-value">€{campaignPerformance.totalRevenue.toFixed(2)}</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Revenue/Email</div>
                    <div className="analytics-value">€{campaignPerformance.revenuePerEmail.toFixed(2)}</div>
                  </div>
                </div>

                <Button variant="outline" onClick={() => {
                  setSelectedCampaign(null);
                  setCampaignPerformance(null);
                  setActiveTab('campaigns');
                }}>
                  Back to Campaigns
                </Button>
              </>
            ) : (
              <div className="empty-state">
                <BarChart3 size={48} />
                <h3>No campaign selected</h3>
                <p>Select a sent campaign to view analytics</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCampaigns;
