export function getApiBaseUrl(): string {
  // For server-side (build time, ISR), use API_BASE_URL
  // For client-side, use NEXT_PUBLIC_API_BASE_URL
  const serverUrl = process.env.API_BASE_URL;
  const clientUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const API_BASE_URL = typeof window === 'undefined' ? serverUrl : clientUrl;

  // Fallback to localhost:8080 for development
  if (!API_BASE_URL) {
    const fallbackUrl = 'http://localhost:8080';
    console.warn(`API_BASE_URL not set, using fallback: ${fallbackUrl}`);
    return fallbackUrl;
  }

  // Remove trailing slash if present
  return API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
}

export interface Product {
  id: string | number;
  slug?: string;
  name: string; // Backend uses 'name', not 'title'
  title?: string; // Alias for compatibility
  description: string;
  shortDescription?: string;
  price: number;
  currency: string;
  category?: string | null;
  imageUrl?: string | null;
  sku?: string;
  productType?: string;
  active?: boolean;
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

// Document and PageContent interfaces removed - not used

async function fetchWithError(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status} for ${url}:`, errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error(`❌ Fetch error for ${url}:`, error);
    throw error;
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const baseUrl = getApiBaseUrl();
  console.log('🔍 Fetching featured products from:', `${baseUrl}/api/products?featured=true`);

  const response = await fetchWithError(`${baseUrl}/api/products?featured=true`, {
    next: { revalidate: 3600, tags: ['products', 'featured-products'] }
  });
  const data = await response.json();

  // Handle paginated response format
  if (data && 'content' in data && Array.isArray(data.content)) {
    console.log('✅ Fetched featured products (paginated):', data.content.length);
    return data.content;
  }

  console.log('✅ Fetched featured products (array):', Array.isArray(data) ? data.length : 0);
  return Array.isArray(data) ? data : [];
}

export async function getProducts(page: number = 0, size: number = 20): Promise<{
  products: Product[];
  totalCount: number;
  hasMore: boolean;
}> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/products?page=${page}&size=${size}`;
  console.log('🔍 Fetching products from:', url);

  try {
    const response = await fetchWithError(url, {
      next: { revalidate: 600, tags: ['products'] }
    });
    const data = await response.json();

    console.log('📦 Raw products response:', JSON.stringify(data, null, 2));

    // Spring Data Page format: { content: [], totalElements, totalPages, last, ... }
    if (data && 'content' in data && Array.isArray(data.content)) {
      const products = data.content.filter((p: any) => p.active !== false);
      console.log('✅ Fetched products (Spring Page):', products.length, 'of', data.totalElements);
      return {
        products,
        totalCount: data.totalElements || products.length,
        hasMore: !data.last
      };
    }

    // Handle direct array response (legacy /all endpoint)
    if (Array.isArray(data)) {
      const products = data.filter((p: any) => p.active !== false);
      console.log('✅ Fetched products (array):', products.length);
      return {
        products,
        totalCount: products.length,
        hasMore: false
      };
    }

    console.warn('⚠️ Unexpected products response format:', data);
    return {
      products: [],
      totalCount: 0,
      hasMore: false
    };
  } catch (error) {
    console.error('❌ Failed to fetch products:', error);
    throw error; // Re-throw to see the actual error
  }
}

export async function getProductBySlug(slug: string): Promise<Product> {
  // Convert slug to ID if it's numeric, otherwise try to fetch by slug
  const numericId = parseInt(slug);
  const endpoint = !isNaN(numericId) ? 
    `${getApiBaseUrl()}/api/products/${numericId}` : 
    `${getApiBaseUrl()}/api/products/slug/${slug}`;
    
  const response = await fetchWithError(endpoint, {
    next: { revalidate: 3600, tags: ['products', `product:${slug}`] }
  });
  return response.json();
}

export async function getProductById(id: string | number): Promise<Product> {
  const numericId = typeof id === 'string' ? parseInt(id) : id;
  if (isNaN(numericId)) {
    throw new Error(`Invalid product ID: ${id}`);
  }
  
  const response = await fetchWithError(`${getApiBaseUrl()}/api/products/${numericId}`, {
    next: { revalidate: 3600, tags: ['products', `product:${numericId}`] }
  });
  return response.json();
}

export async function getProductSlugs(): Promise<{ slug: string }[]> {
  const response = await fetchWithError(`${getApiBaseUrl()}/api/products/slugs`, {
    next: { revalidate: 3600, tags: ['products'] }
  });
  return response.json();
}

// Documents endpoint removed - not available in backend

// About page is now static - no API needed

// Product Gallery API
export interface GalleryImage {
  id: string;
  productId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  cdnUrl?: string;
  order: number;
  folderName?: string;
  createdAt: string;
  updatedAt?: string;
}

export async function getProductGallery(productId: string): Promise<GalleryImage[]> {
  const response = await fetchWithError(`${getApiBaseUrl()}/api/products/${productId}/gallery`, {
    next: { revalidate: 3600, tags: ['products', `product:${productId}`, 'gallery'] }
  });
  return response.json();
}