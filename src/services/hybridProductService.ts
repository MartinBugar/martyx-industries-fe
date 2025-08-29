import { productService, type ProductDto } from './productService';
import { hardcodedProductsData, type HardcodedProductData, type Product } from '../data/productData';

/**
 * Hybrid Product Service
 * Combines backend ProductDto data with hardcoded frontend-specific data
 * to create complete Product objects for use throughout the application
 */
export class HybridProductService {
  private productCache = new Map<number, Product>();
  private allProductsCache: Product[] | null = null;
  private lastCacheTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get hardcoded data for a product by its ID
   */
  private getHardcodedDataById(id: string): HardcodedProductData | null {
    return hardcodedProductsData.find(data => data.id === id) || null;
  }

  /**
   * Merge ProductDto from backend with hardcoded frontend data
   */
  private mergeProductData(backendProduct: ProductDto, hardcodedData: HardcodedProductData | null): Product {
    // Default values for missing hardcoded data
    const defaultHardcodedData: Partial<HardcodedProductData> = {
      features: [],
      modelPath: '',
      gallery: [],
      interactionInstructions: ['Click and drag to rotate', 'Scroll to zoom in/out', 'Right-click and drag to pan'],
      modelViewerSettings: undefined,
      videoUrl: undefined,
      tabs: []
    };

    const mergedHardcodedData = { ...defaultHardcodedData, ...hardcodedData };

    return {
      id: backendProduct.id.toString(),
      name: backendProduct.name,
      price: backendProduct.price,
      currency: backendProduct.currency, // Now comes from backend
      description: backendProduct.description,
      features: mergedHardcodedData.features!,
      modelPath: mergedHardcodedData.modelPath!,
      gallery: mergedHardcodedData.gallery!,
      interactionInstructions: mergedHardcodedData.interactionInstructions!,
      productType: backendProduct.productType,
      modelViewerSettings: mergedHardcodedData.modelViewerSettings,
      tabs: mergedHardcodedData.tabs,
      videoUrl: mergedHardcodedData.videoUrl
    };
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheTime < this.CACHE_DURATION;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.productCache.clear();
    this.allProductsCache = null;
    this.lastCacheTime = 0;
  }

  /**
   * Get all products with optional category filter
   */
  async getProducts(category?: string): Promise<Product[]> {
    try {
      // Use cache for all products (no category filter) if valid
      if (!category && this.allProductsCache && this.isCacheValid()) {
        return this.allProductsCache;
      }

      // Fetch from backend
      const backendProducts = await productService.getProducts(category);
      
      // Merge with hardcoded data
      const hybridProducts = backendProducts.map(backendProduct => {
        const hardcodedData = this.getHardcodedDataById(backendProduct.id.toString());
        const mergedProduct = this.mergeProductData(backendProduct, hardcodedData);
        
        // Cache individual products
        this.productCache.set(backendProduct.id, mergedProduct);
        
        return mergedProduct;
      });

      // Cache all products if no category filter
      if (!category) {
        this.allProductsCache = hybridProducts;
        this.lastCacheTime = Date.now();
      }

      return hybridProducts;
    } catch (error) {
      console.error('Failed to fetch products from backend:', error);
      
      // Fallback: return products based on hardcoded data only (for development/offline)
      const fallbackProducts = hardcodedProductsData.map(hardcodedData => {
        const mockBackendProduct: ProductDto = {
          id: parseInt(hardcodedData.id),
          name: `Mock Product ${hardcodedData.id}`,
          description: 'Product data unavailable - backend connection failed',
          price: 0,
          currency: 'USD', // Default fallback currency
          imageUrl: null,
          sku: `MOCK-${hardcodedData.id}`,
          category: null,
          productType: 'DIGITAL'
        };
        return this.mergeProductData(mockBackendProduct, hardcodedData);
      });

      console.warn('Using fallback product data due to backend error');
      return fallbackProducts;
    }
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: number): Promise<Product> {
    try {
      // Check cache first
      if (this.productCache.has(id) && this.isCacheValid()) {
        return this.productCache.get(id)!;
      }

      // Fetch from backend
      const backendProduct = await productService.getProductById(id);
      const hardcodedData = this.getHardcodedDataById(backendProduct.id.toString());
      const mergedProduct = this.mergeProductData(backendProduct, hardcodedData);

      // Cache the result
      this.productCache.set(id, mergedProduct);

      return mergedProduct;
    } catch (error) {
      console.error(`Failed to fetch product ${id} from backend:`, error);
      
      // Fallback: try to find in hardcoded data
      const hardcodedData = this.getHardcodedDataById(id.toString());
      if (hardcodedData) {
        const mockBackendProduct: ProductDto = {
          id: id,
          name: `Mock Product ${id}`,
          description: 'Product data unavailable - backend connection failed',
          price: 0,
          currency: 'USD', // Default fallback currency
          imageUrl: null,
          sku: `MOCK-${id}`,
          category: null,
          productType: 'DIGITAL'
        };
        const fallbackProduct = this.mergeProductData(mockBackendProduct, hardcodedData);
        console.warn(`Using fallback data for product ${id}`);
        return fallbackProduct;
      }

      // Re-throw error if no fallback available
      throw error;
    }
  }

  /**
   * Get product by string ID (for backward compatibility)
   */
  async getProductByStringId(id: string): Promise<Product> {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error(`Invalid product ID: ${id}`);
    }
    return this.getProductById(numericId);
  }
}

// Create singleton instance
export const hybridProductService = new HybridProductService();
