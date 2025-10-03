'use client';

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthToken, debugToken } from '@/lib/utils/tokenUtils';
import { getApiBaseUrl } from '@/lib/api';

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
  photos: any[];
  can_upload: boolean;
  max_photos: number;
}

interface PhotoUploadModalProps {
  model: PurchasedModel;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedFile {
  file: File;
  preview: string;
  id: string;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({ model, onClose, onSuccess }) => {
  const { t } = useTranslation('collection');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFiles = 5;
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setError(null);

    // Validation
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`Môžete vybrať maximálne ${maxFiles} súborov naraz`);
      return;
    }

    const validFiles: SelectedFile[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Nepodporovaný typ súboru`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: Súbor je príliš veľký (max 10MB)`);
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      validFiles.push({
        file,
        preview,
        id: `${Date.now()}_${index}`
      });
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(file => file.id !== id);
      // Revoke object URL to prevent memory leaks
      const fileToRemove = prev.find(file => file.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Vyberte aspoň jeden súbor');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('product_id', model.product_id);
      formData.append('product_name', model.product_name);
      formData.append('order_id', model.order_id);

      // Append each file with proper naming
      selectedFiles.forEach((selectedFile) => {
        formData.append('photos', selectedFile.file);
      });

      // Get auth token using utility function
      const token = getAuthToken();
      if (!token) {
        throw new Error('Nie ste prihlásený');
      }

      // Debug token for troubleshooting
      console.log('🔍 Upload Debug Info:');
      console.log('Product ID:', model.product_id);
      console.log('Product Name:', model.product_name);
      console.log('Order ID:', model.order_id);
      console.log('Files count:', selectedFiles.length);
      debugToken();

      // Test if backend is reachable first
      try {
        console.log('🧪 Testing backend connectivity...');
        const testResponse = await fetch(`${getApiBaseUrl()}/api/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('🧪 Health check status:', testResponse.status);
      } catch (healthError) {
        console.log('⚠️ Backend health check failed:', healthError);
      }

      // Try different possible endpoints
      const baseUrl = getApiBaseUrl();
      const possibleEndpoints = [
        `${baseUrl}/api/user-photos/upload`,
        `${baseUrl}/api/photos/upload`,
        `${baseUrl}/api/upload/user-photos`,
        `${baseUrl}/api/user/photos/upload`
      ];

      let apiUrl = possibleEndpoints[0]; // Default to first endpoint
      console.log('🌐 Primary API URL:', apiUrl);
      console.log('🔑 Authorization header:', `Bearer ${token.substring(0, 20)}...`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData: any = {};
        const contentType = response.headers.get('content-type');

        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const textError = await response.text();
            console.log('📄 Error response text:', textError);
            errorData = { message: textError || `HTTP ${response.status}` };
          }
        } catch (parseError) {
          console.log('❌ Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }

        console.log('❌ Error data:', errorData);

        // Special handling for 500 errors - likely backend not implemented
        if (response.status === 500) {
          console.log('🚨 Backend Error 500 - Endpoint likely not implemented');
          console.log('📋 Backend Developer Info:');
          console.log('   Required endpoint: POST /api/user-photos/upload');
          console.log('   Required headers: Authorization: Bearer <jwt-token>');
          console.log('   Required form data: product_id, product_name, order_id, photos[]');
          console.log('   See BACKEND_USER_PHOTOS_INTEGRATION.md for full implementation');

          throw new Error(`Backend chyba (500): Endpoint /api/user-photos/upload pravdepodobne nie je implementovaný. Kontaktujte backend developera.`);
        }

        throw new Error(`Chyba pri uploade fotografií: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      // Simulate progress for better UX
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('Upload successful:', result);

      // Clean up object URLs
      selectedFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });

      setSelectedFiles([]);
      onSuccess(); // Notify parent about successful upload
    } catch (err: any) {
      console.error('Upload error:', err);

      // If it's a 500 error (backend not implemented), offer mock mode
      if (err.message && err.message.includes('Backend chyba (500)')) {
        console.log('💡 Suggestion: Enable mock mode for testing without backend');
        console.log('   Add NEXT_PUBLIC_MOCK_UPLOADS=true to .env.local file');

        // Check if mock mode is enabled
        if (process.env.NEXT_PUBLIC_MOCK_UPLOADS === 'true') {
          console.log('🎭 Mock mode enabled - simulating successful upload');

          // Simulate successful upload
          for (let i = 0; i <= 100; i += 20) {
            setUploadProgress(i);
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // Clean up object URLs
          selectedFiles.forEach(file => {
            URL.revokeObjectURL(file.preview);
          });

          setSelectedFiles([]);
          onSuccess(); // Notify parent about successful upload
          return;
        }
      }

      setError(err.message || 'Nepodarilo sa uploadnúť fotky. Skúste to znovu.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const mockEvent = {
      target: { files }
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    handleFileSelect(mockEvent);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('upload.title')}</h3>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          <div className="model-info">
            <h4>{model.product_name}</h4>
            <p>{t('model.photos_count')}: {model.photos.length} / {model.max_photos}</p>
          </div>

          <div
            className="file-drop-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-zone-content">
              <div className="upload-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>{t('upload.drag_drop')}</h4>
              <p>{t('upload.file_types')}</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h4>Vybrané súbory ({selectedFiles.length})</h4>
              <div className="files-grid">
                {selectedFiles.map((selectedFile) => (
                  <div key={selectedFile.id} className="file-preview">
                    <img src={selectedFile.preview} alt="Preview" />
                    <div className="file-info">
                      <span className="file-name">{selectedFile.file.name}</span>
                      <span className="file-size">
                        {(selectedFile.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <button
                      className="remove-file"
                      onClick={() => removeFile(selectedFile.id)}
                      disabled={uploading}
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {error}
            </div>
          )}

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={uploading}
          >
            {t('upload.cancel')}
          </button>
          <button
            className="upload-button"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
          >
            {uploading ? t('upload.uploading') : t('upload.upload_button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal;
