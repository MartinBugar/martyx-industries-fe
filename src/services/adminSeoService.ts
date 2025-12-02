import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

const BASE_URL = `${API_BASE_URL}/api/admin/seo`;

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
  const response = await fetch(`${BASE_URL}/audit`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getProductSeoIssues = async (limit = 50): Promise<SeoIssueDto[]> => {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await fetch(`${BASE_URL}/audit/products?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getCategorySeoIssues = async (limit = 50): Promise<SeoIssueDto[]> => {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await fetch(`${BASE_URL}/audit/categories?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getBlogPostSeoIssues = async (limit = 50): Promise<SeoIssueDto[]> => {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await fetch(`${BASE_URL}/audit/blog-posts?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

// === Redirects API ===

export const getAllRedirects = async (page = 0, size = 20, sort = 'createdAt,desc'): Promise<PageResponse<RedirectDto>> => {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString(), sort });
  const response = await fetch(`${BASE_URL}/redirects?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const filterRedirects = async (
  active?: boolean,
  type?: string,
  page = 0,
  size = 20
): Promise<PageResponse<RedirectDto>> => {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
  if (active !== undefined) params.append('active', active.toString());
  if (type) params.append('type', type);
  const response = await fetch(`${BASE_URL}/redirects/filter?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const searchRedirects = async (query: string, page = 0, size = 20): Promise<PageResponse<RedirectDto>> => {
  const params = new URLSearchParams({ query, page: page.toString(), size: size.toString() });
  const response = await fetch(`${BASE_URL}/redirects/search?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getRedirectById = async (id: number): Promise<RedirectDto> => {
  const response = await fetch(`${BASE_URL}/redirects/${id}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const createRedirect = async (request: RedirectRequest): Promise<RedirectDto> => {
  const response = await fetch(`${BASE_URL}/redirects`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify(request),
  }));
  return handleResponse(response);
};

export const updateRedirect = async (id: number, request: RedirectRequest): Promise<RedirectDto> => {
  const response = await fetch(`${BASE_URL}/redirects/${id}`, withLangHeaders({
    method: 'PUT',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify(request),
  }));
  return handleResponse(response);
};

export const deleteRedirect = async (id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/redirects/${id}`, withLangHeaders({
    method: 'DELETE',
    headers: defaultHeaders as HeadersInit,
  }));
  if (!response.ok) {
    throw new Error('Failed to delete redirect');
  }
};

export const toggleRedirectActive = async (id: number): Promise<RedirectDto> => {
  const response = await fetch(`${BASE_URL}/redirects/${id}/toggle`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getRedirectStats = async (): Promise<RedirectStatsDto> => {
  const response = await fetch(`${BASE_URL}/redirects/stats`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getMostUsedRedirects = async (limit = 10): Promise<RedirectDto[]> => {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await fetch(`${BASE_URL}/redirects/most-used?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const importRedirects = async (redirects: RedirectRequest[]): Promise<ImportResultDto> => {
  const response = await fetch(`${BASE_URL}/redirects/import`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify(redirects),
  }));
  return handleResponse(response);
};

export const validateLoop = async (sourceUrl: string, targetUrl: string): Promise<LoopValidationDto> => {
  const params = new URLSearchParams({ sourceUrl, targetUrl });
  const response = await fetch(`${BASE_URL}/redirects/validate-loop?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const resolveRedirect = async (sourceUrl: string): Promise<RedirectDto | null> => {
  try {
    const params = new URLSearchParams({ sourceUrl });
    const response = await fetch(`${BASE_URL}/redirects/resolve?${params}`, withLangHeaders({
      headers: defaultHeaders as HeadersInit,
    }));
    return handleResponse(response);
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
