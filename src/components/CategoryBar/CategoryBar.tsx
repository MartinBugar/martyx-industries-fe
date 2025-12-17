import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { categoryService } from '../../services/categoryService';
import type { ProductCategory } from '../../types/category';
import { logError } from '../../services/logger';
import './CategoryBar.css';

/**
 * Golden sticky category bar component
 * Displays: All | 3D Printed Models | Tools | Merchandise
 * Shows on /products and /products/:id pages
 */
const CategoryBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  // Three-state animation: 'initial' -> 'animating' -> 'complete'
  const [animationState, setAnimationState] = useState<'initial' | 'animating' | 'complete'>('initial');

  useEffect(() => {
    loadCategories();

    // Start animation after brief delay
    const timer = setTimeout(() => {
      setAnimationState('animating');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Handle animation end to prevent re-triggering on re-renders
  const handleAnimationEnd = () => {
    if (animationState === 'animating') {
      setAnimationState('complete');
    }
  };

  useEffect(() => {
    // Extract active category from URL
    // /products?category=3d-printed-models
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get('category');
    setActiveSlug(categoryParam);
  }, [location.search]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      logError('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (slug: string | null) => {
    if (slug === null) {
      // "All" button - clear category filter
      navigate('/products');
    } else {
      // Navigate to category
      navigate(`/products?category=${slug}`);
    }
  };

  if (loading) {
    return (
      <div
        className={`category-bar loading ${animationState}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="category-bar-content">
          <div className="category-skeleton"></div>
        </div>
      </div>
    );
  }

  return (
    <nav
      className={`category-bar ${animationState}`}
      onAnimationEnd={handleAnimationEnd}
      role="navigation"
      aria-label="Product categories"
    >
      <div className="category-bar-content">
        <ul className="category-list">
          {/* "All Products" button */}
          <li>
            <button
              className={`category-item ${activeSlug === null ? 'active' : ''}`}
              onClick={() => handleCategoryClick(null)}
              aria-label="View all products"
            >
              All
            </button>
          </li>

          {/* Category buttons */}
          {categories.map((category) => (
            <li key={category.id}>
              <button
                className={`category-item ${activeSlug === category.slug ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category.slug)}
                aria-label={`View ${category.name}`}
              >
                {category.icon && <span className="category-icon">{category.icon}</span>}
                <span className="category-name">{category.name}</span>
                {category.productCount > 0 && (
                  <span className="category-count">({category.productCount})</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default CategoryBar;
