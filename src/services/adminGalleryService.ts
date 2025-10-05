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
  verificationStatus: 'pending' | 'approved' | 'rejected';
  isPublic: boolean;
  uploadDate: string;
  likesCount: number;
  commentsCount: number;
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
  rejectedPhotos: number;
  lastUploadDate: string;
  isActive: boolean;
}

export interface AdminUserPhotosResponse {
  user: {
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  photos: AdminPhotoInfo[];
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
    pendingPhotos: number;
    approvedPhotos: number;
    rejectedPhotos: number;
  };
}

export interface AdminPhotoDeleteRequest {
  reason: string;
  notifyUser?: boolean;
  adminNotes?: string;
}

export interface AdminPhotoModerateRequest {
  action: 'approve' | 'reject';
  adminNotes?: string;
  notifyUser?: boolean;
}

export interface AdminPhotoUpdateRequest {
  isPublic?: boolean;
  adminNotes?: string;
  order?: number;
}

export interface AdminBulkActionRequest {
  action: 'approve' | 'reject' | 'delete' | 'make_public' | 'make_private';
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
    filter?: 'all' | 'has_pending' | 'has_rejected' | 'has_approved';
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
    sort?: 'recent' | 'oldest' | 'product_name' | 'verification_status';
    filter?: 'all' | 'pending' | 'approved' | 'rejected' | 'public' | 'private';
    productId?: string;
  } = {}): Promise<AdminUserPhotosResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.filter) queryParams.append('filter', params.filter);
    if (params.productId) queryParams.append('productId', params.productId);

    const url = `${this.baseUrl}/users/${userId}/photos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url);
  }

  // Delete a photo
  async deletePhoto(photoId: number, request: AdminPhotoDeleteRequest) {
    const url = `${this.baseUrl}/photos/${photoId}`;
    return apiClient.delete(url, { body: request });
  }

  // Moderate a photo (approve/reject)
  async moderatePhoto(photoId: number, request: AdminPhotoModerateRequest) {
    const url = `${this.baseUrl}/photos/${photoId}/moderate`;
    return apiClient.put(url, request);
  }

  // Update photo metadata
  async updatePhoto(photoId: number, request: AdminPhotoUpdateRequest) {
    const url = `${this.baseUrl}/photos/${photoId}`;
    return apiClient.put(url, request);
  }

  // Get pending photos for moderation
  async getPendingPhotos(params: {
    page?: number;
    limit?: number;
    sort?: 'upload_date' | 'user_name' | 'product_name';
    userId?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.userId) queryParams.append('userId', params.userId.toString());

    const url = `${this.baseUrl}/photos/pending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url);
  }

  // Perform bulk actions on multiple photos
  async bulkAction(request: AdminBulkActionRequest): Promise<AdminBulkActionResponse> {
    const url = `${this.baseUrl}/photos/bulk-action`;
    return apiClient.post(url, request);
  }
}

export const adminGalleryService = new AdminGalleryService();
