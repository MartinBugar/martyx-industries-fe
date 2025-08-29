/**
 * Centralized API Client with optimizations
 * 
 * Benefits:
 * - Centralized error handling
 * - Request/response interceptors
 * - Automatic retry logic
 * - Request deduplication
 * - Caching capabilities
 */

import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  cache?: boolean;
  retry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class ApiClient {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000; // 1 second

  /**
   * Make an API request with automatic error handling and optional caching
   */
  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      cache = false,
      retry = false,
      retryAttempts = this.DEFAULT_RETRY_ATTEMPTS,
      retryDelay = this.DEFAULT_RETRY_DELAY
    } = config;

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const requestKey = `${method}:${url}:${JSON.stringify(body)}`;

    // Check cache for GET requests
    if (method === 'GET' && cache) {
      const cached = this.getFromCache(requestKey);
      if (cached) {
        return cached;
      }
    }

    // Prevent duplicate requests
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!;
    }

    const requestPromise = this.executeRequest<T>(url, {
      method,
      headers: { ...defaultHeaders, ...headers } as HeadersInit,
      body: body ? JSON.stringify(body) : undefined
    }, retry, retryAttempts, retryDelay);

    // Store pending request
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful GET requests
      if (method === 'GET' && cache) {
        this.setCache(requestKey, result);
      }

      return result;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Execute the actual fetch request with retry logic
   */
  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    retry: boolean,
    retryAttempts: number,
    retryDelay: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= (retry ? retryAttempts : 0); attempt++) {
      try {
        const response = await fetch(url, options);
        return await handleResponse(response) as T;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt or for non-retriable errors
        if (attempt === retryAttempts || !this.isRetriableError(error as Error)) {
          break;
        }

        // Wait before retrying
        await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    throw lastError!;
  }

  /**
   * Check if an error is retriable
   */
  private isRetriableError(error: Error): boolean {
    // Retry on network errors, timeouts, and 5xx status codes
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.message.includes('5');
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + this.CACHE_DURATION
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, options: Omit<RequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, options: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T = any>(endpoint: string, body?: any, options: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T = any>(endpoint: string, options: Omit<RequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Clean up expired cache entries periodically
setInterval(() => {
  apiClient.clearExpiredCache();
}, 60000); // Every minute
