import { apiClient } from './apiClient';

// === Types ===

export interface BlogCategoryDto {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  postCount: number;
  publishedPostCount: number;
}

export interface BlogTagDto {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  postCount?: number;
}

export interface BlogPostDto {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  status: PostStatus;
  statusLabel: string;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  authorId: number | null;
  authorName: string | null;
  authorEmail: string | null;
  tags: BlogTagDto[];
  relatedProductIds: string | null;
  relatedProductIdList: number[] | null;
  viewCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  featured: boolean;
  allowComments: boolean;
}

export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface BlogStatsDto {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  archivedPosts: number;
  totalCategories: number;
  activeCategories: number;
  totalTags: number;
  totalViews: number;
}

export interface CreateBlogPostRequest {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  status?: string;
  categoryId?: number;
  tagIds?: number[];
  relatedProductIds?: string;
  scheduledAt?: string;
  featured?: boolean;
  allowComments?: boolean;
}

export interface UpdateBlogPostRequest {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  status?: string;
  categoryId?: number;
  tagIds?: number[];
  relatedProductIds?: string;
  scheduledAt?: string;
  featured?: boolean;
  allowComments?: boolean;
}

export interface BlogCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface BlogTagRequest {
  name: string;
  slug?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface StatusOption {
  code: string;
  name: string;
  description: string;
}

// === Posts API ===

export const getAllPosts = async (page = 0, size = 20, sort = 'createdAt,desc'): Promise<PageResponse<BlogPostDto>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size), sort });
  return apiClient.get<PageResponse<BlogPostDto>>(`/api/admin/blog/posts?${params}`);
};

export const filterPosts = async (
  status?: string,
  categoryId?: number,
  authorId?: number,
  page = 0,
  size = 20
): Promise<PageResponse<BlogPostDto>> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.append('status', status);
  if (categoryId) params.append('categoryId', String(categoryId));
  if (authorId) params.append('authorId', String(authorId));
  return apiClient.get<PageResponse<BlogPostDto>>(`/api/admin/blog/posts/filter?${params}`);
};

export const searchPosts = async (query: string, page = 0, size = 20): Promise<PageResponse<BlogPostDto>> => {
  const params = new URLSearchParams({ query, page: String(page), size: String(size) });
  return apiClient.get<PageResponse<BlogPostDto>>(`/api/admin/blog/posts/search?${params}`);
};

export const getPostById = async (id: number): Promise<BlogPostDto> => {
  return apiClient.get<BlogPostDto>(`/api/admin/blog/posts/${id}`);
};

export const createPost = async (request: CreateBlogPostRequest): Promise<BlogPostDto> => {
  return apiClient.post<BlogPostDto>('/api/admin/blog/posts', request);
};

export const updatePost = async (id: number, request: UpdateBlogPostRequest): Promise<BlogPostDto> => {
  return apiClient.put<BlogPostDto>(`/api/admin/blog/posts/${id}`, request);
};

export const deletePost = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/blog/posts/${id}`);
};

export const publishPost = async (id: number): Promise<BlogPostDto> => {
  return apiClient.post<BlogPostDto>(`/api/admin/blog/posts/${id}/publish`);
};

export const unpublishPost = async (id: number): Promise<BlogPostDto> => {
  return apiClient.post<BlogPostDto>(`/api/admin/blog/posts/${id}/unpublish`);
};

export const schedulePost = async (id: number, scheduledAt: string): Promise<BlogPostDto> => {
  const params = new URLSearchParams({ scheduledAt });
  return apiClient.post<BlogPostDto>(`/api/admin/blog/posts/${id}/schedule?${params}`);
};

export const archivePost = async (id: number): Promise<BlogPostDto> => {
  return apiClient.post<BlogPostDto>(`/api/admin/blog/posts/${id}/archive`);
};

// === Categories API ===

export const getAllCategories = async (): Promise<BlogCategoryDto[]> => {
  return apiClient.get<BlogCategoryDto[]>('/api/admin/blog/categories');
};

export const getCategoryById = async (id: number): Promise<BlogCategoryDto> => {
  return apiClient.get<BlogCategoryDto>(`/api/admin/blog/categories/${id}`);
};

export const createCategory = async (request: BlogCategoryRequest): Promise<BlogCategoryDto> => {
  return apiClient.post<BlogCategoryDto>('/api/admin/blog/categories', request);
};

export const updateCategory = async (id: number, request: BlogCategoryRequest): Promise<BlogCategoryDto> => {
  return apiClient.put<BlogCategoryDto>(`/api/admin/blog/categories/${id}`, request);
};

export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/blog/categories/${id}`);
};

// === Tags API ===

export const getAllTags = async (): Promise<BlogTagDto[]> => {
  return apiClient.get<BlogTagDto[]>('/api/admin/blog/tags');
};

export const searchTags = async (query: string): Promise<BlogTagDto[]> => {
  const params = new URLSearchParams({ query });
  return apiClient.get<BlogTagDto[]>(`/api/admin/blog/tags/search?${params}`);
};

export const getPopularTags = async (limit = 10): Promise<BlogTagDto[]> => {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiClient.get<BlogTagDto[]>(`/api/admin/blog/tags/popular?${params}`);
};

export const getTagById = async (id: number): Promise<BlogTagDto> => {
  return apiClient.get<BlogTagDto>(`/api/admin/blog/tags/${id}`);
};

export const createTag = async (request: BlogTagRequest): Promise<BlogTagDto> => {
  return apiClient.post<BlogTagDto>('/api/admin/blog/tags', request);
};

export const updateTag = async (id: number, request: BlogTagRequest): Promise<BlogTagDto> => {
  return apiClient.put<BlogTagDto>(`/api/admin/blog/tags/${id}`, request);
};

export const deleteTag = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/blog/tags/${id}`);
};

// === Stats ===

export const getStats = async (): Promise<BlogStatsDto> => {
  return apiClient.get<BlogStatsDto>('/api/admin/blog/stats');
};

export const getStatuses = async (): Promise<StatusOption[]> => {
  return apiClient.get<StatusOption[]>('/api/admin/blog/statuses');
};

// === Helpers ===

/**
 * Converts datetime-local input value to ISO format for backend.
 * Input: "2025-12-02T14:30" -> Output: "2025-12-02T14:30:00"
 */
export const formatScheduledAt = (dateTimeLocal: string | undefined): string | undefined => {
  if (!dateTimeLocal) return undefined;
  // datetime-local returns YYYY-MM-DDTHH:mm, add seconds for backend
  return dateTimeLocal.includes(':') && dateTimeLocal.split(':').length === 2
    ? `${dateTimeLocal}:00`
    : dateTimeLocal;
};

/**
 * Converts ISO datetime from backend to datetime-local input format.
 * Input: "2025-12-02T14:30:00" -> Output: "2025-12-02T14:30"
 */
export const parseScheduledAt = (isoDateTime: string | null): string => {
  if (!isoDateTime) return '';
  // Remove seconds and timezone for datetime-local input
  return isoDateTime.substring(0, 16);
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateShort = (dateString: string | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const getStatusColor = (status: PostStatus): string => {
  switch (status) {
    case 'PUBLISHED':
      return '#22c55e';
    case 'DRAFT':
      return '#6b7280';
    case 'SCHEDULED':
      return '#3b82f6';
    case 'ARCHIVED':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

export const getStatusBgColor = (status: PostStatus): string => {
  switch (status) {
    case 'PUBLISHED':
      return '#dcfce7';
    case 'DRAFT':
      return '#f3f4f6';
    case 'SCHEDULED':
      return '#dbeafe';
    case 'ARCHIVED':
      return '#fef3c7';
    default:
      return '#f3f4f6';
  }
};
