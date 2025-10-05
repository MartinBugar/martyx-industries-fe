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
  verificationStatus: 'approved';
  isPublic: boolean;
  isCompleted?: boolean; // Model completion status from backend
  uploadDate: string;
  likesCount: number; // This should come from backend
  order?: number;
  folderName: string;
  adminNotes?: string;
}

export interface AdminUserSummary {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  totalPhotos: number;
  publicPhotos: number;
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
    totalPhotos: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    totalPhotos: number;
    publicPhotos: number;
    privatePhotos: number;
  };
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
  action: 'delete' | 'make_public' | 'make_private';
  photoIds: number[];
  reason?: string;
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

    const url = `${this.baseUrl}/users/${userId.toString()}/photos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
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
}

export const adminGalleryService = new AdminGalleryService();
