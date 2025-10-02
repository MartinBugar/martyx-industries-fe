import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import type { Order } from '../../context/authTypes';
import PhotoUploadModal from './PhotoUploadModal';
import ModelPhotoGallery from './ModelPhotoGallery';
import { getAuthToken } from '../../utils/tokenUtils';
import './ModelCollection.css';

interface ModelPhoto {
  id: number;
  originalFilename: string;
  fileName: string;
  fileSize: number;
  cdnUrl: string;
  thumbnailUrl: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  uploadDate: string;
  productId: string;
  productName: string;
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
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);

  // Load photos for a specific model/product
  const loadPhotosForModel = async (productId: string): Promise<ModelPhoto[]> => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token available for loading photos');
        return [];
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/user-photos/${productId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No photos found for this product - this is normal
          return [];
        }
        
        if (response.status === 500) {
          console.warn(`Backend endpoint GET /api/user-photos/${productId} not implemented yet`);
          return [];
        }
        
        throw new Error(`Failed to load photos: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const photos = data.data?.photos || [];
      return photos;
    } catch (error) {
      console.error(`Error loading photos for product ${productId}:`, error);
      return [];
    }
  };

  // Fetch orders when component mounts
  useEffect(() => {
    if (user && !hasLoadedOrders && !ordersLoading) {
      void refreshOrders();
    }
  }, [user, hasLoadedOrders, ordersLoading, refreshOrders]);

  // Process orders into collection data and load photos
  useEffect(() => {
    const processOrdersAndLoadPhotos = async () => {
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
              photos: [], // Will be loaded below
              can_upload: true,
              max_photos: 10
            });
          });
        });

        // Load photos for each model
        await Promise.all(models.map(async (model) => {
          try {
            const photos = await loadPhotosForModel(model.product_id);
            model.photos = photos;
          } catch (error) {
            console.error(`Failed to load photos for ${model.product_name}:`, error);
            model.photos = [];
          }
        }));

        // Calculate stats
        const completedModels = models.filter(model => 
          model.photos.some(photo => photo.verificationStatus === 'approved')
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
      processOrdersAndLoadPhotos();
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

  const handleGalleryClick = (model: PurchasedModel) => {
    setSelectedModel(model);
    setGalleryModalOpen(true);
  };

  const handleUploadSuccess = () => {
    // Refresh collection data
    fetchCollection();
    setUploadModalOpen(false);
    setSelectedModel(null);
  };

  const handleGalleryClose = () => {
    setGalleryModalOpen(false);
    setSelectedModel(null);
  };

  const getStatusBadge = (status: string) => {
    // Don't show badge for approved photos (default state)
    if (status === 'approved') {
      return null;
    }
    
    const statusConfig = {
      pending: { text: 'Čaká na schválenie', class: 'status-pending' },
      rejected: { text: 'Zamietnuté', class: 'status-rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    
    // Fallback for unknown status (but not approved)
    if (!config) {
      return <span className="status-badge status-unknown">{status || 'Neznámy stav'}</span>;
    }
    
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getModelStatus = (model: PurchasedModel) => {
    if (model.photos.length === 0) {
      return { text: 'Nie je dokončený', class: 'model-status-incomplete' };
    }
    
    const hasApproved = model.photos.some(photo => photo.verificationStatus === 'approved');
    if (hasApproved) {
      return { text: 'Dokončený', class: 'model-status-completed' };
    }
    
    const hasPending = model.photos.some(photo => photo.verificationStatus === 'pending');
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
      </div>

      <div className="stats-container">
        <div className="stats-card">
          <div className="stat-item">
            <span className="stat-number">{collectionData.total_models}</span>
            <span className="stat-label">Celkom</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">{collectionData.completed_models}</span>
            <span className="stat-label">Dokončené</span>
          </div>
          <div className="stat-divider"></div>
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
                <div className="photos-count">
                  <span className="label">Fotky:</span>
                  <span className="value">
                    {model.photos.length} / {model.max_photos}
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
                            src={photo.thumbnailUrl || photo.cdnUrl} 
                            alt="Model photo"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.png';
                            }}
                          />
                        </div>
                        <div className="photo-info">
                          <div className="photo-date">
                            {new Date(photo.uploadDate).toLocaleDateString('sk-SK')}
                          </div>
                          {getStatusBadge(photo.verificationStatus)}
                        </div>
                        </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="model-actions">
                <button
                  onClick={() => handleGalleryClick(model)}
                  className="gallery-button"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {model.photos.length > 0 
                    ? `Otvoriť galériu (${model.photos.length})` 
                    : 'Otvoriť galériu'
                  }
                </button>
                
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

      {galleryModalOpen && selectedModel && (
        <ModelPhotoGallery
          model={selectedModel}
          onClose={handleGalleryClose}
        />
      )}
    </div>
  );
};

export default ModelCollection;
