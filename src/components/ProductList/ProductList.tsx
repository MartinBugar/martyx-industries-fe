/**
 * Optimized Product List Component
 * Uses virtual scrolling for large product lists
 */

import React, { useCallback } from 'react';
import VirtualList from '../VirtualList/VirtualList';
import LocalizedProductCard from '../LocalizedProductCard/LocalizedProductCard';
// import { useCart } from '../../context/CartContext';
// import { useWishlist } from '../../context/WishlistContext';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  [key: string]: any;
}

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
  className = '',
  itemHeight = 300,
  containerHeight = 600,
  useVirtualScrolling = true
}) => {
  // const { addToCart } = useCart();
  // const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Memoized product card renderer
  const renderProduct = useCallback((product: Product) => (
    <LocalizedProductCard
      key={product.id}
      productId={parseInt(product.id)}
      showFullDescription={false}
    />
  ), []);

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
      {products.map((product) => (
        <div key={product.id} className="product-grid-item">
          {renderProduct(product)}
        </div>
      ))}
    </div>
  );
};

export default ProductList;
