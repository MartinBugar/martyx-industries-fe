import apiClient from './api';

const ADMIN_API_BASE = '/api/admin';

// =========================================================================
// TYPE DEFINITIONS
// =========================================================================

export interface CustomerSegment {
  id: number;
  segmentName: string;
  segmentCode: string;
  segmentType: 'BEHAVIORAL' | 'DEMOGRAPHIC' | 'VALUE_BASED' | 'RECENCY' | 'ENGAGEMENT';
  description?: string;
  criteria: string; // JSON string
  isAutomatic: boolean;
  autoUpdateEnabled: boolean;
  memberCount: number;
  isActive: boolean;
  lastCalculatedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSegmentRequest {
  segmentName: string;
  segmentCode: string;
  segmentType: 'BEHAVIORAL' | 'DEMOGRAPHIC' | 'VALUE_BASED' | 'RECENCY' | 'ENGAGEMENT';
  description?: string;
  criteria: string; // JSON string
  autoUpdateEnabled?: boolean;
}

export interface UpdateSegmentRequest {
  segmentName?: string;
  segmentCode?: string;
  segmentType?: 'BEHAVIORAL' | 'DEMOGRAPHIC' | 'VALUE_BASED' | 'RECENCY' | 'ENGAGEMENT';
  description?: string;
  criteria?: string;
  autoUpdateEnabled?: boolean;
  isActive?: boolean;
}

export interface SegmentMember {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  totalOrders: number;
  totalSpent: number;
  customerTier: 'STANDARD' | 'VIP' | 'PLATINUM';
  isVip: boolean;
  lastOrderDate?: string;
  createdAt: string;
}

export interface SegmentCriteria {
  total_orders?: { gte?: number; lte?: number; gt?: number; lt?: number; eq?: number };
  total_spent?: { gte?: number; lte?: number; gt?: number; lt?: number; eq?: number };
  average_order_value?: { gte?: number; lte?: number; gt?: number; lt?: number; eq?: number };
  days_since_last_order?: { gte?: number; lte?: number; gt?: number; lt?: number; eq?: number };
  days_since_registration?: { gte?: number; lte?: number; gt?: number; lt?: number; eq?: number };
}

// =========================================================================
// SEGMENTS SERVICE
// =========================================================================

class AdminSegmentsService {
  private baseUrl = `${ADMIN_API_BASE}/segments`;

  /**
   * Get all customer segments
   */
  async getSegments() {
    const response = await apiClient.get<{ success: boolean; data: CustomerSegment[] }>(this.baseUrl);
    return response.data;
  }

  /**
   * Get segment by ID
   */
  async getSegmentById(segmentId: number) {
    const url = `${this.baseUrl}/${segmentId}`;
    const response = await apiClient.get<{ success: boolean; data: CustomerSegment }>(url);
    return response.data;
  }

  /**
   * Create new segment
   */
  async createSegment(request: CreateSegmentRequest) {
    const response = await apiClient.post<{ success: boolean; data: CustomerSegment }>(this.baseUrl, request);
    return response.data;
  }

  /**
   * Update segment
   */
  async updateSegment(segmentId: number, request: UpdateSegmentRequest) {
    const url = `${this.baseUrl}/${segmentId}`;
    const response = await apiClient.put<{ success: boolean; data: CustomerSegment }>(url, request);
    return response.data;
  }

  /**
   * Delete (soft delete) segment
   */
  async deleteSegment(segmentId: number) {
    const url = `${this.baseUrl}/${segmentId}`;
    const response = await apiClient.delete<{ success: boolean; message: string }>(url);
    return response.data;
  }

  /**
   * Manually trigger segment recalculation
   */
  async recalculateSegment(segmentId: number) {
    const url = `${this.baseUrl}/${segmentId}/recalculate`;
    const response = await apiClient.post<{ success: boolean; message: string }>(url, {});
    return response.data;
  }

  /**
   * Recalculate all segments
   */
  async recalculateAllSegments() {
    const url = `${this.baseUrl}/recalculate-all`;
    const response = await apiClient.post<{ success: boolean; message: string }>(url, {});
    return response.data;
  }

  /**
   * Get members of a segment
   */
  async getSegmentMembers(segmentId: number, page: number = 1, limit: number = 50) {
    const url = `${this.baseUrl}/${segmentId}/members?page=${page}&limit=${limit}`;
    const response = await apiClient.get<{ success: boolean; data: SegmentMember[] }>(url);
    return response.data;
  }

  /**
   * Add user to segment manually
   */
  async addUserToSegment(segmentId: number, userId: number) {
    const url = `${this.baseUrl}/${segmentId}/members/${userId}`;
    const response = await apiClient.post<{ success: boolean; message: string }>(url, {});
    return response.data;
  }

  /**
   * Remove user from segment
   */
  async removeUserFromSegment(segmentId: number, userId: number) {
    const url = `${this.baseUrl}/${segmentId}/members/${userId}`;
    const response = await apiClient.delete<{ success: boolean; message: string }>(url);
    return response.data;
  }

  /**
   * Parse criteria JSON string to object
   */
  parseCriteria(criteriaJson: string): SegmentCriteria {
    try {
      return JSON.parse(criteriaJson);
    } catch {
      return {};
    }
  }

  /**
   * Stringify criteria object to JSON
   */
  stringifyCriteria(criteria: SegmentCriteria): string {
    return JSON.stringify(criteria, null, 2);
  }
}

export const adminSegmentsService = new AdminSegmentsService();
