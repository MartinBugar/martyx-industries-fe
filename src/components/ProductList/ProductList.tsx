/**
 * Optimized Product List Component
 * Uses virtual scrolling for large product lists
 */

import React, { useMemo, useCallback } from 'react';
import VirtualList from '../VirtualList/VirtualList';
import LocalizedProductCard from '../LocalizedProductCard/LocalizedProductCard';
import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';
import type { Product } from '../../types/product';

interface ProductListProps {
  products: Product[];
  loading?: boolean;
  onProductClick?: (product: Product) => void;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
  useVirtualScrolling?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  loading = false,
  onProductClick,
  className = '',
  itemHeight = 300,
  containerHeight = 600,
  useVirtualScrolling = true
}) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Memoized product card renderer
  const renderProduct = useCallback((product: Product, index: number) => (
    <LocalizedProductCard
      key={product.id}
      product={product}
      onAddToCart={addToCart}
      onAddToWishlist={addToWishlist}
      onRemoveFromWishlist={removeFromWishlist}
      isInWishlist={isInWishlist(product.id)}
      onClick={() => onProductClick?.(product)}
      className="product-card-virtual"
    />
  ), [addToCart, addToWishlist, removeFromWishlist, isInWishlist, onProductClick]);

  // Use virtual scrolling for large lists
  if (useVirtualScrolling && products.length > 20) {
    return (
      <div className={`product-list-virtual ${className}`}>
        <VirtualList
          items={products}
          itemHeight={itemHeight}
          containerHeight={containerHeight}
          renderItem={renderProduct}
          overscan={3}
          className="product-list-container"
        />
      </div>
    );
  }

  // Regular grid for smaller lists
  return (
    <div className={`product-list-grid ${className}`}>
      {products.map((product, index) => (
        <div key={product.id} className="product-grid-item">
          {renderProduct(product, index)}
        </div>
      ))}
    </div>
  );
};

export default ProductList;
