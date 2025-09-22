import React, { useState, useRef } from 'react';
import './ProductGalleryUpload.css';
import { uploadImageToSpaces, isSpacesConfigured, getSpacesConfig } from '../../services/digitalOceanUpload';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing images from DigitalOcean Spaces
  React.useEffect(() => {
    const loadExistingImages = async () => {
      try {
        setLoading(true);
        console.log(`🔍 Loading existing images for product: ${productId}`);

        // First try to load from DigitalOcean Spaces
        let loadedImages: string[] = [];

        // Enable Spaces loading with HTTP approach (not AWS SDK)
        const enableSpacesLoading = true;

        if (enableSpacesLoading && productGalleryService.isSpacesConfigured()) {
          try {
            console.log('🔄 Attempting to load images from Spaces...');
            loadedImages = await productGalleryService.loadProductImagesFromSpaces(productId);
            console.log('✅ Successfully loaded from Spaces:', loadedImages);
          } catch (error) {
            console.error('❌ Failed to load from Spaces:', error);
          }
        } else {
          console.log('🚫 Spaces loading disabled or not configured');
        }

        // Fallback to existingImages prop if Spaces loading fails or is empty
        if (loadedImages.length === 0 && existingImages.length > 0) {
          loadedImages = existingImages;
          console.log(`📷 Using fallback images from props: ${loadedImages.length} images`);
        }

        const imageObjects = loadedImages.map((url, index) => ({
          id: `existing-${index}`,
          url
        }));

        setImages(imageObjects);
        onImagesChange?.(loadedImages);

        console.log(`✅ Loaded ${imageObjects.length} existing images for product ${productId}`);
      } catch (error) {
        console.error('❌ Failed to load existing images:', error);
        // Fallback to existingImages prop
        const fallbackImages = existingImages.map((url, index) => ({
          id: `existing-${index}`,
          url
        }));
        setImages(fallbackImages);
        onImagesChange?.(existingImages);
      } finally {
        setLoading(false);
      }
    };

    loadExistingImages();
  }, [productId, existingImages, onImagesChange]);

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

      console.log('🚀 Starting upload to DigitalOcean Spaces...', {
        productId,
        fileName: file.name,
        fileSize: file.size
      });

      // Upload to DigitalOcean Spaces with original filename
      const result = await uploadImageToSpaces({
        productId,
        file,
        preserveOriginalName: true
      });

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('✅ Upload successful!', result.url);

      // Update the image with the CDN URL
      setImages(prev => prev.map(img =>
        img.id === id
          ? { ...img, url: result.url, uploading: false, file: undefined }
          : img
      ));

      // Notify parent component
      const updatedImages = images.map(img =>
        img.id === id ? result.url : img.url
      );
      onImagesChange?.(updatedImages);

    } catch (error) {
      console.error('❌ Upload failed:', error);
      setImages(prev => prev.map(img =>
        img.id === id
          ? {
              ...img,
              uploading: false,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : img
      ));
    }
  };

  const handleRemoveImage = async (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (!imageToRemove) return;

    try {
      // If it's a DigitalOcean Spaces URL, delete it from Spaces
      if (imageToRemove.url.includes('digitaloceanspaces.com') && productGalleryService.isSpacesConfigured()) {
        console.log('🗑️ Deleting image from Spaces:', imageToRemove.url);
        const deleted = await productGalleryService.deleteImageFromSpaces(imageToRemove.url);
        if (!deleted) {
          console.warn('⚠️ Failed to delete image from Spaces, but will remove from UI');
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
      // Still remove from UI even if Spaces deletion fails
      setImages(prev => {
        const updated = prev.filter(img => img.id !== id);
        onImagesChange?.(updated.map(img => img.url));
        return updated;
      });
    }
  };


  return (
    <div className="product-gallery-upload">
      <div className="upload-header">
        <h3>Product Gallery - {productName}</h3>
        <p>Upload images for your product gallery. First image will be used as the main product image.</p>
        {loading && <p className="loading-text">📸 Loading existing images...</p>}
      </div>

      {/* Upload Area */}
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

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="images-grid">
          {images.map((image, index) => (
            <div key={image.id} className="image-item">
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

                {!image.uploading && !image.error && (
                  <div className="image-actions">
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
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="empty-state">
          <p>No images uploaded yet. Add some images to create your product gallery.</p>
        </div>
      )}
    </div>
  );
};

export default ProductGalleryUpload;