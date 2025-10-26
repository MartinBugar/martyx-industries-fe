import { productService } from './productService';
import type { MasterProductDto, ProductVariantDto, PaginatedResponse } from '../types/api';
import {
  hardcodedProductsData,
  type HardcodedProductData,
  type Product,
  type ProductVariant
} from '../data/productData';
import { getCurrentLanguage } from './apiUtils';
import { getLocalizedHardcodedProductDataForService } from '../utils/productTranslationUtils';
import i18n from '../i18n';

interface ProductError extends Error {
  code?: string;
}

/**
 * Hybrid Product Service - NEW VARIANT ARCHITECTURE
 * Combines backend MasterProduct + ProductVariant data with hardcoded frontend-specific data
 * to create complete Product objects for use throughout the application
 */
export class HybridProductService {
  private productCache = new Map<number, Product>();
  private allProductsCache: Product[] | null = null;
  private lastCacheTime = 0;
  private lastCacheLanguage = '';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Listen for language changes and clear cache
    i18n.on('languageChanged', () => {
      console.log('🌐 Language changed, clearing product cache');
      this.clearCache();
    });

    // Force clear cache in development to ensure fresh data
    if (import.meta.env.DEV) {
      console.log('🧹 DEV: Force clearing product cache for fresh data');
      this.clearCache();
    }
  }

  /**
   * Get hardcoded data for a master product by its ID with localization
   */
  private getHardcodedDataByMasterProductId(masterProductId: number): HardcodedProductData | null {
    const baseData = hardcodedProductsData.find(data => data.masterProductId === masterProductId);
    if (!baseData) return null;

    // Get localized data and merge with base data
    const localizedData = getLocalizedHardcodedProductDataForService(masterProductId.toString());

    const result = {
      ...baseData,
      ...localizedData
    };

    if (import.meta.env.DEV) {
      console.log('🔧 HybridService: getHardcodedDataByMasterProductId for', masterProductId, 'tabs count:', result.tabs?.length, 'tab ids:', result.tabs?.map(t => t.id));
    }

    return result;
  }

  /**
   * Convert ProductVariantDto to ProductVariant (simplified for UI)
   */
  private convertToProductVariant(variantDto: ProductVariantDto): ProductVariant {
    return {
      variantId: variantDto.id,
      variantName: variantDto.variantName,
      priceWithVat: variantDto.priceWithVat,
      priceWithoutVat: variantDto.priceWithoutVat,
      currency: variantDto.currency,
      sku: variantDto.sku,
      variantType: variantDto.variantType,
      stockQuantity: variantDto.stockQuantity,
      availabilityStatus: variantDto.availabilityStatus
    };
  }

  /**
   * Parse JSON field with fallback
   */
  private parseJsonField<T>(jsonString: string | null, fallback: T): T {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Failed to parse JSON field:', error, 'Value:', jsonString);
      return fallback;
    }
  }

  /**
   * Merge MasterProduct + ProductVariant into complete Product
   * Now uses backend JSON fields instead of hardcoded data
   */
  private mergeProductData(
    masterProduct: MasterProductDto,
    variant: ProductVariantDto,
    allVariants: ProductVariantDto[],
    hardcodedData: HardcodedProductData | null
  ): Product {
    console.log('🔀 HybridService: mergeProductData called');
    console.log('🔀 MasterProduct:', masterProduct);
    console.log('🔀 Selected Variant:', variant);
    console.log('🔀 All Variants:', allVariants.length);

    // Parse JSON fields from backend with fallbacks to hardcoded data
    const features = this.parseJsonField<string[]>(
      masterProduct.featuresJson,
      hardcodedData?.features || []
    );

    const interactionInstructions = this.parseJsonField<string[]>(
      masterProduct.interactionInstructionsJson,
      hardcodedData?.interactionInstructions || ['Click and drag to rotate', 'Scroll to zoom in/out', 'Right-click and drag to pan']
    );

    const modelViewerSettings = this.parseJsonField<any>(
      masterProduct.modelViewerSettingsJson,
      hardcodedData?.modelViewerSettings || undefined
    );

    const tabs = this.parseJsonField<any[]>(
      masterProduct.tabsJson,
      hardcodedData?.tabs || []
    );

    // Use model3dViewerUrl from backend, fallback to hardcoded modelPath
    const modelPath = masterProduct.model3dViewerUrl || hardcodedData?.modelPath || '';

    // Use videoUrl from backend, fallback to hardcoded
    const videoUrl = masterProduct.videoUrl || hardcodedData?.videoUrl || undefined;

    // Gallery from backend (already loaded) or empty array
    const gallery = masterProduct.gallery?.map(img => img.cdnUrl || img.url) || [];

    // Convert all variants to simplified ProductVariant format
    const availableVariants = allVariants.map(v => this.convertToProductVariant(v));

    const result: Product = {
      // From MasterProduct
      masterProductId: masterProduct.id,
      name: masterProduct.name,
      slug: masterProduct.slug,
      description: masterProduct.shortDescription || masterProduct.longDescription || '',
      longDescription: masterProduct.longDescription || undefined,
      productCategory: masterProduct.productCategory,

      // From selected ProductVariant
      variantId: variant.id,
      variantName: variant.variantName,
      sku: variant.sku,
      priceWithVat: variant.priceWithVat,
      priceWithoutVat: variant.priceWithoutVat,
      vatRate: variant.vatRate,
      vatAmount: variant.vatAmount,
      currency: variant.currency,
      variantType: variant.variantType,
      fulfillmentType: variant.fulfillmentType,
      stockQuantity: variant.stockQuantity,
      availabilityStatus: variant.availabilityStatus,
      requiresShipping: variant.requiresShipping,

      // From backend JSON fields (with hardcoded fallback)
      features: features,
      modelPath: modelPath,
      gallery: gallery,
      interactionInstructions: interactionInstructions,
      modelViewerSettings: modelViewerSettings,
      tabs: tabs,
      videoUrl: videoUrl,

      // All available variants for this product
      availableVariants: availableVariants
    };

    console.log('🔀 HybridService: final result:', {
      masterProductId: result.masterProductId,
      variantId: result.variantId,
      variantName: result.variantName,
      price: result.priceWithVat,
      availableVariantsCount: result.availableVariants?.length,
      tabsCount: result.tabs?.length,
      featuresCount: result.features?.length,
      hasModelPath: !!result.modelPath,
      hasVideoUrl: !!result.videoUrl
    });

    return result;
  }

  /**
   * Check if cache is still valid (time and language)
   */
  private isCacheValid(): boolean {
    const currentLanguage = getCurrentLanguage();
    const isTimeValid = Date.now() - this.lastCacheTime < this.CACHE_DURATION;
    const isLanguageValid = this.lastCacheLanguage === currentLanguage;

    return isTimeValid && isLanguageValid;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.productCache.clear();
    this.allProductsCache = null;
    this.lastCacheTime = 0;
    this.lastCacheLanguage = '';
    if (import.meta.env.DEV) {
      console.log('🧹 HybridService: Cache cleared');
    }
  }

  /**
   * Get all products with optional category filter
   * NEW: Fetches master products and their variants, merges with hardcoded data
   */
  async getProducts(category?: string): Promise<Product[]> {
    try {
      // Use cache for all products (no category filter) if valid
      if (!category && this.allProductsCache && this.isCacheValid()) {
        console.log('📦 Using cached products');
        return this.allProductsCache;
      }

      const currentLanguage = getCurrentLanguage();

      // Fetch master products from backend
      const masterProductsResponse = await productService.getMasterProducts(category, currentLanguage);

      // Handle paginated response format
      let masterProducts: MasterProductDto[];
      if (Array.isArray(masterProductsResponse)) {
        masterProducts = masterProductsResponse;
      } else if (masterProductsResponse && 'content' in masterProductsResponse && Array.isArray(masterProductsResponse.content)) {
        masterProducts = (masterProductsResponse as PaginatedResponse<MasterProductDto>).content;
      } else {
        console.error('Backend returned unexpected response format:', masterProductsResponse);
        throw new Error('Invalid response format from backend: expected array or paginated response');
      }

      // Filter only active products
      const activeMasterProducts = masterProducts.filter(mp => mp.active);

      // For each master product, fetch variants and merge data
      const hybridProducts: Product[] = [];

      for (const masterProduct of activeMasterProducts) {
        try {
          // Fetch all variants for this master product
          const variants = await productService.getVariantsForMasterProduct(masterProduct.id, currentLanguage);

          // Filter only active variants
          const activeVariants = variants.filter(v => v.active);

          if (activeVariants.length === 0) {
            console.warn(`Master product ${masterProduct.id} has no active variants, skipping`);
            continue;
          }

          // Use the first variant as default (or could be cheapest, most popular, etc.)
          const defaultVariant = activeVariants[0];

          // Get hardcoded data for this master product
          const hardcodedData = this.getHardcodedDataByMasterProductId(masterProduct.id);

          // Merge all data
          const mergedProduct = this.mergeProductData(masterProduct, defaultVariant, activeVariants, hardcodedData);

          // Cache individual products using master product ID
          this.productCache.set(masterProduct.id, mergedProduct);

          hybridProducts.push(mergedProduct);
        } catch (error) {
          console.error(`Failed to fetch variants for master product ${masterProduct.id}:`, error);
          // Skip this product if variants can't be fetched
          continue;
        }
      }

      // Cache all products if no category filter
      if (!category) {
        this.allProductsCache = hybridProducts;
        this.lastCacheTime = Date.now();
        this.lastCacheLanguage = currentLanguage;
      }

      console.log(`✅ Fetched ${hybridProducts.length} products with variants`);
      return hybridProducts;

    } catch (error) {
      console.error('Failed to fetch products from backend:', error);
      throw error;
    }
  }

  /**
   * Get a single product by master product ID
   * NEW: Fetches master product + variants, merges with hardcoded data
   */
  async getProductById(masterProductId: number): Promise<Product> {
    try {
      const currentLanguage = getCurrentLanguage();

      // Check cache first
      if (this.productCache.has(masterProductId) && this.isCacheValid()) {
        if (import.meta.env.MODE === 'development') {
          console.log(`📦 Using cached product ${masterProductId} for language: ${currentLanguage}`);
        }
        return this.productCache.get(masterProductId)!;
      }

      if (import.meta.env.MODE === 'development') {
        console.log(`🔄 Fetching master product ${masterProductId} from backend for language: ${currentLanguage}`);
      }

      // Fetch master product from backend
      const masterProduct = await productService.getMasterProduct(masterProductId, currentLanguage);

      // Check if master product is active
      if (!masterProduct.active) {
        const inactiveError: ProductError = new Error(`Master product ${masterProductId} is not active`);
        inactiveError.code = 'PRODUCT_INACTIVE';
        throw inactiveError;
      }

      // Fetch all variants for this master product
      const variants = await productService.getVariantsForMasterProduct(masterProductId, currentLanguage);

      // Filter only active variants
      const activeVariants = variants.filter(v => v.active);

      if (activeVariants.length === 0) {
        const noVariantsError: ProductError = new Error(`Master product ${masterProductId} has no active variants`);
        noVariantsError.code = 'NO_VARIANTS';
        throw noVariantsError;
      }

      // Use the first variant as default
      const defaultVariant = activeVariants[0];

      // Get hardcoded data
      const hardcodedData = this.getHardcodedDataByMasterProductId(masterProductId);

      // Merge all data
      const mergedProduct = this.mergeProductData(masterProduct, defaultVariant, activeVariants, hardcodedData);

      // Cache the result
      this.productCache.set(masterProductId, mergedProduct);
      this.lastCacheTime = Date.now();
      this.lastCacheLanguage = currentLanguage;

      return mergedProduct;

    } catch (error) {
      // If the error is specifically about inactive product or no variants, don't use fallback
      if ((error as ProductError).code === 'PRODUCT_INACTIVE' || (error as ProductError).code === 'NO_VARIANTS') {
        throw error;
      }

      console.error(`Failed to fetch product ${masterProductId} from backend:`, error);
      throw error;
    }
  }

  /**
   * Get product by string ID (for backward compatibility with routing)
   */
  async getProductByStringId(id: string): Promise<Product> {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error(`Invalid master product ID: ${id}`);
    }
    return this.getProductById(numericId);
  }

  /**
   * Get product by variant ID (when user selects a specific variant)
   */
  async getProductByVariantId(variantId: number): Promise<Product> {
    try {
      const currentLanguage = getCurrentLanguage();

      // Fetch the variant
      const variant = await productService.getVariant(variantId, currentLanguage);

      if (!variant.active) {
        throw new Error(`Variant ${variantId} is not active`);
      }

      // Fetch the master product
      const masterProduct = await productService.getMasterProduct(variant.masterProductId, currentLanguage);

      if (!masterProduct.active) {
        throw new Error(`Master product ${variant.masterProductId} is not active`);
      }

      // Fetch all variants for this master product
      const allVariants = await productService.getVariantsForMasterProduct(variant.masterProductId, currentLanguage);
      const activeVariants = allVariants.filter(v => v.active);

      // Get hardcoded data
      const hardcodedData = this.getHardcodedDataByMasterProductId(variant.masterProductId);

      // Merge with the selected variant as primary
      return this.mergeProductData(masterProduct, variant, activeVariants, hardcodedData);

    } catch (error) {
      console.error(`Failed to fetch product by variant ${variantId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const hybridProductService = new HybridProductService();
