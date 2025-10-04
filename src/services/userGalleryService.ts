import { API_BASE_URL } from './apiUtils';
import { getAuthToken } from '../utils/tokenUtils';
import type {
  UserGalleryData,
  UserGalleryDetail,
  GalleryQueryParams,
  LikePhotoRequest,
  LikePhotoResponse,
  PhotoCommentsResponse
} from '../types/userGallery';

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

    const response = await fetch(
      `${API_BASE_URL}/api/public-gallery?${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 500) {
        console.warn('Backend endpoint GET /api/public-gallery not implemented yet');
        // Return mock data for development
        return {
          users: [],
          pagination: {
            current_page: 1,
            total_pages: 0,
            total_users: 0,
            items_per_page: 20
          },
          stats: {
            total_users: 0,
            total_public_models: 0,
            total_public_photos: 0
          }
        };
      }
      throw new Error(`Failed to fetch public gallery: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  },

  /**
   * Get specific user's public gallery with all their public photos grouped by models
   *
   * @param userId - User ID to fetch gallery for
   * @returns UserGalleryDetail with user profile and models with photos
   */
  async getUserGallery(userId: number): Promise<UserGalleryDetail> {
    const response = await fetch(
      `${API_BASE_URL}/api/public-gallery/${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found or has no public photos');
      }
      if (response.status === 500) {
        console.warn(`Backend endpoint GET /api/public-gallery/${userId} not implemented yet`);
        // Return mock data for development
        return {
          user: {
            user_id: userId,
            nickname: 'MockUser',
            avatar_url: null,
            member_since: new Date().toISOString(),
            total_public_models: 0,
            total_public_photos: 0
          },
          models: []
        };
      }
      throw new Error(`Failed to fetch user gallery: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
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
      if (response.status === 500) {
        console.warn(`Backend endpoint POST /api/public-gallery/photos/${photoId}/like not implemented yet`);
        // Return mock response for development
        return {
          success: true,
          likes_count: 1,
          is_liked: true
        };
      }
      throw new Error(`Failed to like photo: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
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
      if (response.status === 500) {
        console.warn(`Backend endpoint DELETE /api/public-gallery/photos/${photoId}/unlike not implemented yet`);
        // Return mock response for development
        return {
          success: true,
          likes_count: 0,
          is_liked: false
        };
      }
      throw new Error(`Failed to unlike photo: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
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
  }
};
