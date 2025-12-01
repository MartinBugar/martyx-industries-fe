/**
 * Types for the unified API contract
 */

// Unified Error Response from Backend
export interface ApiErrorResponse {
  timestamp: string;
  path: string;
  code?: string;           // New format from GlobalExceptionHandler
  errorCode?: string;      // Legacy format (kept for backwards compatibility)
  message?: string;        // User-friendly message from backend
  correlationId?: string;  // Request correlation ID for debugging
  status?: number;         // HTTP status code
  error?: string;          // HTTP status reason phrase
  args?: Record<string, any>;  // Dynamic arguments for i18n interpolation
  details?: Array<{        // Field-level validation errors
    field: string;
    message: string;
    rejectedValue?: any;
    constraint?: string;
  }>;
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
  featuresJson: string | null;  // DEPRECATED - Use ProductTab system instead
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

  // Build Difficulty & Info (V46)
  difficultyLevel?: string | null; // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
  buildInfo?: BuildInfoDto | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relationships (loaded separately or included in response)
  variants?: ProductVariantDto[];
  gallery?: ProductGalleryDto[];
}

// Build Info DTO - Build specifications for products
export interface BuildInfoDto {
  partsCount: number;
  screwsCount: number;
  filamentGrams: number;
  filamentType: string;
  printTimeHours: number;
  assemblyTimeHours: number;
  requiredTools: string[];
  skillsRequired: string[];
  estimatedTotalHours: number;
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
  availabilityStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER' | 'DISCONTINUED' | 'BACKORDERED';
  lowStockThreshold: number | null;
  reorderPoint: number | null;
  reorderQuantity: number | null;

  // Real-time stock availability (NEW - for stock reservation system)
  reservedQuantity?: number;  // Currently reserved by other users
  availableStock?: number;     // stockQuantity - reservedQuantity

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

  // Images (from master product gallery)
  imageUrl?: string;       // Full-size primary image URL
  thumbnailUrl?: string;   // Optimized thumbnail for cart/listing display

  // Components (What's Included)
  components?: VariantComponentDto[];
}

// Variant Component DTO - Bill of Materials
export interface VariantComponentDto {
  id: number;
  variantId: number;
  componentType: 'STL_FILES' | 'MECHANICAL_PARTS' | 'ELECTRONICS' | 'PRINTED_PARTS' | 'ASSEMBLY_GUIDE' | 'SOFTWARE' | 'BOM' | 'FASTENERS' | 'TOOLS' | 'GIFT' | 'PACKAGING' | 'OTHER';
  componentName: string;
  description: string | null;
  digital: boolean;
  physical: boolean;

  // Digital component fields
  filePath: string | null;
  fileSizeBytes: number | null;
  fileFormat: string | null;
  fileMimeType: string | null;

  // Physical component fields
  quantity: number | null;
  weightGrams: number | null;

  // UI Metadata (from backend enum)
  iconName?: string;
  badgeColor?: string;
  label?: string;
  formattedFileSize?: string;

  // Ordering
  displayOrder: number;
  highlighted?: boolean;
  createdAt: string;
  updatedAt?: string;
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
  isHover?: boolean; // Is hover image for product card?
  folderName: string | null;
  createdAt: string;
  updatedAt: string;
}

// Product Tab DTO - Configurable product tabs
export interface ProductTabDto {
  id: number;

  // Ownership (exactly one will be set)
  masterProductId: number | null;
  variantId: number | null;

  // Identification
  tabKey: string; // e.g., 'details', 'features', 'specs'
  tabLabel: string; // Display label shown to users

  // Content
  contentType: 'HTML' | 'MARKDOWN' | 'JSON' | 'COMPONENT';
  contentHtml: string | null;
  contentMarkdown: string | null;
  contentJson: string | null;
  componentName: string | null;

  // Display Settings
  displayOrder: number;
  iconName: string | null;
  isActive: boolean;

  // Visibility Rules
  showForVariantType: string | null;
  requiresAuthentication: boolean;

  // Internationalization
  locale: string; // e.g., 'en', 'sk'

  // Metadata
  description: string | null;
  cssClass: string | null;

  // Audit Fields
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
}

// Product Tab Create/Update Request
export interface ProductTabCreateRequest {
  // Ownership (exactly one must be provided)
  masterProductId?: number | null;
  variantId?: number | null;

  // Identification
  tabKey: string;
  tabLabel: string;

  // Content
  contentType: 'HTML' | 'MARKDOWN' | 'JSON' | 'COMPONENT';
  contentHtml?: string | null;
  contentMarkdown?: string | null;
  contentJson?: string | null;
  componentName?: string | null;

  // Display Settings
  displayOrder: number;
  iconName?: string | null;
  isActive?: boolean;

  // Visibility Rules
  showForVariantType?: string | null;
  requiresAuthentication?: boolean;

  // Internationalization
  locale: string;

  // Metadata
  description?: string | null;
  cssClass?: string | null;
}

// Product Tab Template - Reusable tab blueprints
export interface ProductTabTemplate {
  id: number;
  templateName: string;
  templateKey: string;
  defaultTabKey: string;
  defaultTabLabel: string;
  contentType: 'HTML' | 'MARKDOWN' | 'JSON' | 'COMPONENT';
  defaultContentHtml: string | null;
  defaultContentMarkdown: string | null;
  defaultContentJson: string | null;
  defaultComponentName: string | null;
  defaultIconName: string | null;
  defaultDisplayOrder: number;
  description: string | null;
  category: string | null;
  isActive: boolean;
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

// Stripe Order Creation
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

// API Error mapping for frontend - maps backend ErrorCode to i18n keys
export const API_ERROR_CODES = {
  // Legacy error codes (keep for backwards compatibility)
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

  // ==================== CART ERRORS ====================
  CART_001: 'errors.cart.invalid_quantity',
  CART_002: 'errors.cart.product_not_found',
  CART_003: 'errors.cart.out_of_stock',
  CART_004: 'errors.cart.invalid_variant',
  CART_005: 'errors.cart.digital_product_limit',
  CART_006: 'errors.cart.empty',
  CART_007: 'errors.cart.item_not_found',
  CART_008: 'errors.cart.not_found',
  CART_009: 'errors.cart.max_items_exceeded',
  CART_010: 'errors.cart.product_not_available',
  CART_011: 'errors.cart.insufficient_stock',

  // ==================== ORDER ERRORS ====================
  ORDER_001: 'errors.order.not_found',
  ORDER_002: 'errors.order.already_paid',
  ORDER_003: 'errors.order.invalid_status',
  ORDER_004: 'errors.order.unauthorized',
  ORDER_005: 'errors.order.cancelled',
  ORDER_006: 'errors.order.expired',
  ORDER_007: 'errors.order.invalid_amount',
  ORDER_008: 'errors.order.missing_billing_info',

  // ==================== PAYMENT ERRORS ====================
  PAYMENT_001: 'errors.payment.failed',
  PAYMENT_002: 'errors.payment.amount_mismatch',
  PAYMENT_003: 'errors.payment.duplicate',
  PAYMENT_004: 'errors.payment.provider_error',
  PAYMENT_005: 'errors.payment.cancelled',
  PAYMENT_006: 'errors.payment.not_found',
  PAYMENT_007: 'errors.payment.refund_failed',

  // ==================== DOWNLOAD ERRORS ====================
  DOWNLOAD_001: 'errors.download.expired',
  DOWNLOAD_002: 'errors.download.limit_exceeded',
  DOWNLOAD_003: 'errors.download.not_found',
  DOWNLOAD_004: 'errors.download.unauthorized',
  DOWNLOAD_005: 'errors.download.invalid_token',
  DOWNLOAD_006: 'errors.download.file_not_found',
  DOWNLOAD_007: 'errors.download.order_not_paid',

  // ==================== PRODUCT ERRORS ====================
  PRODUCT_001: 'errors.product.not_found',
  PRODUCT_002: 'errors.product.variant_not_found',
  PRODUCT_003: 'errors.product.unavailable',
  PRODUCT_004: 'errors.product.out_of_stock',
  PRODUCT_005: 'errors.product.invalid_price',

  // ==================== AUTH ERRORS ====================
  AUTH_001: 'errors.auth.invalid_credentials',
  AUTH_002: 'errors.auth.token_expired',
  AUTH_003: 'errors.auth.token_invalid',
  AUTH_004: 'errors.auth.insufficient_permissions',
  AUTH_005: 'errors.auth.account_locked',
  AUTH_006: 'errors.auth.email_not_confirmed',
  AUTH_007: 'errors.auth.weak_password',
  AUTH_008: 'errors.auth.email_already_exists',
  AUTH_009: 'errors.auth.refresh_token_expired',
  AUTH_010: 'errors.auth.refresh_token_invalid',
  AUTH_011: 'errors.auth.token_revoked',
  AUTH_012: 'errors.auth.user_not_found',

  // ==================== DISCOUNT ERRORS ====================
  DISCOUNT_001: 'errors.discount.invalid_code',
  DISCOUNT_002: 'errors.discount.expired',
  DISCOUNT_003: 'errors.discount.not_applicable',
  DISCOUNT_004: 'errors.discount.usage_limit_exceeded',
  DISCOUNT_005: 'errors.discount.minimum_not_met',

  // ==================== SHIPPING ERRORS ====================
  SHIPPING_001: 'errors.shipping.rate_not_found',
  SHIPPING_002: 'errors.shipping.unavailable',
  SHIPPING_003: 'errors.shipping.invalid_address',
  SHIPPING_004: 'errors.shipping.calculation_failed',

  // ==================== INVOICE ERRORS ====================
  INVOICE_001: 'errors.invoice.not_found',
  INVOICE_002: 'errors.invoice.generation_failed',
  INVOICE_003: 'errors.invoice.unauthorized',
  INVOICE_004: 'errors.invoice.already_exists',

  // ==================== VALIDATION ERRORS ====================
  VALIDATION_001: 'errors.validation.failed',
  VALIDATION_002: 'errors.validation.missing_required_field',
  VALIDATION_003: 'errors.validation.invalid_format',
  VALIDATION_004: 'errors.validation.value_out_of_range',

  // ==================== CONCURRENCY ERRORS ====================
  CONCURRENCY_001: 'errors.concurrency.modified',
  CONCURRENCY_002: 'errors.concurrency.optimistic_lock',

  // ==================== GENERIC ERRORS ====================
  INTERNAL_001: 'errors.server_error',
  RESOURCE_001: 'errors.not_found',
  SERVICE_001: 'errors.service_unavailable',
  REQUEST_001: 'errors.bad_request',
  UNAUTHORIZED_001: 'errors.unauthorized',
  FORBIDDEN_001: 'errors.forbidden',
  CONFLICT_001: 'errors.conflict',
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_CODES;

// Contact Form Types
export interface ContactFormRequest {
  email: string;
  subject: string;
  text: string;
  // Anti-bot fields
  website?: string;  // Honeypot field - should be empty
  formStartTime?: number;  // Timestamp when form was loaded
  verificationToken?: string;  // Token starting with "verify_"
}

export interface ContactFormResponse {
  message: string;
}

// ============================================================================
// PRODUCT ATTACHMENTS - Public Files (Assembly Guides, Manuals, etc.)
// ============================================================================

export interface ProductAttachmentDto {
  id: number;
  masterProductId?: number | null;
  variantId?: number | null;

  // File Info
  fileName: string;
  fileUrl: string;
  cdnUrl?: string | null;
  fileSizeBytes?: number | null;
  fileFormat?: string | null;
  mimeType?: string | null;
  formattedFileSize?: string | null;

  // Display
  displayLabel: string;
  description?: string | null;
  attachmentType?: string | null;
  iconName?: string | null;

  // Ordering
  displayOrder: number;
  active: boolean;
  featured: boolean;

  // Tracking
  downloadCount?: number;
  lastDownloadedAt?: string;

  // I18n
  locale: string;

  // Audit
  createdAt: string;
  updatedAt: string;
}