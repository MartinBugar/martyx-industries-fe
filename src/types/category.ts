/**
 * Product Category types
 * Flat structure - no hierarchy
 */

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string; // emoji: '🏎️', '🔧', '🎁'
  displayOrder: number;
  isActive: boolean;
  productCount: number;
  seoTitle?: string;
  seoDescription?: string;
}

/**
 * Category filter state for products page
 */
export interface CategoryFilter {
  categoryId: number | null;
  categorySlug: string | null;
}
