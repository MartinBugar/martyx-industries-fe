'use client';

import { useState } from 'react';
import type { Product } from '@/lib/api';
import styles from './AddToCart.module.css';

interface AddToCartProps {
  product: Product;
}

export default function AddToCart({ product }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);

    // Simulate add to cart (implement actual cart logic later)
    try {
      // TODO: Implement actual cart API call
      console.log('Adding to cart:', { product, quantity });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Show success feedback
      alert(`Added ${quantity} × ${product.title} to cart!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <div className={styles.container}>
      {/* Quantity Selector */}
      <div className={styles.quantitySelector}>
        <label htmlFor="quantity" className={styles.label}>
          Quantity
        </label>
        <div className={styles.quantityControls}>
          <button
            type="button"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className={styles.quantityButton}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            id="quantity"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className={styles.quantityInput}
          />
          <button
            type="button"
            onClick={incrementQuantity}
            className={styles.quantityButton}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={styles.addToCartButton}
        >
          {isAdding ? (
            <>
              <span className={styles.spinner}></span>
              Adding...
            </>
          ) : (
            'Add to Cart'
          )}
        </button>

        <button
          type="button"
          className={styles.wishlistButton}
          aria-label="Add to wishlist"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Total Price */}
      <div className={styles.total}>
        <span className={styles.totalLabel}>Total:</span>
        <span className={styles.totalPrice}>
          {(product.price * quantity).toFixed(2)} {product.currency}
        </span>
      </div>
    </div>
  );
}
