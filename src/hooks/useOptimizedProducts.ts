import { useState, useEffect, useCallback, useMemo } from 'react';
import { ImagePreloader, useImagePreloader } from '../utils/imagePreloader';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  gallery?: string[];
  price: number;
  // ... other product properties
}

interface UseOptimizedProductsOptions {
  preloadImages?: boolean;
  cacheTime?: number; // in milliseconds
  priority?: 'critical' | 'background';
}

// Cache pre produkty
const productCache = new Map<string, { data: Product[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minút

export const useOptimizedProducts = (
  fetchFunction: () => Promise<Product[]>,
  options: UseOptimizedProductsOptions = {}
) => {
  const {
    preloadImages = true,
    cacheTime = CACHE_DURATION,
    priority = 'background'
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache key based on fetch function
  const cacheKey = fetchFunction.toString();

  // Extract image URLs for preloading
  const imageUrls = useMemo(() => {
    const urls: string[] = [];
    products.forEach(product => {
      if (product.imageUrl) urls.push(product.imageUrl);
      if (product.gallery) urls.push(...product.gallery);
    });
    return urls;
  }, [products]);

  // Preload images
  useImagePreloader(imageUrls, priority);

  const loadProducts = useCallback(async () => {
    try {
      // Check cache first
      const cached = productCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setProducts(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await fetchFunction();
      
      // Cache the results
      productCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      setProducts(data);
      setError(null);

      // Preload first few product images immediately if critical
      if (preloadImages && priority === 'critical') {
        const criticalImages = data.slice(0, 6).map(p => p.imageUrl).filter(Boolean);
        ImagePreloader.preloadCritical(criticalImages);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, cacheKey, cacheTime, preloadImages, priority]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Refresh function for manual cache invalidation
  const refresh = useCallback(() => {
    productCache.delete(cacheKey);
    loadProducts();
  }, [cacheKey, loadProducts]);

  return {
    products,
    loading,
    error,
    refresh,
    isCached: productCache.has(cacheKey)
  };
};

// Hook pre single product s optimalizáciou
export const useOptimizedProduct = (
  productId: string,
  fetchFunction: (id: string) => Promise<Product>
) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `product-${productId}`;

  // Preload product images
  const imageUrls = useMemo(() => {
    if (!product) return [];
    const urls = [product.imageUrl];
    if (product.gallery) urls.push(...product.gallery);
    return urls.filter(Boolean);
  }, [product]);

  useImagePreloader(imageUrls, 'critical'); // Product detail images are critical

  useEffect(() => {
    const loadProduct = async () => {
      try {
        // Check cache
        const cached = productCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setProduct(cached.data[0]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const data = await fetchFunction(productId);
        
        // Cache single product
        productCache.set(cacheKey, {
          data: [data],
          timestamp: Date.now()
        });

        setProduct(data);
        setError(null);

        // Preload all product images immediately
        const allImages = [data.imageUrl, ...(data.gallery || [])].filter(Boolean);
        ImagePreloader.preloadCritical(allImages);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId, fetchFunction, cacheKey]);

  return { product, loading, error };
};
