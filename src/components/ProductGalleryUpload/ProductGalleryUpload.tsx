import React, { useState, useRef } from 'react';
import './ProductGalleryUpload.css';
import { isSpacesConfigured, getSpacesConfig } from '../../services/digitalOceanUpload';
import { productGalleryService } from '../../services/productGalleryService';

interface ProductGalleryUploadProps {
  productId: string;
  productName?: string; // Used for display
  existingImages?: string[];
  onImagesChange?: (images: string[]) => void;
}

interface UploadedImage {
  id: string;
  url: string;
  file?: File;
  uploading?: boolean;
  error?: string;
  order?: number;
  galleryImageId?: string; // Database ID for reordering
}

const ProductGalleryUpload: React.FC<ProductGalleryUploadProps> = ({
  productId,
  productName = productId,
  existingImages = [],
  onImagesChange
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to load gallery images
  const loadGalleryImages = async (isRefresh = false) => {
    try {
      const loadingState = isRefresh ? setRefreshing : setLoading;
      loadingState(true);
      
      console.log(`🔍 ${isRefresh ? 'Refreshing' : 'Loading'} gallery images for product: ${productId}`);

      // Load gallery images from database (with metadata)
      let galleryImages: any[] = [];

      if (productGalleryService.isSpacesConfigured()) {
        try {
          console.log('🔄 Loading gallery images from database...');
          galleryImages = await productGalleryService.getProductImages(productId);
          console.log('✅ Successfully loaded gallery images:', galleryImages);
        } catch (error) {
          console.error('❌ Failed to load gallery images:', error);
          
          // If it's the first load and we get an error, don't try again automatically
          if (!isRefresh && !hasLoadedOnce) {
            console.log('🚫 First load failed - will not auto-retry. Use refresh button to try again.');
          }
        }
      } else {
        console.log('🚫 Gallery loading disabled or not configured');
      }

      // Convert to UploadedImage format with database IDs
      const imageObjects = galleryImages
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((galleryImg, index) => ({
          id: `gallery-${galleryImg.id}`,
          url: galleryImg.cdnUrl || galleryImg.url,
          order: galleryImg.order || index,
          galleryImageId: galleryImg.id
        }));

      // Fallback to existingImages prop if database loading fails (only on first load)
      if (imageObjects.length === 0 && !hasLoadedOnce && existingImages.length > 0) {
        const fallbackImages = existingImages.map((url, index) => ({
          id: `existing-${index}`,
          url,
          order: index
        }));
        setImages(fallbackImages);
        onImagesChange?.(existingImages);
      } else {
        setImages(imageObjects);
        const urls = imageObjects.map(img => img.url);
        onImagesChange?.(urls);
      }

      setHasLoadedOnce(true);
      console.log(`✅ ${isRefresh ? 'Refreshed' : 'Loaded'} ${imageObjects.length} gallery images for product ${productId}`);
    } catch (error) {
      console.error('❌ Failed to load gallery images:', error);
      
      // Only use fallback on first load
      if (!hasLoadedOnce && existingImages.length > 0) {
        const fallbackImages = existingImages.map((url, index) => ({
          id: `existing-${index}`,
          url
        }));
        setImages(fallbackImages);
        onImagesChange?.(existingImages);
      }
      
      setHasLoadedOnce(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load images on mount (only once)
  React.useEffect(() => {
    if (!hasLoadedOnce) {
      loadGalleryImages(false);
    }
  }, [productId, hasLoadedOnce]);

  // Check configuration on component mount
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔧 DigitalOcean Spaces configuration:', getSpacesConfig());
    }
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    imageFiles.forEach(file => {
      const id = `upload-${Date.now()}-${Math.random()}`;
      const newImage: UploadedImage = {
        id,
        url: URL.createObjectURL(file),
        file,
        uploading: true
      };

      setImages(prev => [...prev, newImage]);

      // Upload to DigitalOcean Spaces
      handleActualUpload(id, file);
    });
  };

  const handleActualUpload = async (id: string, file: File) => {
    try {
      // Check if DigitalOcean Spaces is configured
      if (!isSpacesConfigured()) {
        console.error('❌ DigitalOcean Spaces not configured:', getSpacesConfig());
        throw new Error('DigitalOcean Spaces credentials not configured. Please check .env.local file.');
      }

      console.log('🚀 Starting upload via backend API...', {
        productId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Calculate order (next available order number)
      const currentOrder = images.length;
      
      console.log('📊 Upload parameters:', {
        productId,
        order: currentOrder,
        expectedURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/products/${productId}/gallery/upload`
      });
      
      // Upload via backend API using JSON approach (handles Spaces upload and database metadata save)
      const uploadResponse = await productGalleryService.uploadImageJson({
        productId,
        file,
        order: currentOrder
      });

      console.log('✅ Backend response:', uploadResponse);

      if (!uploadResponse.success) {
        throw new Error(`Backend upload failed: ${uploadResponse.message || 'Unknown error'}`);
      }

      console.log('✅ Upload successful via backend API:', uploadResponse.image);
      
      // Update the image with the database response
      setImages(prev => prev.map(img =>
        img.id === id
          ? { 
              ...img, 
              url: uploadResponse.cdnUrl || uploadResponse.image.url, 
              uploading: false,
              file: undefined,
              order: uploadResponse.image.order,
              galleryImageId: uploadResponse.image.id
            }
          : img
      ));

      // Update the parent component with CDN URL
      const updatedImages = images.map(img =>
        img.id === id ? (uploadResponse.cdnUrl || uploadResponse.image.url) : img.url
      );
      onImagesChange?.(updatedImages);

    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        if (error.message.includes('Backend upload failed (500)')) {
          errorMessage = '🔧 Server error - check backend logs. Possible causes: database connection, DigitalOcean Spaces config, or missing product.';
        } else if (error.message.includes('Backend upload failed (400)')) {
          errorMessage = '❌ Invalid file or request data';
        } else if (error.message.includes('Backend upload failed (404)')) {
          errorMessage = '🔍 Product not found or upload endpoint missing';
        } else {
          errorMessage = error.message;
        }
      }
      
      setImages(prev => prev.map(img =>
        img.id === id
          ? {
              ...img,
              uploading: false,
              error: errorMessage
            }
          : img
      ));
    }
  };

  const handleRemoveImage = async (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (!imageToRemove) return;

    try {
      console.log('🗑️ Removing image:', imageToRemove.url);

      // If it has a galleryImageId, delete via backend API
      if (imageToRemove.galleryImageId) {
        try {
          console.log('🗑️ Deleting image via backend API:', imageToRemove.galleryImageId);
          const deleteResponse = await productGalleryService.deleteImage(productId, imageToRemove.galleryImageId);
          if (!deleteResponse.success) {
            console.warn('⚠️ Backend deletion failed, but will remove from UI');
          }
        } catch (apiError) {
          console.warn('⚠️ Failed to delete via backend API:', apiError);
        }
      }

      // Remove from local state
      setImages(prev => {
        const updated = prev.filter(img => img.id !== id);
        onImagesChange?.(updated.map(img => img.url));
        return updated;
      });

      console.log('✅ Image removed successfully');
    } catch (error) {
      console.error('❌ Failed to remove image:', error);
      // Still remove from UI even if deletion fails
      setImages(prev => {
        const updated = prev.filter(img => img.id !== id);
        onImagesChange?.(updated.map(img => img.url));
        return updated;
      });
    }
  };

  // Drag and drop reordering functions
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleReorderDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    try {
      setReordering(true);
      
      // Reorder images locally
      const newImages = [...images];
      const draggedImage = newImages[draggedIndex];
      newImages.splice(draggedIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);
      
      // Update order values
      const reorderedImages = newImages.map((img, index) => ({
        ...img,
        order: index
      }));
      
      setImages(reorderedImages);
      
      // Update backend if we have gallery IDs
      const imageOrders = reorderedImages
        .filter(img => img.galleryImageId)
        .map((img, index) => ({
          imageId: img.galleryImageId!,
          order: index
        }));

      if (imageOrders.length > 0) {
        try {
          await productGalleryService.reorderImages({
            productId,
            imageOrders
          });
          console.log('✅ Images reordered successfully');
        } catch (error) {
          console.error('❌ Failed to update order on backend:', error);
        }
      }
      
      // Update parent component
      onImagesChange?.(reorderedImages.map(img => img.url));
      
    } catch (error) {
      console.error('❌ Failed to reorder images:', error);
    } finally {
      setReordering(false);
      setDraggedIndex(null);
    }
  };


  return (
    <div className="product-gallery-upload">
      <div className="upload-header">
        <div className="header-row">
          <div className="header-info">
            <h3>Product Gallery - {productName}</h3>
            <p>Images are loaded from database for folder: <code>{productId.toUpperCase()}</code></p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary refresh-btn"
              onClick={() => loadGalleryImages(true)}
              disabled={loading || refreshing}
              title="Refresh gallery images from database"
            >
              {refreshing ? '🔄' : '↻'} {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        {loading && <p className="loading-text">📸 Loading gallery images from database...</p>}
        {refreshing && <p className="loading-text">🔄 Refreshing gallery images...</p>}
      </div>

      {/* Existing Images Gallery */}
      {!loading && images.length > 0 && (
        <div className="existing-gallery-section">
          <h4>📁 Current Images ({images.length})</h4>
          <div className="images-grid">
            {images.map((image, index) => (
              <div 
                key={image.id} 
                className={`image-item ${draggedIndex === index ? 'dragging' : ''} ${reordering ? 'reordering' : ''}`}
                draggable={!image.uploading && !reordering}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleReorderDrop(e, index)}
              >
                <div className="image-container">
                  <img src={image.url} alt={`Product image ${index + 1}`} />

                  {image.uploading && (
                    <div className="image-overlay">
                      <div className="upload-progress">
                        <div className="spinner"></div>
                        <span>Uploading...</span>
                      </div>
                    </div>
                  )}

                  {image.error && (
                    <div className="image-overlay error">
                      <span>❌ {image.error}</span>
                    </div>
                  )}

                  {reordering && (
                    <div className="image-overlay reordering">
                      <span>🔄 Reordering...</span>
                    </div>
                  )}

                  {!image.uploading && !image.error && !reordering && (
                    <div className="image-actions">
                      <button
                        className="btn-icon btn-secondary drag-handle"
                        title="Drag to reorder"
                      >
                        ⋮⋮
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleRemoveImage(image.id)}
                        title="Remove image"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                <div className="image-info">
                  <span className="image-order">#{index + 1}</span>
                  {index === 0 && <span className="main-badge">Main</span>}
                  {image.galleryImageId && <span className="db-badge">DB</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload New Images Section */}
      <div className="upload-section">
        <h4>📤 Upload New Images</h4>
        <p>Upload additional images for your product gallery. First image will be used as the main product image.</p>
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-content">
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              <p><strong>Click to upload</strong> or drag and drop</p>
              <p>PNG, JPG, WebP up to 10MB each</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Empty State */}
      {!loading && images.length === 0 && (
        <div className="empty-state">
          <p>📁 No images found in DigitalOcean Spaces folder: <code>{productId.toUpperCase()}</code></p>
          <p>Upload some images to create your product gallery.</p>
        </div>
      )}
    </div>
  );
};

export default ProductGalleryUpload;