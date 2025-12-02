import api from './api';

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
  const response = await api.get('/admin/blog/posts', {
    params: { page, size, sort }
  });
  return response.data;
};

export const filterPosts = async (
  status?: string,
  categoryId?: number,
  authorId?: number,
  page = 0,
  size = 20
): Promise<PageResponse<BlogPostDto>> => {
  const response = await api.get('/admin/blog/posts/filter', {
    params: { status, categoryId, authorId, page, size }
  });
  return response.data;
};

export const searchPosts = async (query: string, page = 0, size = 20): Promise<PageResponse<BlogPostDto>> => {
  const response = await api.get('/admin/blog/posts/search', {
    params: { query, page, size }
  });
  return response.data;
};

export const getPostById = async (id: number): Promise<BlogPostDto> => {
  const response = await api.get(`/admin/blog/posts/${id}`);
  return response.data;
};

export const createPost = async (request: CreateBlogPostRequest): Promise<BlogPostDto> => {
  const response = await api.post('/admin/blog/posts', request);
  return response.data;
};

export const updatePost = async (id: number, request: UpdateBlogPostRequest): Promise<BlogPostDto> => {
  const response = await api.put(`/admin/blog/posts/${id}`, request);
  return response.data;
};

export const deletePost = async (id: number): Promise<void> => {
  await api.delete(`/admin/blog/posts/${id}`);
};

export const publishPost = async (id: number): Promise<BlogPostDto> => {
  const response = await api.post(`/admin/blog/posts/${id}/publish`);
  return response.data;
};

export const unpublishPost = async (id: number): Promise<BlogPostDto> => {
  const response = await api.post(`/admin/blog/posts/${id}/unpublish`);
  return response.data;
};

export const schedulePost = async (id: number, scheduledAt: string): Promise<BlogPostDto> => {
  const response = await api.post(`/admin/blog/posts/${id}/schedule`, null, {
    params: { scheduledAt }
  });
  return response.data;
};

export const archivePost = async (id: number): Promise<BlogPostDto> => {
  const response = await api.post(`/admin/blog/posts/${id}/archive`);
  return response.data;
};

// === Categories API ===

export const getAllCategories = async (): Promise<BlogCategoryDto[]> => {
  const response = await api.get('/admin/blog/categories');
  return response.data;
};

export const getCategoryById = async (id: number): Promise<BlogCategoryDto> => {
  const response = await api.get(`/admin/blog/categories/${id}`);
  return response.data;
};

export const createCategory = async (request: BlogCategoryRequest): Promise<BlogCategoryDto> => {
  const response = await api.post('/admin/blog/categories', request);
  return response.data;
};

export const updateCategory = async (id: number, request: BlogCategoryRequest): Promise<BlogCategoryDto> => {
  const response = await api.put(`/admin/blog/categories/${id}`, request);
  return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/admin/blog/categories/${id}`);
};

// === Tags API ===

export const getAllTags = async (): Promise<BlogTagDto[]> => {
  const response = await api.get('/admin/blog/tags');
  return response.data;
};

export const searchTags = async (query: string): Promise<BlogTagDto[]> => {
  const response = await api.get('/admin/blog/tags/search', {
    params: { query }
  });
  return response.data;
};

export const getPopularTags = async (limit = 10): Promise<BlogTagDto[]> => {
  const response = await api.get('/admin/blog/tags/popular', {
    params: { limit }
  });
  return response.data;
};

export const getTagById = async (id: number): Promise<BlogTagDto> => {
  const response = await api.get(`/admin/blog/tags/${id}`);
  return response.data;
};

export const createTag = async (request: BlogTagRequest): Promise<BlogTagDto> => {
  const response = await api.post('/admin/blog/tags', request);
  return response.data;
};

export const updateTag = async (id: number, request: BlogTagRequest): Promise<BlogTagDto> => {
  const response = await api.put(`/admin/blog/tags/${id}`, request);
  return response.data;
};

export const deleteTag = async (id: number): Promise<void> => {
  await api.delete(`/admin/blog/tags/${id}`);
};

// === Stats ===

export const getStats = async (): Promise<BlogStatsDto> => {
  const response = await api.get('/admin/blog/stats');
  return response.data;
};

export const getStatuses = async (): Promise<StatusOption[]> => {
  const response = await api.get('/admin/blog/statuses');
  return response.data;
};

// === Helpers ===

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
