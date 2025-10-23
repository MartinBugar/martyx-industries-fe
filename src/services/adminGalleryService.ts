import { apiClient } from './apiClient';

// Types for admin gallery management
export interface AdminPhotoInfo {
  id: number;
  productId: string;
  productName: string;
  fileName: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  url: string;
  cdnUrl: string;
  thumbnailUrl: string;
  verificationStatus: 'APPROVED';
  public: boolean; // Backend sends 'public' not 'isPublic'
  uploadDate: string;
  likesCount: number; // This comes from backend
  commentsCount: number; // This comes from backend
  order?: number;
  folderName: string;
  adminNotes?: string;
  moderatedBy?: string;
  moderatedAt?: string;
}

export interface AdminUserSummary {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  totalPhotos: number;
  publicPhotos: number;
  pendingPhotos: number;
  lastUploadDate: string;
  isActive: boolean;
}

export interface AdminModelInfo {
  productId: string;
  productName: string;
  isPublic: boolean;
  isCompleted: boolean;
  photoCount: number;
  photos: AdminPhotoInfo[];
}

export interface AdminModelStatusInfo {
  productId: string;
  productName: string;
  isPublic: boolean;
  isCompleted: boolean;
}

export interface AdminUserPhotosResponse {
  user: {
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  photos: AdminPhotoInfo[]; // Backend returns flat array
  models: AdminModelInfo[]; // Frontend transforms to models
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number; // Backend sends 'totalItems' not 'totalPhotos'
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    totalPhotos: number;
    publicPhotos: number;
    privatePhotos: number;
    pendingPhotos: number;
    approvedPhotos: number;
    rejectedPhotos: number;
  };
  modelStatuses: Record<string, AdminModelStatusInfo>; // Backend provides model statuses as object
}

export interface AdminPhotoDeleteRequest {
  reason: string;
  notifyUser?: boolean;
  adminNotes?: string;
}

// Removed moderation - photos are auto-approved on upload

export interface AdminPhotoUpdateRequest {
  isPublic?: boolean;
  adminNotes?: string;
  order?: number;
}

export interface AdminBulkActionRequest {
  action: 'delete' | 'make_public' | 'make_private' | 'mark_completed' | 'mark_in_progress';
  photoIds: number[];
  reason: string;
  adminNotes?: string;
  notifyUsers?: boolean;
}

export interface AdminBulkActionResult {
  photoId: number;
  success: boolean;
  message: string;
}

export interface AdminBulkActionResponse {
  action: string;
  processedPhotos: number;
  successfulPhotos: number;
  failedPhotos: number;
  results: AdminBulkActionResult[];
  processedAt: string;
  processedBy: string;
}

class AdminGalleryService {
  private baseUrl = '/api/admin/gallery';

  // Get all users with photos
  async getUsersWithPhotos(params: {
    page?: number;
    limit?: number;
    sort?: 'recent' | 'most_photos' | 'alphabetic' | 'most_uploads';
    filter?: 'all' | 'has_public' | 'has_private';
    search?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.filter) queryParams.append('filter', params.filter);
    if (params.search) queryParams.append('search', params.search);

    const url = `${this.baseUrl}/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url);
  }

  // Get photos for a specific user
  async getUserPhotos(userId: number, params: {
    page?: number;
    limit?: number;
    sort?: 'recent' | 'oldest' | 'product_name';
    filter?: 'all' | 'public' | 'private';
    productId?: string;
  } = {}): Promise<AdminUserPhotosResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.filter) queryParams.append('filter', params.filter);
    if (params.productId) queryParams.append('productId', params.productId);

    // Ensure userId is sent as string to match backend expectation
    const url = `${this.baseUrl}/users/${String(userId)}/photos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Admin gallery API URL:', url);
    const response = await apiClient.get<{ success: boolean; data: AdminUserPhotosResponse }>(url);
    return response.data;
  }

  // Delete a photo
  async deletePhoto(photoId: number, request: AdminPhotoDeleteRequest) {
    const url = `${this.baseUrl}/photos/${photoId}`;
    const response = await apiClient.delete<{ success: boolean; data: any }>(url, { body: request });
    return response.data;
  }

  // Removed moderation functionality - photos are auto-approved on upload

  // Update photo metadata
  async updatePhoto(photoId: number, request: AdminPhotoUpdateRequest) {
    const url = `${this.baseUrl}/photos/${photoId}`;
    const response = await apiClient.put<{ success: boolean; data: any }>(url, request);
    return response.data;
  }

  // Removed pending photos endpoint - photos are auto-approved on upload

  // Perform bulk actions on multiple photos
  async bulkAction(request: AdminBulkActionRequest): Promise<AdminBulkActionResponse> {
    const url = `${this.baseUrl}/photos/bulk-action`;
    const response = await apiClient.post<{ success: boolean; data: AdminBulkActionResponse }>(url, request);
    return response.data;
  }

  // Update model status (public/private, completed/in-progress)
  async updateModelStatus(userId: number, productId: string, updates: {
    isPublic?: boolean;
    isCompleted?: boolean;
    reason?: string;
    notifyUser?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const url = `${this.baseUrl}/users/${userId}/models/${productId}/status`;
    const response = await apiClient.put<{ success: boolean; data: { success: boolean; message: string } }>(url, updates);
    return response.data;
  }
}

export const adminGalleryService = new AdminGalleryService();
