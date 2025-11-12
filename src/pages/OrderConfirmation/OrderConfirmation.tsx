import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { products } from '../../data/productData';
import { ordersService } from '../../services/ordersService';
import { useFormatters } from '../../hooks/useFormatters';
import './OrderConfirmation.css';

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('checkout');
  const { formatDate, formatCurrency } = useFormatters();
  const product = products.find(p => p.masterProductId === 1) ?? products[0];
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const [downloadUrls] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem('downloadUrls');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  useEffect(() => {
    // Get customer email from session storage
    const email = sessionStorage.getItem('customerEmail');
    if (!email) {
      // If no email is found, redirect to home page
      navigate('/');
      return;
    }
    
    setCustomerEmail(email);
    
    // Generate a random order number
    const randomOrderNumber = Math.floor(100000000 + Math.random() * 900000000).toString();
    setOrderNumber(randomOrderNumber);
    
    // Simulate email sending
    const emailTimer = setTimeout(() => {
      setIsEmailSent(true);
    }, 2000);
    
    return () => {
      clearTimeout(emailTimer);
    };
  }, [navigate]);
  
  // Get current date formatted
  const currentDate = formatDate(new Date());
  
  // Handle download click
  const handleDownload = async () => {
    setDownloadError(null);
    if (!downloadUrls || downloadUrls.length === 0) {
      setDownloadError(t('confirmation.download_not_available'));
      return;
    }
    try {
      setDownloading(true);
      // Use the first available download URL; backend may return multiple per item
      await ordersService.downloadByUrl(downloadUrls[0], product.name);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('confirmation.download_failed');
      setDownloadError(msg);
    } finally {
      setDownloading(false);
    }
  };

  if (!customerEmail) {
    return <div className="loading">{t('common:loading')}</div>;
  }
  
  return (
    <div className="order-confirmation-container">
      <div className="order-confirmation-content">
        <div className="order-success">
          <div className="success-icon">✓</div>
          <h1>{t('confirmation.title')}</h1>
          <p>{t('confirmation.subtitle')}</p>
        </div>

        <div className="order-details">
          <h2>{t('confirmation.order_details')}</h2>

          <div className="order-info">
            <div className="info-row">
              <span>{t('confirmation.order_number')}:</span>
              <span>{orderNumber}</span>
            </div>

            <div className="info-row">
              <span>{t('confirmation.order_date')}:</span>
              <span>{currentDate}</span>
            </div>

            <div className="info-row">
              <span>{t('shipping.email')}:</span>
              <span>{customerEmail}</span>
            </div>

            <div className="info-row">
              <span>{t('confirmation.item')}:</span>
              <span>{product.name}</span>
            </div>

            <div className="info-row">
              <span>{t('order_summary.total')}:</span>
              <span>{formatCurrency(product.priceWithVat, product.currency)}</span>
            </div>
          </div>
        </div>
        
        <div className="digital-delivery">
          <h2>{t('confirmation.digital_delivery_title')}</h2>

          <div className="email-status">
            {isEmailSent ? (
              <p className="email-sent">
                <span className="status-icon">✓</span>
                {t('confirmation.email_sent', { email: customerEmail })}
              </p>
            ) : (
              <p className="email-sending">
                <span className="status-icon">⟳</span>
                {t('confirmation.email_sending', { email: customerEmail })}
              </p>
            )}
          </div>

          <div className="download-section">
            <p>{t('confirmation.download_direct')}</p>

            <button
              className="download-btn"
              onClick={handleDownload}
              disabled={downloading || !downloadUrls || downloadUrls.length === 0}
            >
              {downloading ? t('confirmation.downloading') : t('confirmation.download_button', { product: product.name })}
            </button>
            {downloadError && (
              <p className="download-info" role="alert" style={{ color: '#b00020' }}>{downloadError}</p>
            )}

            <div className="download-info">
              <p>{t('confirmation.download_expires')}</p>
              <p>{t('confirmation.download_issues')}</p>
            </div>
          </div>
        </div>
        
        <div className="next-steps">
          <button
            className="continue-shopping-btn"
            onClick={() => navigate('/')}
          >
            {t('confirmation.continue_shopping')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;