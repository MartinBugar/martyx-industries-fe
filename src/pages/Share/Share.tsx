import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ShoppingCart, Eye, Calendar, ArrowLeft } from 'lucide-react';
import { getSharedConfiguration, parseSharedConfiguration, type SharedConfigurationResponse } from '../../services/shareService';
import { formatPrice } from '../../utils/priceFormatter';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Breadcrumbs from '../../components/Breadcrumbs';
import './Share.css';

/**
 * Page for viewing shared configurations.
 * Public access - no authentication required.
 */
const Share: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [share, setShare] = useState<SharedConfigurationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShare = async () => {
      if (!shareToken) {
        setError(t('share.invalidToken', 'Invalid share link'));
        setLoading(false);
        return;
      }

      try {
        const result = await getSharedConfiguration(shareToken);
        if (!result) {
          setError(t('share.notFound', 'This shared configuration was not found or has expired'));
        } else {
          setShare(result);
        }
      } catch {
        setError(t('share.loadError', 'Failed to load shared configuration'));
      } finally {
        setLoading(false);
      }
    };

    loadShare();
  }, [shareToken, t]);

  const handleViewInConfigurator = () => {
    if (!share) return;
    // Navigate to product page with share token - the product page will load the configuration
    navigate(`/products/${share.masterProductId}?config=${shareToken}`);
  };

  const handleAddToCart = () => {
    if (!share) return;
    // For shared configurations, navigate to product page where user can add to cart
    // This ensures proper product data loading and configuration handling
    navigate(`/products/${share.masterProductId}?config=${shareToken}&action=cart`);
  };

  const breadcrumbItems = [
    { label: t('common.home', 'Home'), path: '/' },
    { label: t('share.sharedConfiguration', 'Shared Configuration') }
  ];

  if (loading) {
    return (
      <div className="share-page">
        <div className="share-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="share-page">
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="share-error">
            <AlertCircle size={64} />
            <h1>{t('share.oops', 'Oops!')}</h1>
            <p>{error || t('share.notFound', 'This shared configuration was not found or has expired')}</p>
            <Link to="/" className="btn btn-primary">
              <ArrowLeft size={18} />
              {t('share.backHome', 'Back to Home')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const configuration = parseSharedConfiguration(share);

  return (
    <div className="share-page">
      <div className="container">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="share-card">
          <div className="share-header">
            <h1 className="share-title">
              {share.title || t('share.untitled', 'Custom Configuration')}
            </h1>
            <div className="share-meta">
              <span className="share-meta-item">
                <Eye size={16} />
                {t('share.views', '{{count}} views', { count: share.viewCount })}
              </span>
              <span className="share-meta-item">
                <Calendar size={16} />
                {t('share.created', 'Created {{date}}', {
                  date: new Date(share.createdAt).toLocaleDateString()
                })}
              </span>
            </div>
          </div>

          <div className="share-content">
            <h2 className="share-section-title">
              {t('share.configurationDetails', 'Configuration Details')}
            </h2>

            <div className="share-options">
              {Object.entries(configuration).map(([slotKey, option]) => (
                <div key={slotKey} className="share-option">
                  <span className="share-option-slot">{slotKey}</span>
                  <span className="share-option-name">{option.displayName}</span>
                  {option.priceModifier !== 0 && (
                    <span className={`share-option-price ${option.priceModifier > 0 ? 'positive' : 'negative'}`}>
                      {option.priceModifier > 0 ? '+' : ''}{formatPrice(option.priceModifier)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {share.priceModifier !== 0 && (
              <div className="share-total">
                <span>{t('share.priceModifier', 'Configuration modifier')}</span>
                <span className={share.priceModifier > 0 ? 'positive' : 'negative'}>
                  {share.priceModifier > 0 ? '+' : ''}{formatPrice(share.priceModifier)}
                </span>
              </div>
            )}
          </div>

          <div className="share-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleViewInConfigurator}
            >
              {t('share.viewInConfigurator', 'View in Configurator')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} />
              {t('share.addToCart', 'Add to Cart')}
            </button>
          </div>

          {share.expiresAt && (
            <p className="share-expires">
              {t('share.expiresOn', 'This link expires on {{date}}', {
                date: new Date(share.expiresAt).toLocaleDateString()
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Share;
