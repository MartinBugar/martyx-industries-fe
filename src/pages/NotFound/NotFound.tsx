import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import './NotFound.css';

const NotFound: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">{t('notFound.title', 'Page Not Found')}</h1>
        <p className="not-found-description">
          {t('notFound.description', "The page you're looking for doesn't exist or has been moved.")}
        </p>

        {/* Search Bar */}
        <form className="not-found-search" onSubmit={handleSearch}>
          <label htmlFor="not-found-search-input" className="sr-only">
            {t('notFound.searchPlaceholder', 'Search for products...')}
          </label>
          <div className="not-found-search-wrapper">
            <Search size={20} className="search-icon" aria-hidden="true" />
            <input
              id="not-found-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('notFound.searchPlaceholder', 'Search for products...')}
              autoComplete="off"
            />
            <button type="submit" disabled={!searchQuery.trim()}>
              {t('actions.search', 'Search')}
            </button>
          </div>
        </form>

        <div className="not-found-suggestions">
          <p className="not-found-suggestions-title">
            {t('notFound.suggestions', 'Here are some helpful links:')}
          </p>
          <ul className="not-found-links">
            <li>
              <Link to="/">{t('notFound.home', 'Go to Homepage')}</Link>
            </li>
            <li>
              <Link to="/products">{t('notFound.products', 'Browse Products')}</Link>
            </li>
            <li>
              <Link to="/contact">{t('notFound.contact', 'Contact Support')}</Link>
            </li>
          </ul>
        </div>

        <div className="not-found-actions">
          <button onClick={handleGoBack} className="not-found-btn not-found-btn-secondary">
            {t('notFound.goBack', 'Go Back')}
          </button>
          <Link to="/" className="not-found-btn not-found-btn-primary">
            {t('notFound.homeButton', 'Back to Home')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
