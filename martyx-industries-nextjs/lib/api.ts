const API_BASE_URL = process.env.API_BASE_URL || 'https://martyx-industries-be-2xf3x.ondigitalocean.app';

export interface Product {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  specs?: Record<string, unknown>;
  gallery?: Array<{
    id: string;
    url: string;
    alt?: string;
    order?: number;
  }>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'html';
  url: string;
  description?: string;
}

export interface PageContent {
  content: string;
  title?: string;
  seo?: {
    title?: string;
    description?: string;
  };
}

async function fetchWithError(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const response = await fetchWithError(`${API_BASE_URL}/api/v1/products?featured=true`, {
    next: { tags: ['products', 'featured-products'] }
  });
  return response.json();
}

export async function getProducts(page: number = 1, limit: number = 20): Promise<{
  products: Product[];
  totalCount: number;
  hasMore: boolean;
}> {
  const response = await fetchWithError(`${API_BASE_URL}/api/v1/products?page=${page}&limit=${limit}`, {
    next: { tags: ['products'] }
  });
  return response.json();
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const response = await fetchWithError(`${API_BASE_URL}/api/v1/products/${slug}`, {
    next: { tags: ['products', `product:${slug}`] }
  });
  return response.json();
}

export async function getProductSlugs(): Promise<{ slug: string }[]> {
  const response = await fetchWithError(`${API_BASE_URL}/api/v1/products/slugs`, {
    next: { tags: ['products'] }
  });
  return response.json();
}

export async function getDocuments(): Promise<Document[]> {
  const response = await fetchWithError(`${API_BASE_URL}/api/v1/documents`, {
    next: { tags: ['documents'] }
  });
  return response.json();
}

export async function getAboutPage(): Promise<PageContent> {
  const response = await fetchWithError(`${API_BASE_URL}/api/v1/pages/about`, {
    next: { tags: ['pages', 'about'] }
  });
  return response.json();
}