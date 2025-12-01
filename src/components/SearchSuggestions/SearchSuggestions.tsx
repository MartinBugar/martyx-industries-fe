import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ProductSearchSuggestion } from '../../services/productService';
import './SearchSuggestions.css';

interface SearchSuggestionsProps {
  suggestions: ProductSearchSuggestion[];
  isOpen: boolean;
  isLoading: boolean;
  selectedIndex: number;
  onSelect: (suggestion: ProductSearchSuggestion) => void;
  onClose: () => void;
  query: string;
}

/**
 * Dropdown component for displaying search suggestions
 */
export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  isOpen,
  isLoading,
  selectedIndex,
  onSelect,
  onClose,
  query,
}) => {
  const { t, i18n } = useTranslation(['search', 'common']);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen && !isLoading) {
    return null;
  }

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
    }).format(price);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="search-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      ref={containerRef}
      className={`search-suggestions ${isOpen ? 'is-open' : ''}`}
      role="listbox"
      aria-label={t('search:suggestions', 'Search suggestions')}
    >
      {isLoading && (
        <div className="search-suggestions__loading">
          <span className="search-suggestions__spinner" />
          {t('common:loading', 'Loading...')}
        </div>
      )}

      {!isLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className="search-suggestions__empty">
          {t('search:no_results', 'No products found')}
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <ul className="search-suggestions__list">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              className={`search-suggestions__item ${index === selectedIndex ? 'is-selected' : ''}`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <Link
                to={`/product/${suggestion.slug}`}
                className="search-suggestions__link"
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(suggestion);
                }}
              >
                {suggestion.featuredImageUrl && (
                  <img
                    src={suggestion.featuredImageUrl}
                    alt=""
                    className="search-suggestions__image"
                    loading="lazy"
                  />
                )}
                <div className="search-suggestions__content">
                  <span className="search-suggestions__name">
                    {highlightMatch(suggestion.name, query)}
                  </span>
                  {suggestion.minPrice != null && (
                    <span className="search-suggestions__price">
                      {suggestion.onSale && (
                        <span className="search-suggestions__sale-badge">
                          {t('search:sale', 'Sale')}
                        </span>
                      )}
                      {formatPrice(suggestion.minPrice, suggestion.currency)}
                      {suggestion.maxPrice != null && suggestion.maxPrice !== suggestion.minPrice && (
                        <> - {formatPrice(suggestion.maxPrice, suggestion.currency)}</>
                      )}
                    </span>
                  )}
                  {!suggestion.inStock && (
                    <span className="search-suggestions__out-of-stock">
                      {t('search:out_of_stock', 'Out of stock')}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && suggestions.length > 0 && (
        <div className="search-suggestions__footer">
          <Link
            to={`/products?search=${encodeURIComponent(query)}`}
            className="search-suggestions__view-all"
            onClick={onClose}
          >
            {t('search:view_all_results', 'View all results')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
