import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
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
  recentSearches?: string[];
  onRecentSearchSelect?: (term: string) => void;
  onClearRecentSearches?: () => void;
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
  recentSearches = [],
  onRecentSearchSelect,
  onClearRecentSearches,
}) => {
  const { t, i18n } = useTranslation(['search', 'common']);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const showRecentSearches = query.length < 2 && recentSearches.length > 0;

  if (!isOpen && !isLoading && !showRecentSearches) {
    return null;
  }

  const handleRecentSearchClick = (term: string) => {
    if (onRecentSearchSelect) {
      onRecentSearchSelect(term);
    } else {
      navigate(`/products?search=${encodeURIComponent(term)}`);
      onClose();
    }
  };

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
      {/* Recent Searches Section */}
      {showRecentSearches && (
        <div className="search-suggestions__recent">
          <div className="search-suggestions__recent-header">
            <span className="search-suggestions__recent-title">
              {t('search:recent_searches', 'Recent Searches')}
            </span>
            {onClearRecentSearches && (
              <button
                type="button"
                className="search-suggestions__clear-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearRecentSearches();
                }}
                aria-label={t('search:clear_recent', 'Clear recent searches')}
              >
                {t('search:clear', 'Clear')}
              </button>
            )}
          </div>
          <ul className="search-suggestions__recent-list">
            {recentSearches.map((term, index) => (
              <li key={index} className="search-suggestions__recent-item">
                <button
                  type="button"
                  className="search-suggestions__recent-btn"
                  onClick={() => handleRecentSearchClick(term)}
                >
                  <Clock size={14} aria-hidden="true" />
                  <span>{term}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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
