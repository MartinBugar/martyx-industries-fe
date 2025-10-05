import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';
import PhotoUploadModal from './PhotoUploadModal';
import ModelPhotoGallery from './ModelPhotoGallery';
import { getAuthToken } from '../../utils/tokenUtils';
import { API_BASE_URL } from '../../services/apiUtils';
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
  is_completed: boolean;
  is_public: boolean;
}

interface CollectionData {
  models: PurchasedModel[];
  total_models: number;
  completed_models: number;
}

const ModelCollection: React.FC = () => {
  const { t } = useTranslation('collection');
  const { user, getOrders, refreshOrders, ordersLoading, hasLoadedOrders } = useAuth();
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<PurchasedModel | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  // const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const [updatingModel, setUpdatingModel] = useState<string | null>(null);

  // Helper function to recalculate stats
  const recalculateStats = (models: PurchasedModel[]): CollectionData => {
    const completedModels = models.filter(model => model.is_completed).length;
    
    console.log('📊 Stats recalculated:', {
      totalModels: models.length,
      completedModels,
      remainingModels: models.length - completedModels,
      completedModelNames: models.filter(m => m.is_completed).map(m => m.product_name)
    });
    
    return {
      models,
      total_models: models.length,
      completed_models: completedModels
    };
  };

  // Load model status from backend
  const loadModelStatus = async (productId: string, orderId: string): Promise<{ is_completed: boolean; is_public: boolean }> => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token for loading model status');
        return { is_completed: false, is_public: false };
      }

      const url = `${API_BASE_URL}/api/user-models/${productId}/status?order_id=${orderId}`;
      console.log(`🔍 Loading model status from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 Response status: ${response.status} for product ${productId}, order ${orderId}`);

      if (!response.ok) {
        if (response.status === 404) {
          // No status record exists yet, return defaults
          console.log(`No status record found for product ${productId}, order ${orderId} - using defaults`);
          return { is_completed: false, is_public: false };
        }
        
        if (response.status === 500) {
          console.warn(`Backend endpoint GET /api/user-models/${productId}/status not implemented yet`);
          return { is_completed: false, is_public: false };
        }
        
        // Log error response for debugging
        const errorText = await response.text();
        console.error(`❌ Error response ${response.status}:`, errorText);
        throw new Error(`Failed to load model status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Raw response data for ${productId}:`, data);
      
      // Handle different response formats
      const statusData = data.data || data; // Backend might wrap in "data" field
      console.log(`📦 Extracted status data:`, statusData);
      
      return {
        is_completed: statusData.is_completed || false,
        is_public: statusData.is_public || false
      };
    } catch (error) {
      console.error(`Error loading model status for ${productId}:`, error);
      return { is_completed: false, is_public: false };
    }
  };

  // Load photos for a specific model/product
  const loadPhotosForModel = async (productId: string): Promise<ModelPhoto[]> => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token available for loading photos');
        return [];
      }

      const response = await fetch(
        `${API_BASE_URL}/api/user-photos/${productId}`,
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
          // Debug logging for order IDs
          console.log('🔍 Order mapping:', {
            displayId: order.id,
            backendId: order.backendId,
            orderNumber: order.orderNumber,
            finalOrderId: order.backendId || order.id
          });
          
          order.items.forEach(item => {
            models.push({
              order_id: order.backendId || order.id, // Use backendId for API calls
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
              max_photos: 10,
              is_completed: false, // Default to not completed
              is_public: false // Default to private
            });
          });
        });

        // Load photos and status for each model
        console.log(`🚀 Starting to load data for ${models.length} models`);
        
        await Promise.all(models.map(async (model) => {
          try {
            console.log(`⏳ Loading data for model: ${model.product_name} (ID: ${model.product_id}, Order: ${model.order_id})`);
            
            // Load photos and status in parallel
            const [photos, status] = await Promise.all([
              loadPhotosForModel(model.product_id),
              loadModelStatus(model.product_id, model.order_id)
            ]);
            
            model.photos = photos;
            model.is_completed = status.is_completed;
            model.is_public = status.is_public;
            
            console.log(`📦 Model ${model.product_name} loaded:`, {
              productId: model.product_id,
              orderId: model.order_id,
              photos: photos.length,
              statusFromAPI: status,
              finalIsCompleted: status.is_completed,
              finalIsPublic: status.is_public
            });
          } catch (error) {
            console.error(`Failed to load data for ${model.product_name}:`, error);
            model.photos = [];
            // Keep default values for status if loading fails
          }
        }));

        // Calculate stats using helper function
        const collectionData = recalculateStats(models);

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

  const handlePhotoDeleted = (photoId: number) => {
    if (!selectedModel) return;

    // Update local state - remove photo from the specific model
    setCollectionData(prevData => {
      if (!prevData) return prevData;

      return {
        ...prevData,
        models: prevData.models.map(model => {
          if (model.product_id === selectedModel.product_id) {
            return {
              ...model,
              photos: model.photos.filter(p => p.id !== photoId)
            };
          }
          return model;
        })
      };
    });

    console.log('Photo removed from card view:', photoId);
  };

  // Delete photo function (currently not used in UI)
  // const deletePhoto = async (photoId: number, modelProductId: string) => {
  //   if (!window.confirm('Naozaj chcete zmazať túto fotku?')) {
  //     return;
  //   }

  //   setDeletingPhotoId(photoId);

  //   try {
  //     const token = getAuthToken();
  //     if (!token) {
  //       throw new Error(t('errors.no_auth'));
  //     }

  //     const response = await fetch(
  //       `${API_BASE_URL}/api/user-photos/${photoId}`,
  //       {
  //         method: 'DELETE',
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       }
  //     );

  //     if (!response.ok) {
  //       if (response.status === 500) {
  //         console.warn(`Backend endpoint DELETE /api/user-photos/${photoId} not implemented yet`);

  //         // Mock delete for testing
  //         if (import.meta.env.VITE_MOCK_DELETES === 'true') {
  //           console.log('🎭 Mock mode - simulating photo delete');

  //           // Update local state
  //           setCollectionData(prevData => {
  //             if (!prevData) return prevData;

  //             return {
  //               ...prevData,
  //               models: prevData.models.map(model => {
  //                 if (model.product_id === modelProductId) {
  //                   return {
  //                     ...model,
  //                     photos: model.photos.filter(p => p.id !== photoId)
  //                   };
  //                 }
  //                 return model;
  //               })
  //             };
  //           });

  //           return;
  //         }

  //         throw new Error('Backend endpoint pre mazanie fotiek nie je implementovaný. Kontaktujte backend developera.');
  //       }

  //       const errorData = await response.json().catch(() => ({}));
  //       throw new Error(errorData.message || 'Nepodarilo sa zmazať fotku');
  //     }

  //     // Update local state - remove photo from the specific model
  //     setCollectionData(prevData => {
  //       if (!prevData) return prevData;

  //       return {
  //         ...prevData,
  //         models: prevData.models.map(model => {
  //           if (model.product_id === modelProductId) {
  //             return {
  //               ...model,
  //               photos: model.photos.filter(p => p.id !== photoId)
  //             };
  //           }
  //           return model;
  //         })
  //       };
  //     });

  //     console.log('Photo deleted successfully');
  //   } catch (err) {
  //     console.error('Error deleting photo:', err);
  //     alert((err as Error).message || t('errors.photo_delete_failed'));
  //   } finally {
  //     setDeletingPhotoId(null);
  //   }
  // };

  const updateModelStatus = async (productId: string, orderId: string, field: 'is_completed' | 'is_public', value: boolean) => {
    console.log('🔄 Updating model status:', {
      productId,
      orderId,
      orderIdType: typeof orderId,
      orderIdParsed: parseInt(orderId, 10),
      field,
      value
    });
    
    setUpdatingModel(productId);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error(t('errors.no_auth'));
      }

      // Validate order_id
      const orderIdNumber = parseInt(orderId, 10);
      if (isNaN(orderIdNumber) || orderIdNumber <= 0) {
        throw new Error(t('errors.invalid_order_id'));
      }

      const response = await fetch(
        `${API_BASE_URL}/api/user-models/${productId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_id: orderIdNumber, // Use validated number
            [field]: value
          })
        }
      );

      if (!response.ok) {
        if (response.status === 500) {
          console.warn(`Backend endpoint PATCH /api/user-models/${productId}/status not implemented yet`);
          
          // Mock update for testing
          if (import.meta.env.VITE_MOCK_UPDATES === 'true') {
            console.log(`🎭 Mock mode - simulating ${field} update to ${value} for product ${productId}, order ${orderId}`);
            
            // Update local state and recalculate stats
            setCollectionData(prev => {
              if (!prev) return prev;
              
              const updatedModels = prev.models.map(model => 
                model.product_id === productId && model.order_id === orderId
                  ? { ...model, [field]: value }
                  : model
              );
              
              return recalculateStats(updatedModels);
            });
            
            return;
          }
        }
        
        const errorData = await response.text();
        throw new Error(`Nepodarilo sa aktualizovať model: ${response.status} ${errorData}`);
      }

      // Update the collection data locally and recalculate stats
      setCollectionData(prev => {
        if (!prev) return prev;
        
        const updatedModels = prev.models.map(model => 
          model.product_id === productId && model.order_id === orderId
            ? { ...model, [field]: value }
            : model
        );
        
        return recalculateStats(updatedModels);
      });

      console.log(`Model ${field} updated successfully to ${value} for product ${productId}, order ${orderId}`);
    } catch (err) {
      console.error(`Error updating model ${field}:`, err);
      alert((err as Error).message || t(`errors.${field === 'is_completed' ? 'completion_error' : 'visibility_error'}`));
    } finally {
      setUpdatingModel(null);
    }
  };

  // Photo status badge helper (currently not used in UI)
  // const getStatusBadge = (status: string) => {
  //   // Don't show badge for approved photos (default state)
  //   if (status === 'approved') {
  //     return null;
  //   }
  //
  //   const statusConfig = {
  //     pending: { text: 'Čaká na schválenie', class: 'status-pending' },
  //     rejected: { text: 'Zamietnuté', class: 'status-rejected' }
  //   };
  //
  //   const config = statusConfig[status as keyof typeof statusConfig];
  //
  //   // Fallback for unknown status (but not approved)
  //   if (!config) {
  //     return <span className="status-badge status-unknown">{status || 'Neznámy stav'}</span>;
  //   }
  //
  //   return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  // };



  if (loading || ordersLoading) {
    return (
      <div className="collection-loading">
        <div className="loading-spinner"></div>
        <p>{t('loading.title')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collection-error">
        <div className="error-icon">⚠️</div>
        <h3>{t('errors.load_failed')}</h3>
        <p>{error}</p>
        <button onClick={fetchCollection} className="retry-button">
          {t('actions.retry', 'Skúsiť znovu')}
        </button>
      </div>
    );
  }

  if (!collectionData || collectionData.models.length === 0) {
    return (
      <div className="collection-empty">
        <div className="empty-icon">📦</div>
        <h3>{t('empty.title')}</h3>
        <p>{t('empty.description')}</p>
        <p>{t('empty.subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="collection-content">
      <div className="collection-header">
        <h2>{t('title')}</h2>
        <p>{t('subtitle')}</p>
      </div>

      <div className="stats-container">
        <div className="stats-card">
          <div className="stat-item">
            <span className="stat-number">{collectionData.total_models}</span>
            <span className="stat-label">{t('stats.total')}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">{collectionData.completed_models}</span>
            <span className="stat-label">{t('stats.completed')}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">
              {collectionData.total_models - collectionData.completed_models}
            </span>
            <span className="stat-label">{t('stats.remaining')}</span>
          </div>
        </div>
      </div>

      <div className="models-grid">
        {collectionData.models.map((model) => {
          return (
            <div key={`${model.order_id}-${model.product_id}`} className="model-card">
              <div className="model-header">
                <h3 className="model-name">{model.product_name}</h3>
                <div className="model-controls">
                  <div className="model-toggles">
                    <div className="toggle-group">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={model.is_completed}
                          onChange={(e) => updateModelStatus(model.product_id, model.order_id, 'is_completed', e.target.checked)}
                          disabled={updatingModel === model.product_id}
                          className="toggle-checkbox"
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">{t('model.completed')}</span>
                      </label>
                    </div>
                    <div className="toggle-group">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={model.is_public}
                          onChange={(e) => updateModelStatus(model.product_id, model.order_id, 'is_public', e.target.checked)}
                          disabled={updatingModel === model.product_id}
                          className="toggle-checkbox"
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">{t('model.public')}</span>
                      </label>
                    </div>
                  </div>
                  {updatingModel === model.product_id && (
                    <div className="updating-indicator">
                      <div className="mini-spinner"></div>
                    </div>
                  )}
                </div>
              </div>
              

              {model.photos.length > 0 && (
                <div className="model-photos">
                  <h4>{t('model.photos_count')}: {model.photos.length} / 10</h4>
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
                    ? `${t('model.open_gallery')} (${model.photos.length})` 
                    : t('model.open_gallery')
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
                    {t('model.upload_photos')}
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
          onPhotoDeleted={handlePhotoDeleted}
        />
      )}
    </div>
  );
};

export default ModelCollection;
