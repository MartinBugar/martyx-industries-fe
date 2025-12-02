import api from './api';

// === Types ===

export interface SeoIssueDto {
  entityId: number;
  entityType: 'PRODUCT' | 'CATEGORY' | 'BLOG_POST';
  entityName: string;
  entitySlug: string;
  issueType: string;
  issueDescription: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

export interface SeoAuditDto {
  totalProducts: number;
  totalCategories: number;
  totalBlogPosts: number;
  productsWithoutMetaTitle: number;
  productsWithoutMetaDescription: number;
  productsWithShortDescription: number;
  productsWithoutImages: number;
  categoriesWithoutMetaTitle: number;
  categoriesWithoutMetaDescription: number;
  blogPostsWithoutMetaTitle: number;
  blogPostsWithoutMetaDescription: number;
  productIssues: SeoIssueDto[];
  categoryIssues: SeoIssueDto[];
  blogPostIssues: SeoIssueDto[];
  overallScore: number;
  scoreLabel: string;
  totalRedirects: number;
  activeRedirects: number;
  totalRedirectHits: number;
}

export interface RedirectDto {
  id: number;
  sourceUrl: string;
  targetUrl: string;
  redirectType: 'PERMANENT' | 'TEMPORARY';
  active: boolean;
  hitCount: number;
  lastHitAt: string | null;
  note: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RedirectRequest {
  sourceUrl: string;
  targetUrl: string;
  redirectType?: string;
  active?: boolean;
  note?: string;
}

export interface RedirectStatsDto {
  totalRedirects: number;
  activeRedirects: number;
  inactiveRedirects: number;
  permanentRedirects: number;
  temporaryRedirects: number;
  totalHits: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ImportResultDto {
  imported: number;
  failed: number;
}

export interface LoopValidationDto {
  valid: boolean;
  error: string | null;
}

// === SEO Audit API ===

export const performAudit = async (): Promise<SeoAuditDto> => {
  const response = await api.get('/admin/seo/audit');
  return response.data;
};

export const getProductSeoIssues = async (limit = 50): Promise<SeoIssueDto[]> => {
  const response = await api.get('/admin/seo/audit/products', {
    params: { limit }
  });
  return response.data;
};

export const getCategorySeoIssues = async (limit = 50): Promise<SeoIssueDto[]> => {
  const response = await api.get('/admin/seo/audit/categories', {
    params: { limit }
  });
  return response.data;
};

export const getBlogPostSeoIssues = async (limit = 50): Promise<SeoIssueDto[]> => {
  const response = await api.get('/admin/seo/audit/blog-posts', {
    params: { limit }
  });
  return response.data;
};

// === Redirects API ===

export const getAllRedirects = async (page = 0, size = 20, sort = 'createdAt,desc'): Promise<PageResponse<RedirectDto>> => {
  const response = await api.get('/admin/seo/redirects', {
    params: { page, size, sort }
  });
  return response.data;
};

export const filterRedirects = async (
  active?: boolean,
  type?: string,
  page = 0,
  size = 20
): Promise<PageResponse<RedirectDto>> => {
  const response = await api.get('/admin/seo/redirects/filter', {
    params: { active, type, page, size }
  });
  return response.data;
};

export const searchRedirects = async (query: string, page = 0, size = 20): Promise<PageResponse<RedirectDto>> => {
  const response = await api.get('/admin/seo/redirects/search', {
    params: { query, page, size }
  });
  return response.data;
};

export const getRedirectById = async (id: number): Promise<RedirectDto> => {
  const response = await api.get(`/admin/seo/redirects/${id}`);
  return response.data;
};

export const createRedirect = async (request: RedirectRequest): Promise<RedirectDto> => {
  const response = await api.post('/admin/seo/redirects', request);
  return response.data;
};

export const updateRedirect = async (id: number, request: RedirectRequest): Promise<RedirectDto> => {
  const response = await api.put(`/admin/seo/redirects/${id}`, request);
  return response.data;
};

export const deleteRedirect = async (id: number): Promise<void> => {
  await api.delete(`/admin/seo/redirects/${id}`);
};

export const toggleRedirectActive = async (id: number): Promise<RedirectDto> => {
  const response = await api.post(`/admin/seo/redirects/${id}/toggle`);
  return response.data;
};

export const getRedirectStats = async (): Promise<RedirectStatsDto> => {
  const response = await api.get('/admin/seo/redirects/stats');
  return response.data;
};

export const getMostUsedRedirects = async (limit = 10): Promise<RedirectDto[]> => {
  const response = await api.get('/admin/seo/redirects/most-used', {
    params: { limit }
  });
  return response.data;
};

export const importRedirects = async (redirects: RedirectRequest[]): Promise<ImportResultDto> => {
  const response = await api.post('/admin/seo/redirects/import', redirects);
  return response.data;
};

export const validateLoop = async (sourceUrl: string, targetUrl: string): Promise<LoopValidationDto> => {
  const response = await api.get('/admin/seo/redirects/validate-loop', {
    params: { sourceUrl, targetUrl }
  });
  return response.data;
};

export const resolveRedirect = async (sourceUrl: string): Promise<RedirectDto | null> => {
  try {
    const response = await api.get('/admin/seo/redirects/resolve', {
      params: { sourceUrl }
    });
    return response.data;
  } catch {
    return null;
  }
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

export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'HIGH':
      return '#ef4444';
    case 'MEDIUM':
      return '#f59e0b';
    case 'LOW':
      return '#22c55e';
    default:
      return '#6b7280';
  }
};

export const getSeverityBgColor = (severity: string): string => {
  switch (severity) {
    case 'HIGH':
      return '#fef2f2';
    case 'MEDIUM':
      return '#fffbeb';
    case 'LOW':
      return '#f0fdf4';
    default:
      return '#f3f4f6';
  }
};

export const getScoreColor = (score: number): string => {
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#f97316';
  return '#ef4444';
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 90) return '#dcfce7';
  if (score >= 70) return '#ecfccb';
  if (score >= 50) return '#fef3c7';
  if (score >= 30) return '#ffedd5';
  return '#fef2f2';
};

export const getRedirectTypeLabel = (type: string): string => {
  switch (type) {
    case 'PERMANENT':
      return '301 (Trvalé)';
    case 'TEMPORARY':
      return '302 (Dočasné)';
    default:
      return type;
  }
};

export const getEntityTypeLabel = (type: string): string => {
  switch (type) {
    case 'PRODUCT':
      return 'Produkt';
    case 'CATEGORY':
      return 'Kategória';
    case 'BLOG_POST':
      return 'Článok';
    default:
      return type;
  }
};

export const getIssueTypeLabel = (type: string): string => {
  switch (type) {
    case 'MISSING_META_TITLE':
      return 'Chýba meta title';
    case 'MISSING_META_DESCRIPTION':
      return 'Chýba meta description';
    case 'SHORT_DESCRIPTION':
      return 'Krátky popis';
    case 'MISSING_IMAGE':
      return 'Chýba obrázok';
    default:
      return type;
  }
};
