import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

// =========================================================================
// MASTER PRODUCT TYPES (New Architecture)
// =========================================================================

export interface MasterProductDto {
  // Basic Information
  id?: number;
  name: string;
  slug?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;

  // Categorization
  productCategory?: string | null; // MODEL_KIT, MERCHANDISE, ELECTRONICS, ACCESSORIES, DIGITAL_DOWNLOAD
  hasVariants?: boolean;

  // SEO & Marketing
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  featured?: boolean;
  bestseller?: boolean;
  newProduct?: boolean;
  sortOrder?: number | null;
  featuredImageUrl?: string | null;
  videoUrl?: string | null;

  // Frontend Presentation (3D Viewer, Features, Tabs)
  model3dViewerUrl?: string | null;
  featuresJson?: string | null; // JSON array: ["Feature 1", "Feature 2"]
  interactionInstructionsJson?: string | null;
  modelViewerSettingsJson?: string | null;
  tabsJson?: string | null;

  // Legal & Compliance
  manufacturer?: string | null;
  brand?: string | null;
  warrantyMonths?: number | null;
  countryOfManufacture?: string | null;
  requiresCeMarking?: boolean;
  safetyWarnings?: string | null;

  // Status
  active?: boolean;
  publishedAt?: string | null; // ISO datetime

  // Relationships
  variants?: ProductVariantDto[];
  gallery?: ProductGalleryDto[];

  // Timestamps
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProductVariantDto {
  // Identity
  id?: number;
  masterProductId?: number;
  variantName: string; // "Digital Edition", "Mechanical Kit"
  sku: string;

  // Variant Type & Fulfillment
  variantType?: string | null; // DIGITAL_ONLY, PHYSICAL_ONLY, HYBRID
  fulfillmentType?: string | null; // DIGITAL, PHYSICAL, MIXED

  // Pricing (VAT-compliant)
  priceWithVat?: number | null;
  priceWithoutVat?: number | null;
  vatRate?: number | null;
  vatAmount?: number | null;
  currency?: string | null;

  // Discount/Sales
  compareAtPrice?: number | null;
  discountPercentage?: number | null;
  onSale?: boolean;
  saleStartDate?: string | null;
  saleEndDate?: string | null;

  // Legal
  eanCode?: string | null;
  barcodeType?: string | null;

  // Stock & Inventory
  stockQuantity?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  lowStockThreshold?: number | null;
  availabilityStatus?: string | null; // IN_STOCK, OUT_OF_STOCK, PRE_ORDER, DISCONTINUED, BACKORDERED

  // Ordering Limits
  minOrderQuantity?: number | null;
  maxOrderQuantity?: number | null;

  // Physical Properties
  weightGrams?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;

  // Digital Properties
  hasDigitalContent?: boolean;
  digitalFileUrl?: string | null;
  digitalFileSizeBytes?: number | null;
  digitalFileFormat?: string | null;

  // Fulfillment Settings
  requiresShipping?: boolean;
  downloadable?: boolean;
  downloadLimit?: number | null;
  downloadExpiryDays?: number | null;

  // SEO (variant-specific overrides)
  metaTitle?: string | null;
  metaDescription?: string | null;

  // Status
  active?: boolean;
  inStock?: boolean; // Computed field

  // Components (what's included)
  components?: VariantComponentDto[];

  // Timestamps
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface VariantComponentDto {
  id?: number;
  componentName: string;
  componentType?: string | null; // DIGITAL, PHYSICAL
  quantity?: number;
  description?: string | null;
  filePath?: string | null;
  fileSizeBytes?: number | null;
  fileFormat?: string | null;
  displayOrder?: number | null;
}

export interface ProductGalleryDto {
  id?: number;
  imageUrl: string;
  altText?: string | null;
  sortOrder?: number;
}

export interface MessageResponse {
  message: string;
}

// Spring Data Page response interface
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// =========================================================================
// LEGACY TYPES (Deprecated - for backward compatibility)
// =========================================================================

export interface BaseProduct {
  id?: number | string;
  name: string;
  sku?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  productType?: 'DIGITAL' | 'PHYSICAL' | string;
  [key: string]: unknown;
}

export interface DigitalProduct extends BaseProduct {
  productType?: 'DIGITAL';
  downloadUrl?: string | null;
  fileSize?: number | null;
  fileFormat?: string | null;
  licenseInfo?: string | null;
  version?: string | null;
  fileContent?: unknown;
  fileName?: string | null;
}

export interface PhysicalProduct extends BaseProduct {
  productType?: 'PHYSICAL';
  stockQuantity?: number | null;
  weight?: number | null;
  dimensions?: string | null;
  material?: string | null;
  countryOfOrigin?: string | null;
  shippingTime?: number | null;
}

// =========================================================================
// ADMIN PRODUCTS SERVICE
// =========================================================================

export const adminProductsService = {
  /**
   * Get paginated list of master products (admin view - includes unpublished)
   */
  async getMasterProducts(
    params?: { category?: string; active?: boolean; search?: string },
    page: number = 0,
    size: number = 20,
    sortBy: string = 'id',
    sortDir: string = 'DESC'
  ): Promise<PageResponse<MasterProductDto>> {
    const qs: string[] = [];
    if (params?.category) qs.push(`category=${encodeURIComponent(params.category)}`);
    if (typeof params?.active === 'boolean') qs.push(`active=${params.active}`);
    if (params?.search && params.search.trim()) qs.push(`search=${encodeURIComponent(params.search.trim())}`);
    qs.push(`page=${page}`);
    qs.push(`size=${size}`);
    qs.push(`sortBy=${sortBy}`);
    qs.push(`sortDir=${sortDir}`);

    const url = `${API_BASE_URL}/api/admin/products?${qs.join('&')}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    const data = await handleResponse(resp);

    // Backend returns paginated response
    if (data && typeof data === 'object' && 'content' in data) {
      return data as PageResponse<MasterProductDto>;
    }

    // Fallback for non-paginated response
    return {
      content: Array.isArray(data) ? data : [],
      totalElements: Array.isArray(data) ? data.length : 0,
      totalPages: 1,
      size: Array.isArray(data) ? data.length : 0,
      number: 0,
      first: true,
      last: true
    };
  },

  /**
   * Get master product by ID
   */
  async getMasterProductById(id: string | number): Promise<MasterProductDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    return await handleResponse(resp) as MasterProductDto;
  },

  /**
   * Create new master product
   */
  async createMasterProduct(payload: MasterProductDto): Promise<MasterProductDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    return await handleResponse(resp) as MasterProductDto;
  },

  /**
   * Update existing master product
   */
  async updateMasterProduct(id: string | number, payload: MasterProductDto): Promise<MasterProductDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    if (resp.status === 204) {
      return await adminProductsService.getMasterProductById(id);
    }
    return await handleResponse(resp) as MasterProductDto;
  },

  /**
   * Delete master product
   */
  async deleteMasterProduct(id: string | number): Promise<MessageResponse | void> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });
    if (resp.status === 204) return;
    return await handleResponse(resp) as MessageResponse;
  },

  // =========================================================================
  // LEGACY METHODS (Deprecated - kept for backward compatibility)
  // =========================================================================

  /**
   * @deprecated Use getMasterProducts instead
   */
  async getProducts(
    params?: { category?: string; active?: boolean; search?: string },
    page: number = 0,
    size: number = 20,
    sortBy: string = 'id',
    sortDir: string = 'DESC'
  ): Promise<PageResponse<BaseProduct>> {
    // Map to new API
    const result = await this.getMasterProducts(params, page, size, sortBy, sortDir);
    // Convert MasterProductDto to BaseProduct for backward compatibility
    return {
      ...result,
      content: result.content.map(mp => ({
        id: mp.id,
        name: mp.name,
        sku: mp.variants?.[0]?.sku || null,
        category: mp.productCategory,
        price: mp.variants?.[0]?.priceWithVat ? Number(mp.variants[0].priceWithVat) : null,
        currency: mp.variants?.[0]?.currency || null,
        description: mp.shortDescription,
        imageUrl: mp.featuredImageUrl,
        active: mp.active,
        createdAt: mp.createdAt,
        updatedAt: mp.updatedAt,
        productType: mp.variants?.[0]?.variantType || 'PHYSICAL',
      }))
    };
  },

  /**
   * @deprecated Use getMasterProductById instead
   */
  async getProductById(id: string | number): Promise<BaseProduct> {
    const mp = await this.getMasterProductById(id);
    return {
      id: mp.id,
      name: mp.name,
      sku: mp.variants?.[0]?.sku || null,
      category: mp.productCategory,
      price: mp.variants?.[0]?.priceWithVat ? Number(mp.variants[0].priceWithVat) : null,
      currency: mp.variants?.[0]?.currency || null,
      description: mp.shortDescription,
      imageUrl: mp.featuredImageUrl,
      active: mp.active,
      createdAt: mp.createdAt,
      updatedAt: mp.updatedAt,
      productType: mp.variants?.[0]?.variantType || 'PHYSICAL',
    };
  },

  /**
   * @deprecated Master products don't have digital/physical types anymore - use variants
   */
  async createDigitalProduct(_payload: DigitalProduct): Promise<BaseProduct> {
    throw new Error('Deprecated: Use createMasterProduct with ProductVariant instead');
  },

  /**
   * @deprecated Master products don't have digital/physical types anymore - use variants
   */
  async createPhysicalProduct(_payload: PhysicalProduct): Promise<BaseProduct> {
    throw new Error('Deprecated: Use createMasterProduct with ProductVariant instead');
  },

  /**
   * @deprecated Use updateMasterProduct instead
   */
  async updateDigitalProduct(_id: string | number, _payload: DigitalProduct): Promise<BaseProduct> {
    throw new Error('Deprecated: Use updateMasterProduct instead');
  },

  /**
   * @deprecated Use updateMasterProduct instead
   */
  async updatePhysicalProduct(_id: string | number, _payload: PhysicalProduct): Promise<BaseProduct> {
    throw new Error('Deprecated: Use updateMasterProduct instead');
  },

  /**
   * @deprecated Use deleteMasterProduct instead
   */
  async deleteProduct(id: string | number): Promise<MessageResponse | void> {
    return this.deleteMasterProduct(id);
  },

  // =========================================================================
  // VARIANT CRUD (Admin only)
  // =========================================================================

  /**
   * Create new variant for a master product
   */
  async createVariant(masterProductId: string | number, payload: ProductVariantDto): Promise<ProductVariantDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/${masterProductId}/variants`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    return await handleResponse(resp) as ProductVariantDto;
  },

  /**
   * Update existing variant
   */
  async updateVariant(id: string | number, payload: ProductVariantDto): Promise<ProductVariantDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/variants/${id}`, {
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    return await handleResponse(resp) as ProductVariantDto;
  },

  /**
   * Toggle variant active status (enable/disable).
   * Safe endpoint that only modifies the active flag without affecting other variant data.
   */
  async toggleVariantActive(id: string | number): Promise<{ id: number; active: boolean; message: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/variants/${id}/toggle-active`, {
      method: 'PATCH',
      headers: defaultHeaders as HeadersInit,
    });
    return await handleResponse(resp) as { id: number; active: boolean; message: string };
  },

  /**
   * Delete variant
   */
  async deleteVariant(id: string | number): Promise<MessageResponse | void> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/variants/${id}`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });
    if (resp.status === 204) return;
    return await handleResponse(resp) as MessageResponse;
  },

  // =========================================================================
  // COMPONENT CRUD (Admin only)
  // =========================================================================

  /**
   * Create new component for a variant
   */
  async createComponent(variantId: string | number, payload: VariantComponentDto): Promise<VariantComponentDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/variants/${variantId}/components`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    return await handleResponse(resp) as VariantComponentDto;
  },

  /**
   * Update existing component
   */
  async updateComponent(id: string | number, payload: VariantComponentDto): Promise<VariantComponentDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/components/${id}`, {
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    return await handleResponse(resp) as VariantComponentDto;
  },

  /**
   * Delete component
   */
  async deleteComponent(id: string | number): Promise<MessageResponse | void> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/components/${id}`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });
    if (resp.status === 204) return;
    return await handleResponse(resp) as MessageResponse;
  },
};
