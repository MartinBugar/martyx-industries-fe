import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminProductsService, type BaseProduct } from '../../services/adminProductsService';
import { product3DModelService } from '../../services/product3DModelService';
import type { Model3DInfoResponse, UploadState } from '../../types/product3DModel';

/**
 * Admin page for managing 3D model (.glb) files for products
 */
const AdminProduct3DModel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<BaseProduct | null>(null);
  const [modelInfo, setModelInfo] = useState<Model3DInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null
  });
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load product and model info
  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [productData, modelData] = await Promise.all([
        adminProductsService.getProductById(id),
        product3DModelService.getModelInfo(Number(id))
      ]);
      setProduct(productData);
      setModelInfo(modelData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle file upload
  const handleUpload = async (file: File) => {
    if (!id) return;

    // Validate file
    const validation = product3DModelService.validateGLBFile(file);
    if (!validation.valid) {
      setUploadState(prev => ({ ...prev, error: validation.error || 'Invalid file' }));
      return;
    }

    setUploadState({
      uploading: true,
      progress: 0,
      error: null
    });
    setSuccessMessage(null);

    try {
      const response = await product3DModelService.uploadModel(
        Number(id),
        file,
        (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        }
      );

      if (response.success) {
        setSuccessMessage('3D model uploaded successfully!');
        // Reload model info
        const updatedModelInfo = await product3DModelService.getModelInfo(Number(id));
        setModelInfo(updatedModelInfo);
        setUploadState({
          uploading: false,
          progress: 100,
          error: null
        });
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      // Only show error if it wasn't a cancellation
      if (msg !== 'Upload cancelled') {
        setUploadState({
          uploading: false,
          progress: 0,
          error: msg
        });
      } else {
        // Reset state on cancellation
        setUploadState({
          uploading: false,
          progress: 0,
          error: null
        });
      }
    }
  };

  // Handle cancel upload
  const handleCancelUpload = () => {
    product3DModelService.cancelUpload();
    setUploadState({
      uploading: false,
      progress: 0,
      error: null
    });
  };

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleUpload(file);
    }
  };

  // Handle delete model
  const handleDelete = async () => {
    if (!id || !modelInfo?.hasModel) return;

    if (!confirm('Are you sure you want to delete this 3D model? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await product3DModelService.deleteModel(Number(id));
      if (response.success) {
        setSuccessMessage('3D model deleted successfully!');
        setModelInfo({ hasModel: false });
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      setError(msg);
    }
  };

  // Navigation tabs
  const navTabs = (
    <div className="admin-nav-tabs">
      <Link to={`/admin/products/${id}`} className="admin-nav-tab">
        📝 Product Detail
      </Link>
      <Link to={`/admin/products/${id}`} className="admin-nav-tab">
        📦 Variants ({Array.isArray(product?.variants) ? product.variants.length : 0})
      </Link>
      <Link to={`/admin/products/${id}/gallery`} className="admin-nav-tab">
        📸 Gallery
      </Link>
      <Link to={`/admin/products/${id}/3d-model`} className="admin-nav-tab active">
        🎲 3D Model
      </Link>
    </div>
  );

  return (
    <AdminLayout title="3D Model Management" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {loading ? (
            <div className="admin-card">Loading...</div>
          ) : !product ? (
            <div className="admin-card">Product not found.</div>
          ) : (
            <>
              {/* Product Basic Info */}
              <div className="admin-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
                      {product.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                      ID: {product.id} • Type: {product.productType}
                    </p>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="alert alert-success" style={{ marginBottom: 24 }}>
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 24 }}>
                  {error}
                </div>
              )}

              {/* Current 3D Model */}
              {modelInfo?.hasModel && (
                <div className="admin-card" style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>
                    Current 3D Model
                  </h3>

                  <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: 12 }}>
                      <strong>File:</strong> {modelInfo.fileName || 'model.glb'}
                      {modelInfo.fileSize && (
                        <span style={{ marginLeft: 8, color: '#6b7280' }}>
                          ({product3DModelService.formatFileSize(modelInfo.fileSize)})
                        </span>
                      )}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>URL:</strong>{' '}
                      <a href={modelInfo.cdnUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                        {modelInfo.cdnUrl}
                      </a>
                    </div>
                    {modelInfo.uploadedAt && (
                      <div>
                        <strong>Uploaded:</strong>{' '}
                        {new Date(modelInfo.uploadedAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Model Viewer Preview */}
                  {modelInfo.cdnUrl && (
                    <div style={{ marginBottom: 16 }}>
                      <model-viewer
                        src={modelInfo.cdnUrl}
                        alt="3D model preview"
                        auto-rotate
                        camera-controls
                        onError={(e: Event) => {
                          console.error('Model viewer error:', e);
                          setError('Failed to load 3D model preview. The file may be corrupted or inaccessible.');
                        }}
                        style={{
                          width: '100%',
                          height: '400px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}
                      ></model-viewer>
                    </div>
                  )}

                  <button
                    onClick={handleDelete}
                    className="btn btn-danger"
                    style={{ width: '100%' }}
                  >
                    🗑️ Delete 3D Model
                  </button>
                </div>
              )}

              {/* Upload Section */}
              <div className="admin-card">
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>
                  {modelInfo?.hasModel ? 'Upload New 3D Model' : 'Upload 3D Model'}
                </h3>

                {/* Upload Error */}
                {uploadState.error && (
                  <div className="alert alert-error" style={{ marginBottom: 16 }}>
                    {uploadState.error}
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  className={`upload-dropzone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !uploadState.uploading && fileInputRef.current?.click()}
                  style={{
                    padding: 48,
                    border: dragActive ? '2px dashed #3b82f6' : '2px dashed #cbd5e1',
                    borderRadius: 8,
                    background: dragActive ? '#eff6ff' : '#f8fafc',
                    textAlign: 'center',
                    cursor: uploadState.uploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: 16
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>
                    {uploadState.uploading ? 'Uploading...' : 'Drag & drop .glb file here'}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                    or click to browse
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    Max size: 50 MB • Supported: .glb files only
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,model/gltf-binary"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={uploadState.uploading}
                />

                {/* Upload Progress */}
                {uploadState.uploading && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, color: '#6b7280' }}>Uploading...</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6' }}>
                          {uploadState.progress}%
                        </span>
                        <button
                          onClick={handleCancelUpload}
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px', fontSize: 12, minHeight: 'auto' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${uploadState.progress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div style={{ marginTop: 24, padding: 16, background: '#fef3c7', borderRadius: 8, border: '1px solid #fbbf24' }}>
                  <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>
                    <strong>ℹ️ Tips:</strong>
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                      <li>Upload GLB (binary glTF) files only</li>
                      <li>Optimize your model before uploading for better performance</li>
                      <li>Recommended max file size: 50 MB</li>
                      <li>If a model already exists, it will be replaced</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProduct3DModel;
