import { apiClient } from './apiClient';

const ADMIN_API_BASE = '/api/admin';

// =========================================================================
// TYPE DEFINITIONS
// =========================================================================

export interface EmailCampaign {
  id: number;
  campaignName: string;
  campaignCode: string;
  subjectLine: string;
  campaignType: 'NEWSLETTER' | 'PROMOTIONAL' | 'TRANSACTIONAL' | 'ANNOUNCEMENT' | 'SEASONAL';
  campaignStatus: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';
  fromEmail?: string;
  fromName?: string;
  segmentId?: number;
  segmentName?: string;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  totalConversions: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  revenueGenerated?: number;
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CampaignPerformance {
  campaignId: number;
  campaignName: string;
  campaignType: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  conversionCount: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  conversionRate: number;
  totalRevenue: number;
  revenuePerEmail: number;
  sentAt?: string;
}

export interface CustomerSegment {
  id: number;
  segmentName: string;
  segmentCode: string;
  description?: string;
  memberCount: number;
  createdAt: string;
}

export interface CreateCampaignRequest {
  campaignName: string;
  campaignCode: string;
  subjectLine: string;
  campaignType: 'NEWSLETTER' | 'PROMOTIONAL' | 'TRANSACTIONAL' | 'ANNOUNCEMENT' | 'SEASONAL';
  fromEmail?: string;
  fromName?: string;
  segmentId?: number;
  createdBy?: string;
}

export interface SendCampaignRequest {
  campaignId: number;
}

export interface ScheduleCampaignRequest {
  campaignId: number;
  scheduledAt: string; // ISO datetime
}

// =========================================================================
// CAMPAIGNS SERVICE
// =========================================================================

class AdminCampaignsService {
  private baseUrl = `${ADMIN_API_BASE}/campaigns`;

  /**
   * Get all campaigns with pagination
   */
  async getCampaigns(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);

    const url = `${this.baseUrl}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get<{ success: boolean; data: EmailCampaign[] }>(url);
    return response.data;
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: number) {
    const url = `${this.baseUrl}/${campaignId}`;
    const response = await apiClient.get<{ success: boolean; data: EmailCampaign }>(url);
    return response.data;
  }

  /**
   * Create new campaign
   */
  async createCampaign(request: CreateCampaignRequest) {
    const response = await apiClient.post<{ success: boolean; data: EmailCampaign }>(this.baseUrl, request);
    return response.data;
  }

  /**
   * Send campaign immediately
   */
  async sendCampaign(campaignId: number) {
    const url = `${this.baseUrl}/${campaignId}/send`;
    const response = await apiClient.post<{ success: boolean; message: string }>(url, {});
    return response;
  }

  /**
   * Schedule campaign for later
   */
  async scheduleCampaign(campaignId: number, scheduledAt: string) {
    const url = `${this.baseUrl}/${campaignId}/schedule`;
    const response = await apiClient.post<{ success: boolean; data: EmailCampaign }>(url, { scheduledAt });
    return response.data;
  }

  /**
   * Get campaign performance/analytics
   */
  async getCampaignPerformance(campaignId: number) {
    const url = `${this.baseUrl}/${campaignId}/performance`;
    const response = await apiClient.get<{ success: boolean; data: CampaignPerformance }>(url);
    return response.data;
  }

  /**
   * Archive (cancel) campaign
   */
  async archiveCampaign(campaignId: number) {
    const url = `${this.baseUrl}/${campaignId}/archive`;
    const response = await apiClient.post<{ success: boolean; message: string }>(url, {});
    return response;
  }

  /**
   * Get all customer segments
   */
  async getSegments() {
    const url = `${ADMIN_API_BASE}/segments`;
    const response = await apiClient.get<{ success: boolean; data: CustomerSegment[] }>(url);
    return response.data;
  }

  /**
   * Get top performing campaigns
   */
  async getTopCampaigns(limit: number = 5) {
    const url = `${this.baseUrl}/top?limit=${limit}`;
    const response = await apiClient.get<{ success: boolean; data: EmailCampaign[] }>(url);
    return response.data;
  }
}

export const adminCampaignsService = new AdminCampaignsService();
