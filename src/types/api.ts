/**
 * Types for the unified API contract
 */

// Unified Error Response from Backend
export interface ApiErrorResponse {
  timestamp: string;
  path: string;
  errorCode: string;
  args: Record<string, any>;
}

// ============================================================================
// NEW PRODUCT ARCHITECTURE - MasterProduct + ProductVariant System
// ============================================================================

// Master Product DTO - Product concept (e.g., "ENDEAVOUR Robot Model")
export interface MasterProductDto {
  // Basic Information
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  longDescription: string | null;

  // Categorization
  productCategory: 'MODEL_KIT' | 'MERCHANDISE' | 'ELECTRONICS' | 'ACCESSORIES' | 'DIGITAL_DOWNLOAD';
  hasVariants: boolean;

  // SEO & Marketing
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  featured: boolean;
  bestseller: boolean;
  newProduct: boolean;
  sortOrder: number | null;
  featuredImageUrl: string | null;
  videoUrl: string | null;

  // Frontend Presentation (JSON fields from backend)
  model3dViewerUrl: string | null;  // CDN URL to .glb file
  featuresJson: string | null;  // JSON array: ["Feature 1", "Feature 2", ...]
  interactionInstructionsJson: string | null;  // JSON array for 3D viewer
  modelViewerSettingsJson: string | null;  // JSON object with viewer settings
  tabsJson: string | null;  // JSON array of tab objects

  // Legal & Compliance
  manufacturer: string | null;
  brand: string | null;
  warrantyMonths: number | null;
  countryOfManufacture: string | null;
  requiresCeMarking: boolean;
  safetyWarnings: string | null;

  // Status
  active: boolean;
  publishedAt: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relationships (loaded separately or included in response)
  variants?: ProductVariantDto[];
  gallery?: ProductGalleryDto[];
}

// Product Variant DTO - Sellable SKU (e.g., "Digital Edition €89.90")
export interface ProductVariantDto {
  id: number;
  masterProductId: number;
  variantName: string;
  sku: string;
  variantType: 'DIGITAL_ONLY' | 'PHYSICAL_ONLY' | 'HYBRID';
  fulfillmentType: 'DIGITAL' | 'PHYSICAL' | 'MIXED';

  // Pricing (Slovak VAT included)
  priceWithVat: number;
  priceWithoutVat: number;
  vatRate: number;
  vatAmount: number;
  currency: string;

  // Stock management
  stockQuantity: number;
  trackInventory: boolean;
  availabilityStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER' | 'DISCONTINUED' | 'BACKORDERED';
  lowStockThreshold: number | null;
  reorderPoint: number | null;
  reorderQuantity: number | null;

  // Digital content
  hasDigitalContent: boolean;
  isDownloadable: boolean;
  digitalFileUrl: string | null;
  digitalFileSizeBytes: number | null;
  downloadLimit: number;
  downloadExpiryDays: number;

  // Physical properties
  requiresShipping: boolean;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;

  // Status
  active: boolean;  // Changed from isActive to match backend
  createdAt: string;
  updatedAt: string;
}

// Variant Component DTO - Bill of Materials
export interface VariantComponentDto {
  id: number;
  variantId: number;
  componentType: 'STL_FILES' | 'MECHANICAL_PARTS' | 'ELECTRONICS' | 'PRINTED_PARTS' | 'ASSEMBLY_GUIDE' | 'SOFTWARE';
  componentName: string;
  description: string | null;
  isDigital: boolean;
  isPhysical: boolean;

  // Digital component fields
  filePath: string | null;
  fileSizeBytes: number | null;
  fileFormat: string | null;

  // Physical component fields
  quantity: number | null;
  weightGrams: number | null;

  // Ordering
  displayOrder: number;
  createdAt: string;
}

// Product Gallery DTO - Product images
export interface ProductGalleryDto {
  id: string; // UUID
  productId: number | null; // Legacy products table
  masterProductId: number | null; // New architecture
  variantId: number | null; // Optional: variant-specific image
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  url: string; // Direct URL
  cdnUrl: string; // CDN optimized URL
  thumbnailUrl: string; // Thumbnail version
  displayOrder: number | null;
  primary: boolean; // Is primary/featured image?
  folderName: string | null;
  createdAt: string;
  updatedAt: string;
}

// Product Download DTO - Secure download tokens
export interface ProductDownloadDto {
  id: number;
  orderId: number;
  orderItemId: number;
  variantId: number;
  componentId: number | null;
  downloadToken: string;
  downloadUrl: string;
  tokenType: 'EMAIL' | 'REGENERATED' | 'ADMIN_CREATED';
  maxDownloads: number;
  downloadCount: number;
  expiresAt: string;
  isActive: boolean;
  revokedAt: string | null;
  createdAt: string;
}

// Paginated Response from Backend
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Billing Address with B2B support
export interface BillingAddress {
  email: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  // B2B fields
  companyName?: string;
  companyId?: string; // IČO
  taxId?: string; // DIČ
  vatId?: string; // IČ DPH
  isCompany?: boolean;
}

// PayPal Order Creation
export interface CreatePaymentRequest {
  orderItems: Array<{
    product: { id: number };
    quantity: number;
    price: number;
    currency: string;
  }>;
  totalAmount: number;
  currency: string;
  user: BillingAddress;
  // Optional fields for new features
  discountCode?: string;
  shippingRateId?: number;
  shippingCost?: number;
}

export interface CreateOrderResponse {
  id: string;
  status: string;
  orderNumber: string;
}

export interface CaptureOrderRequest {
  orderId: string;
}

export interface PaymentDTO {
  paymentMethod: string;
  status: string;
  paymentUrl: string;
  orderId: string;
}

// Meta endpoints
export type SupportedLocales = string[];

// Common API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
}

// API Error mapping for frontend
export const API_ERROR_CODES = {
  ERR_NOT_FOUND: 'errors.not_found',
  ERR_BAD_REQUEST: 'errors.bad_request', 
  ERR_INTERNAL: 'errors.server_error',
  ERR_UNAUTHORIZED: 'errors.unauthorized',
  ERR_FORBIDDEN: 'errors.forbidden',
  ERR_VALIDATION: 'errors.validation',
  ERR_PAYMENT_FAILED: 'errors.payment_failed',
  ERR_INSUFFICIENT_STOCK: 'errors.insufficient_stock',
  ERR_INVALID_CREDENTIALS: 'errors.invalid_credentials',
  ERR_EMAIL_EXISTS: 'errors.email_already_exists',
  ERR_WEAK_PASSWORD: 'errors.weak_password',
  ERR_SESSION_EXPIRED: 'errors.session_expired',
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_CODES;

// Contact Form Types
export interface ContactFormRequest {
  email: string;
  subject: string;
  text: string;
}

export interface ContactFormResponse {
  message: string;
}