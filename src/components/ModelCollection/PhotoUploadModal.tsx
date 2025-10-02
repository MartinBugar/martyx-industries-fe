import React, { useState, useRef } from 'react';

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
      formData.append('order_id', model.order_id.toString());
      formData.append('model_id', model.model_id.toString());
      
      selectedFiles.forEach((selectedFile, index) => {
        formData.append('photos', selectedFile.file);
      });

      // TODO: Replace with actual API call
      // const response = await fetch('/api/user/upload-model-photo', {
      //   method: 'POST',
      //   body: formData,
      //   onUploadProgress: (progressEvent) => {
      //     const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      //     setUploadProgress(progress);
      //   }
      // });

      // Mock upload with progress simulation
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mock success response
      console.log('Uploading files for model:', model.product_name);
      console.log('Files:', selectedFiles.map(f => f.file.name));

      // Clean up object URLs
      selectedFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });

      onSuccess();
    } catch (err) {
      setError('Nepodarilo sa uploadnúť fotky. Skúste to znovu.');
      console.error('Upload error:', err);
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
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleFileSelect(mockEvent);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upload fotiek</h3>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          <div className="model-info">
            <h4>{model.product_name}</h4>
            <p>Aktuálne fotky: {model.photos.length} / {model.max_photos}</p>
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
              <h4>Kliknite alebo pretiahnite súbory</h4>
              <p>Podporované formáty: JPG, PNG, WebP</p>
              <p>Maximálna veľkosť: 10MB na súbor</p>
              <p>Maximum {maxFiles} súborov naraz</p>
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
            Zrušiť
          </button>
          <button 
            className="upload-button"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
          >
            {uploading ? 'Uploadujem...' : `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'súbor' : 'súborov'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal;
