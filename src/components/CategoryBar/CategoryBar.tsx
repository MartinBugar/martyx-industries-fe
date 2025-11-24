import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { categoryService } from '../../services/categoryService';
import type { ProductCategory } from '../../types/category';
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    loadCategories();
    // Trigger mount animation after component is ready
    requestAnimationFrame(() => {
      setIsMounted(true);
    });
  }, []);

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
      console.error('Failed to load categories:', error);
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
      <div className="category-bar loading">
        <div className="category-bar-content">
          <div className="category-skeleton"></div>
        </div>
      </div>
    );
  }

  return (
    <nav
      className={`category-bar ${isMounted ? 'mounted' : ''}`}
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
