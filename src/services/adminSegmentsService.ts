import { apiClient } from './apiClient';

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

// Internal interface for form data (camelCase)
export interface CreateSegmentRequest {
  segmentName: string;
  segmentCode: string;
  segmentType: 'BEHAVIORAL' | 'DEMOGRAPHIC' | 'VALUE_BASED' | 'RECENCY' | 'ENGAGEMENT';
  description?: string;
  criteria: string; // JSON string
  autoUpdateEnabled?: boolean;
}

// Backend API request format (snake_case)
interface CreateSegmentApiRequest {
  segment_name: string;
  segment_code: string;
  segment_type: string;
  description?: string;
  criteria: string;
  auto_update_enabled?: boolean;
}

// Internal interface for form data (camelCase)
export interface UpdateSegmentRequest {
  segmentName?: string;
  segmentCode?: string;
  segmentType?: 'BEHAVIORAL' | 'DEMOGRAPHIC' | 'VALUE_BASED' | 'RECENCY' | 'ENGAGEMENT';
  description?: string;
  criteria?: string;
  autoUpdateEnabled?: boolean;
  isActive?: boolean;
}

// Backend API request format (snake_case)
interface UpdateSegmentApiRequest {
  segment_name?: string;
  segment_code?: string;
  segment_type?: string;
  description?: string;
  criteria?: string;
  auto_update_enabled?: boolean;
  is_active?: boolean;
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
    // Transform camelCase to snake_case for backend API
    const apiRequest: CreateSegmentApiRequest = {
      segment_name: request.segmentName,
      segment_code: request.segmentCode,
      segment_type: request.segmentType,
      criteria: request.criteria,
      description: request.description,
      auto_update_enabled: request.autoUpdateEnabled,
    };
    const response = await apiClient.post<{ success: boolean; data: CustomerSegment }>(this.baseUrl, apiRequest);
    return response.data;
  }

  /**
   * Update segment
   */
  async updateSegment(segmentId: number, request: UpdateSegmentRequest) {
    // Transform camelCase to snake_case for backend API
    const apiRequest: UpdateSegmentApiRequest = {};
    if (request.segmentName !== undefined) apiRequest.segment_name = request.segmentName;
    if (request.segmentCode !== undefined) apiRequest.segment_code = request.segmentCode;
    if (request.segmentType !== undefined) apiRequest.segment_type = request.segmentType;
    if (request.description !== undefined) apiRequest.description = request.description;
    if (request.criteria !== undefined) apiRequest.criteria = request.criteria;
    if (request.autoUpdateEnabled !== undefined) apiRequest.auto_update_enabled = request.autoUpdateEnabled;
    if (request.isActive !== undefined) apiRequest.is_active = request.isActive;

    const url = `${this.baseUrl}/${segmentId}`;
    const response = await apiClient.put<{ success: boolean; data: CustomerSegment }>(url, apiRequest);
    return response.data;
  }

  /**
   * Delete (soft delete) segment
   */
  async deleteSegment(segmentId: number) {
    const url = `${this.baseUrl}/${segmentId}`;
    const response = await apiClient.delete<{ success: boolean; message: string }>(url);
    return response;
  }

  /**
   * Manually trigger segment recalculation
   */
  async recalculateSegment(segmentId: number) {
    const url = `${this.baseUrl}/${segmentId}/recalculate`;
    const response = await apiClient.post<{ success: boolean; message: string }>(url, {});
    return response;
  }

  /**
   * Recalculate all segments
   */
  async recalculateAllSegments() {
    const url = `${this.baseUrl}/recalculate-all`;
    const response = await apiClient.post<{ success: boolean; message: string }>(url, {});
    return response;
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
    return response;
  }

  /**
   * Remove user from segment
   */
  async removeUserFromSegment(segmentId: number, userId: number) {
    const url = `${this.baseUrl}/${segmentId}/members/${userId}`;
    const response = await apiClient.delete<{ success: boolean; message: string }>(url);
    return response;
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
