'use client';

import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/lib/api';
import styles from './ProductsGrid.module.css';

interface ProductsGridProps {
  initialProducts: Product[];
  categories: string[];
  totalCount: number;
}

export default function ProductsGrid({
  initialProducts,
  categories,
  totalCount
}: ProductsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    let filtered = initialProducts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        product => product.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product => {
          const title = product.name || product.title || '';
          return (
            title.toLowerCase().includes(query) ||
            product.shortDescription?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query) ||
            product.category?.toLowerCase().includes(query)
          );
        }
      );
    }

    return filtered;
  }, [initialProducts, searchQuery, selectedCategory]);

  return (
    <div className={styles.container}>
      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Search products"
          />
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Category Filter */}
        <div className={styles.filterWrapper}>
          <label htmlFor="category-filter" className={styles.filterLabel}>
            Category:
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className={styles.resultsInfo}>
        <p style={{ color: 'var(--text-muted)' }}>
          Showing {filteredProducts.length} of {totalCount} products
          {searchQuery && ` matching "${searchQuery}"`}
          {selectedCategory !== 'all' && ` in ${selectedCategory}`}
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>No products found</h2>
          <p className={styles.emptyDescription}>
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Check back soon for new products!'}
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="primary-btn"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
