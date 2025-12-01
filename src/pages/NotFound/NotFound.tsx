import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NotFound.css';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">{t('notFound.title', 'Page Not Found')}</h1>
        <p className="not-found-description">
          {t('notFound.description', "The page you're looking for doesn't exist or has been moved.")}
        </p>

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
