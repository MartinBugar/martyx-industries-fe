// Types for User Gallery feature

export interface PreviewPhoto {
  thumbnail_url: string;
  product_name: string;
}

export interface PublicUser {
  user_id: number;
  username: string;
  avatar_url: string | null;
  total_public_models: number;
  total_public_photos: number;
  total_likes?: number; // For future likes feature
  latest_upload_date?: string;
  preview_photos: PreviewPhoto[];
}

export interface GalleryStats {
  total_users: number;
  total_public_models: number;
  total_public_photos: number;
}

export interface GalleryPagination {
  current_page: number;
  total_pages: number;
  total_users: number;
  items_per_page: number;
}

export interface UserGalleryData {
  users: PublicUser[];
  pagination: GalleryPagination;
  stats: GalleryStats;
}

export interface UserProfile {
  user_id: number;
  username: string;
  avatar_url: string | null;
  member_since: string;
  total_public_models: number;
  total_public_photos: number;
  total_likes?: number;
}

export interface PublicPhoto {
  id: number;
  thumbnail_url: string;
  cdn_url: string;
  upload_date: string;
  likes_count: number;
  is_liked_by_user: boolean; // true if current logged user liked this photo
  comments_count: number; // For future comments feature
}

export interface PublicModel {
  product_id: string;
  product_name: string;
  is_completed: boolean;
  photo_count: number;
  photos: PublicPhoto[];
}

export interface UserGalleryDetail {
  user: UserProfile;
  models: PublicModel[];
}

export type GalleryFilter = 'all' | 'completed';
export type GalleryView = 'users' | 'photos';
export type GallerySort = 'recent' | 'most_photos' | 'alphabetic' | 'most_liked';

export interface GalleryQueryParams {
  filter?: GalleryFilter;
  sort?: GallerySort;
  page?: number;
  limit?: number;
  view?: GalleryView;
}

export interface PublicPhotoWithUser extends PublicPhoto {
  user_id: number;
  username: string;
  user_avatar_url: string | null;
  product_name: string;
}

export interface AllPhotosGalleryData {
  photos: PublicPhotoWithUser[];
  pagination: GalleryPagination;
  stats: GalleryStats;
}

// Like action types
export interface LikePhotoRequest {
  photo_id: number;
}

export interface LikePhotoResponse {
  success: boolean;
  likes_count: number;
  is_liked: boolean;
}

// Future: Comment types (pre-prepared)
export interface Comment {
  id: number;
  user_id: number;
  user_username: string;
  user_avatar_url: string | null;
  comment_text: string;
  created_at: string;
}

export interface PhotoCommentsResponse {
  success: boolean;
  photo_id: number;
  comments: Comment[];
  total_comments: number;
}
