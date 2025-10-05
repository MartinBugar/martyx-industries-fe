import { API_BASE_URL } from './apiUtils';
import { getAuthToken } from '../utils/tokenUtils';
import type {
  UserGalleryData,
  UserGalleryDetail,
  GalleryQueryParams,
  LikePhotoRequest,
  LikePhotoResponse,
  PhotoCommentsResponse,
  PublicUser,
  UserProfile,
  AllPhotosGalleryData,
  PublicPhotoWithUser
} from '../types/userGallery';

// Helper function to transform backend camelCase to frontend snake_case
const transformPublicUser = (backendUser: any): PublicUser => ({
  user_id: backendUser.userId,
  username: backendUser.nickname, // backend uses 'nickname' field for username
  avatar_url: backendUser.avatarUrl,
  total_public_models: backendUser.totalPublicModels,
  total_public_photos: backendUser.totalPublicPhotos,
  total_likes: backendUser.totalLikes,
  latest_upload_date: backendUser.latestUploadDate,
  preview_photos: backendUser.previewPhotos?.map((photo: any) => ({
    thumbnail_url: photo.thumbnailUrl,
    product_name: photo.productName
  })) || []
});

const transformUserProfile = (backendUser: any): UserProfile => {
  const transformed = {
    user_id: backendUser.userId,
    username: backendUser.nickname, // backend uses 'nickname' field for username
    avatar_url: backendUser.avatarUrl,
    member_since: backendUser.memberSince,
    total_public_models: backendUser.totalPublicModels,
    total_public_photos: backendUser.totalPublicPhotos,
    total_likes: backendUser.totalLikes
  };
  console.log('🔄 Transform UserProfile:', { backendUser, transformed });
  return transformed;
};

export const userGalleryService = {
  /**
   * Get all users with public photos
   *
   * @param params - Query parameters for filtering, sorting and pagination
   * @returns UserGalleryData with users, stats and pagination
   */
  async getPublicGallery(params: GalleryQueryParams = {}): Promise<UserGalleryData> {
    const queryString = new URLSearchParams({
      filter: params.filter || 'all',
      sort: params.sort || 'recent',
      page: String(params.page || 1),
      limit: String(params.limit || 20)
    }).toString();

    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if user is logged in
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/public-gallery?${queryString}`,
      {
        method: 'GET',
        headers
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch public gallery: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    const backendData = responseData.data || responseData;

    // Transform backend camelCase to frontend snake_case
    return {
      users: backendData.users?.map(transformPublicUser) || [],
      pagination: {
        current_page: backendData.pagination?.currentPage || 1,
        total_pages: backendData.pagination?.totalPages || 0,
        total_users: backendData.pagination?.totalUsers || 0,
        items_per_page: backendData.pagination?.itemsPerPage || 20
      },
      stats: {
        total_users: backendData.stats?.totalUsers || 0,
        total_public_models: backendData.stats?.totalPublicModels || 0,
        total_public_photos: backendData.stats?.totalPublicPhotos || 0
      }
    };
  },

  /**
   * Get specific user's public gallery with all their public photos grouped by models
   *
   * @param userId - User ID to fetch gallery for
   * @returns UserGalleryDetail with user profile and models with photos
   */
  async getUserGallery(userId: number): Promise<UserGalleryDetail> {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if user is logged in
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/public-gallery/${userId}`,
      {
        method: 'GET',
        headers
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found or has no public photos');
      }
      throw new Error(`Failed to fetch user gallery: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    const backendData = responseData.data || responseData;

    // Transform backend camelCase to frontend snake_case
    return {
      user: transformUserProfile(backendData.user),
      models: backendData.models?.map((model: any) => ({
        product_id: model.productId,
        product_name: model.productName,
        is_completed: model.isCompleted,
        photo_count: model.photoCount,
        photos: model.photos?.map((photo: any) => ({
          id: photo.id,
          thumbnail_url: photo.thumbnailUrl,
          cdn_url: photo.cdnUrl,
          upload_date: photo.uploadDate,
          likes_count: photo.likesCount,
          is_liked_by_user: photo.isLikedByUser,
          comments_count: photo.commentsCount
        })) || []
      })) || []
    };
  },

  /**
   * Like a photo (toggle like)
   * Requires authentication
   *
   * @param photoId - Photo ID to like
   * @returns LikePhotoResponse with new like count and like status
   */
  async likePhoto(photoId: number): Promise<LikePhotoResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to like photos');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/public-gallery/photos/${photoId}/like`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photo_id: photoId } as LikePhotoRequest)
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('You must be logged in to like photos');
      }
      if (response.status === 404) {
        throw new Error('Photo not found');
      }
      throw new Error(`Failed to like photo: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    const data = responseData.data || responseData;

    // Transform response if needed
    return {
      success: data.success ?? true,
      likes_count: data.likesCount ?? data.likes_count,
      is_liked: data.isLiked ?? data.is_liked
    };
  },

  /**
   * Unlike a photo
   * Requires authentication
   *
   * @param photoId - Photo ID to unlike
   * @returns LikePhotoResponse with new like count and like status
   */
  async unlikePhoto(photoId: number): Promise<LikePhotoResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to unlike photos');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/public-gallery/photos/${photoId}/unlike`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('You must be logged in to unlike photos');
      }
      if (response.status === 404) {
        throw new Error('Photo not found or not liked');
      }
      throw new Error(`Failed to unlike photo: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    const data = responseData.data || responseData;

    // Transform response if needed
    return {
      success: data.success ?? true,
      likes_count: data.likesCount ?? data.likes_count,
      is_liked: data.isLiked ?? data.is_liked
    };
  },

  /**
   * Get comments for a photo (future feature)
   *
   * @param photoId - Photo ID to get comments for
   * @returns PhotoCommentsResponse with list of comments
   */
  async getPhotoComments(photoId: number): Promise<PhotoCommentsResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/public-gallery/photos/${photoId}/comments`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: true,
          photo_id: photoId,
          comments: [],
          total_comments: 0
        };
      }
      throw new Error(`Failed to fetch comments: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  },

  /**
   * Add comment to a photo (future feature)
   * Requires authentication
   *
   * @param photoId - Photo ID to comment on
   * @param commentText - Comment text
   * @returns Updated PhotoCommentsResponse
   */
  async addComment(photoId: number, commentText: string): Promise<PhotoCommentsResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to add comments');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/public-gallery/photos/${photoId}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment_text: commentText })
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('You must be logged in to add comments');
      }
      throw new Error(`Failed to add comment: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  },

  /**
   * Get all public photos from all users (All Photos view)
   *
   * @param params - Query parameters for sorting and pagination
   * @returns AllPhotosGalleryData with photos, stats and pagination
   */
  async getAllPublicPhotos(params: { sort?: string; page?: number; limit?: number }): Promise<AllPhotosGalleryData> {
    const queryString = new URLSearchParams({
      sort: params.sort || 'recent',
      page: String(params.page || 1),
      limit: String(params.limit || 20)
    }).toString();

    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if user is logged in (for is_liked_by_user)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/public-gallery/all-photos?${queryString}`,
      {
        method: 'GET',
        headers
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch all public photos: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    const backendData = responseData.data || responseData;

    // Transform backend camelCase to frontend snake_case
    return {
      photos: backendData.photos?.map((photo: any) => ({
        id: photo.id,
        thumbnail_url: photo.thumbnailUrl,
        cdn_url: photo.cdnUrl,
        upload_date: photo.uploadDate,
        likes_count: photo.likesCount,
        is_liked_by_user: photo.isLikedByUser,
        comments_count: photo.commentsCount,
        user_id: photo.userId,
        username: photo.nickname, // backend uses 'nickname' field
        user_avatar_url: photo.userAvatarUrl,
        product_name: photo.productName
      } as PublicPhotoWithUser)) || [],
      pagination: {
        current_page: backendData.pagination?.currentPage || 1,
        total_pages: backendData.pagination?.totalPages || 0,
        total_users: backendData.pagination?.totalPhotos || 0,
        items_per_page: backendData.pagination?.itemsPerPage || 20
      },
      stats: {
        total_users: backendData.stats?.totalUsers || 0,
        total_public_models: backendData.stats?.totalPublicModels || 0,
        total_public_photos: backendData.stats?.totalPublicPhotos || 0
      }
    };
  }
};
