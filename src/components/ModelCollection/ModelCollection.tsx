import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import type { Order } from '../../context/authTypes';
import PhotoUploadModal from './PhotoUploadModal';
import './ModelCollection.css';

interface ModelPhoto {
  id: number;
  cdn_url: string;
  thumbnail_url: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  upload_date: string;
}

interface PurchasedModel {
  order_id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  purchase_date: string;
  order_status: string;
  quantity: number;
  price: number;
  currency?: string;
  photos: ModelPhoto[];
  can_upload: boolean;
  max_photos: number;
}

interface CollectionData {
  models: PurchasedModel[];
  total_models: number;
  completed_models: number;
}

const ModelCollection: React.FC = () => {
  const { user, getOrders, refreshOrders, ordersLoading, hasLoadedOrders } = useAuth();
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<PurchasedModel | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Fetch orders when component mounts
  useEffect(() => {
    if (user && !hasLoadedOrders && !ordersLoading) {
      void refreshOrders();
    }
  }, [user, hasLoadedOrders, ordersLoading, refreshOrders]);

  // Process orders into collection data
  useEffect(() => {
    const processOrders = () => {
      try {
        if (!user) {
          setCollectionData(null);
          setLoading(false);
          return;
        }

        const orders = getOrders();
        
        // Filter only completed/paid orders
        const completedOrders = orders.filter(order => 
          ['completed', 'paid'].includes(order.status.toLowerCase())
        );

        // Extract all products from completed orders
        const models: PurchasedModel[] = [];
        
        completedOrders.forEach(order => {
          order.items.forEach(item => {
            models.push({
              order_id: order.id,
              order_number: order.orderNumber || order.id,
              product_id: item.productId,
              product_name: item.productName,
              purchase_date: order.date,
              order_status: order.status,
              quantity: item.quantity,
              price: item.price,
              currency: order.currency,
              photos: [], // TODO: Load from backend API
              can_upload: true,
              max_photos: 10
            });
          });
        });

        // Calculate stats
        const completedModels = models.filter(model => 
          model.photos.some(photo => photo.verification_status === 'approved')
        ).length;

        const collectionData: CollectionData = {
          models,
          total_models: models.length,
          completed_models: completedModels
        };

        setCollectionData(collectionData);
        setError(null);
      } catch (err) {
        console.error('Error processing orders:', err);
        setError('Chyba pri spracovaní objednávok');
      } finally {
        setLoading(false);
      }
    };

    if (hasLoadedOrders) {
      processOrders();
    } else if (!ordersLoading && user) {
      setLoading(false);
    }
  }, [hasLoadedOrders, ordersLoading, user, getOrders]);

  const fetchCollection = async () => {
    // Refresh orders to get latest data
    if (user && !ordersLoading) {
      await refreshOrders();
    }
  };

  const handleUploadClick = (model: PurchasedModel) => {
    setSelectedModel(model);
    setUploadModalOpen(true);
  };

  const handleUploadSuccess = () => {
    // Refresh collection data
    fetchCollection();
    setUploadModalOpen(false);
    setSelectedModel(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: 'Čaká na schválenie', class: 'status-pending' },
      approved: { text: 'Schválené', class: 'status-approved' },
      rejected: { text: 'Zamietnuté', class: 'status-rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getModelStatus = (model: PurchasedModel) => {
    if (model.photos.length === 0) {
      return { text: 'Nie je dokončený', class: 'model-status-incomplete' };
    }
    
    const hasApproved = model.photos.some(photo => photo.verification_status === 'approved');
    if (hasApproved) {
      return { text: 'Dokončený', class: 'model-status-completed' };
    }
    
    const hasPending = model.photos.some(photo => photo.verification_status === 'pending');
    if (hasPending) {
      return { text: 'Čaká na schválenie', class: 'model-status-pending' };
    }
    
    return { text: 'Potrebuje nové fotky', class: 'model-status-needs-photos' };
  };

  if (!user) {
    return (
      <div className="collection-error">
        <div className="error-icon">🔒</div>
        <h3>Prihlásenie potrebné</h3>
        <p>Prosím, prihláste sa pre zobrazenie zbierky modelov.</p>
      </div>
    );
  }

  if (loading || ordersLoading) {
    return (
      <div className="collection-loading">
        <div className="loading-spinner"></div>
        <p>Načítavam vašu zbierku...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collection-error">
        <div className="error-icon">⚠️</div>
        <h3>Chyba pri načítaní</h3>
        <p>{error}</p>
        <button onClick={fetchCollection} className="retry-button">
          Skúsiť znovu
        </button>
      </div>
    );
  }

  if (!collectionData || collectionData.models.length === 0) {
    return (
      <div className="collection-empty">
        <div className="empty-icon">📦</div>
        <h3>Žiadne modely v zbierke</h3>
        <p>Zatiaľ nemáte žiadne dokončené objednávky s modelmi.</p>
        <p>Prejdite do obchodu a zakúpte si svoj prvý model!</p>
      </div>
    );
  }

  return (
    <div className="collection-content">
      <div className="collection-header">
        <h2>Moja zbierka modelov</h2>
        <p>Sledujte svoj pokrok a uploadujte fotky dokončených modelov</p>
        <div className="collection-stats">
          <div className="stat-item">
            <span className="stat-number">{collectionData.total_models}</span>
            <span className="stat-label">Celkom modelov</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{collectionData.completed_models}</span>
            <span className="stat-label">Dokončených</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {collectionData.total_models - collectionData.completed_models}
            </span>
            <span className="stat-label">Zostáva</span>
          </div>
        </div>
      </div>

      <div className="models-grid">
        {collectionData.models.map((model) => {
          const modelStatus = getModelStatus(model);
          
          return (
            <div key={`${model.order_id}-${model.product_id}`} className="model-card">
              <div className="model-header">
                <h3 className="model-name">{model.product_name}</h3>
                <span className={`model-status ${modelStatus.class}`}>
                  {modelStatus.text}
                </span>
              </div>
              
              <div className="model-info">
                <div className="purchase-date">
                  <span className="label">Zakúpené:</span>
                  <span className="value">
                    {new Date(model.purchase_date).toLocaleDateString('sk-SK')}
                  </span>
                </div>
                <div className="order-info">
                  <span className="label">Objednávka:</span>
                  <span className="value">#{model.order_number}</span>
                </div>
                <div className="photos-count">
                  <span className="label">Fotky:</span>
                  <span className="value">
                    {model.photos.length} / {model.max_photos}
                  </span>
                </div>
                <div className="price-info">
                  <span className="label">Cena:</span>
                  <span className="value">
                    {model.currency === 'USD' ? '$' : model.currency === 'EUR' ? '€' : ''}
                    {model.price.toFixed(2)} × {model.quantity}
                  </span>
                </div>
              </div>

              {model.photos.length > 0 && (
                <div className="model-photos">
                  <h4>Uploadované fotky:</h4>
                  <div className="photos-list">
                    {model.photos.map((photo) => (
                      <div key={photo.id} className="photo-item">
                        <div className="photo-thumbnail">
                          <img 
                            src={photo.thumbnail_url || photo.cdn_url} 
                            alt="Model photo"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.png';
                            }}
                          />
                        </div>
                        <div className="photo-info">
                          <div className="photo-date">
                            {new Date(photo.upload_date).toLocaleDateString('sk-SK')}
                          </div>
                          {getStatusBadge(photo.verification_status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="model-actions">
                {model.can_upload && (
                  <button
                    onClick={() => handleUploadClick(model)}
                    className="upload-button"
                    disabled={model.photos.length >= model.max_photos}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {model.photos.length === 0 ? 'Upload fotky' : 'Pridať fotky'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {uploadModalOpen && selectedModel && (
        <PhotoUploadModal
          model={selectedModel}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedModel(null);
          }}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

export default ModelCollection;
