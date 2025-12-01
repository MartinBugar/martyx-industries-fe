import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminCassandra.css';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import { Button } from '../../components/ui';
import cassandraImageService, { type CassandraImageDto, type UploadImageResponse } from '../../services/cassandraImageService';
import { logInfo, logError } from '../../services/logger';
import toast from 'react-hot-toast';

const AdminCassandra: React.FC = () => {
    const [images, setImages] = useState<CassandraImageDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, uploading: false });
    const [uploadSummary, setUploadSummary] = useState<{ show: boolean; successful: number; failed: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load images on mount
    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            setLoading(true);
            logInfo('🔄 Loading Cassandra images...');
            const data = await cassandraImageService.getAllImages();
            setImages(data);
            logInfo(`✅ Loaded ${data.length} Cassandra images`);
        } catch (error) {
            logError('❌ Failed to load Cassandra images:', error);
        } finally {
            setLoading(false);
        }
    };

    const openLightbox = (index: number) => {
        setLightboxImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setLightboxImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setLightboxImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeLightbox();
    };

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

    const handleFiles = async (files: File[]) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            toast.error('Please select image files only');
            return;
        }

        // Set up progress tracking
        setUploadProgress({ current: 0, total: imageFiles.length, uploading: true });

        // Sequential upload
        const results: { success: boolean; error?: string }[] = [];

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];

            try {
                // Update progress
                setUploadProgress({ current: i + 1, total: imageFiles.length, uploading: true });

                logInfo(`🚀 Uploading ${i + 1}/${imageFiles.length}: ${file.name}`);

                // Calculate order (next available order number)
                const currentOrder = images.length + i;

                // Upload via backend API
                const uploadResponse: UploadImageResponse = await cassandraImageService.uploadImageJson(file, currentOrder);

                if (!uploadResponse.success) {
                    throw new Error(uploadResponse.message || 'Upload failed');
                }

                logInfo('✅ Upload successful:', uploadResponse.image);
                results.push({ success: true });

                // Add delay between uploads (except for the last one)
                if (i < imageFiles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }

            } catch (error) {
                logError(`❌ Upload ${i + 1}/${imageFiles.length} failed:`, error);
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : 'Upload failed'
                });
            }
        }

        // Reset progress
        setUploadProgress({ current: 0, total: 0, uploading: false });

        // Show summary
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        setUploadSummary({
            show: true,
            successful,
            failed,
            total: imageFiles.length
        });

        // Auto-hide summary after 5 seconds
        setTimeout(() => {
            setUploadSummary(null);
        }, 5000);

        // Reload images from database
        await loadImages();
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;

        try {
            await cassandraImageService.deleteImage(id);
            logInfo('✅ Image deleted successfully');
            // Reload images
            await loadImages();
        } catch (error) {
            logError('❌ Failed to delete image:', error);
            toast.error('Failed to delete image. Please try again.');
        }
    };

    return (
        <AdminLayout title="CASSANDRA Mascot">
            <div className="admin-cassandra-container">
                {/* Main Cassandra Display */}
                {!loading && images.length > 0 && (
                    <div className="cassandra-main-display">
                        <img
                            src={images[0].imageUrl}
                            alt={images[0].name}
                            className="cassandra-main-image"
                            onClick={() => openLightbox(0)}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                )}

                {/* Gallery Management Section */}
                <div className="admin-card" style={{ marginTop: '24px' }}>
                    <div className="admin-header" style={{ marginBottom: '20px' }}>
                        <h3 className="section-title">Cassandra Gallery</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                            Upload and manage Cassandra mascot images. Images are stored in DigitalOcean Spaces folder: <code>CASSANDRA/</code>
                        </p>
                    </div>

                    {loading && <p className="loading-text">📸 Loading gallery images...</p>}

                    {uploadProgress.uploading && (
                        <div className="upload-progress-section">
                            <p className="upload-progress-text">
                                📤 Uploading {uploadProgress.current}/{uploadProgress.total} images...
                            </p>
                            <div className="upload-progress-bar">
                                <div
                                    className="upload-progress-fill"
                                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                />
                            </div>
                            <span className="upload-progress-percent">
                                {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                            </span>
                        </div>
                    )}

                    {uploadSummary?.show && (
                        <div className={`upload-summary ${uploadSummary.failed > 0 ? 'has-errors' : 'success'}`}>
                            <div className="upload-summary-content">
                                {uploadSummary.failed === 0 ? (
                                    <span className="upload-summary-icon">🎉</span>
                                ) : (
                                    <span className="upload-summary-icon">⚠️</span>
                                )}
                                <span className="upload-summary-text">
                                    {uploadSummary.failed === 0
                                        ? `All ${uploadSummary.successful} images uploaded successfully!`
                                        : `${uploadSummary.successful}/${uploadSummary.total} images uploaded successfully. ${uploadSummary.failed} failed.`
                                    }
                                </span>
                                <button
                                    className="upload-summary-close"
                                    onClick={() => setUploadSummary(null)}
                                    aria-label="Close summary"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Existing Images Gallery */}
                    {!loading && images.length > 0 && (
                        <div className="cassandra-gallery-grid" style={{ marginBottom: '24px' }}>
                            {images.map((image, index) => (
                                <div
                                    key={image.id}
                                    className="cassandra-gallery-item"
                                >
                                    <div
                                        className="cassandra-thumbnail"
                                        onClick={() => openLightbox(index)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img src={image.thumbnailUrl || image.imageUrl} alt={image.name} />
                                        <div className="cassandra-thumbnail-overlay">
                                            <span>View Fullscreen</span>
                                        </div>
                                    </div>
                                    <div className="cassandra-item-info">
                                        <div className="cassandra-item-name">{image.name}</div>
                                        {image.description && (
                                            <div className="cassandra-item-desc">{image.description}</div>
                                        )}
                                    </div>
                                    <div className="cassandra-item-actions action-buttons">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(image.id!);
                                            }}
                                            title="Delete image"
                                        >
                                            🗑️
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload New Images Section */}
                    <div className="upload-section">
                        <h4>📤 Upload New Images</h4>
                        <p>Upload additional images for Cassandra gallery.</p>
                        <div
                            className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploadProgress.uploading ? 'disabled' : ''}`}
                            onDragEnter={uploadProgress.uploading ? undefined : handleDrag}
                            onDragLeave={uploadProgress.uploading ? undefined : handleDrag}
                            onDragOver={uploadProgress.uploading ? undefined : handleDrag}
                            onDrop={uploadProgress.uploading ? undefined : handleDrop}
                            onClick={uploadProgress.uploading ? undefined : () => fileInputRef.current?.click()}
                        >
                            <div className="upload-content">
                                <div className="upload-icon">📷</div>
                                <div className="upload-text">
                                    {uploadProgress.uploading ? (
                                        <>
                                            <p><strong>Upload in progress...</strong></p>
                                            <p>Please wait for current upload to complete</p>
                                        </>
                                    ) : (
                                        <>
                                            <p><strong>Click to upload</strong> or drag and drop</p>
                                            <p>PNG, JPG, WebP up to 10MB each</p>
                                        </>
                                    )}
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
                            <p>📁 No images found in Cassandra gallery</p>
                            <p>Upload some images to create the gallery.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && images.length > 0 && (
                <div
                    className="cassandra-lightbox"
                    onClick={closeLightbox}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    <button className="lightbox-close" onClick={closeLightbox} title="Close (Esc)">
                        <X size={32} />
                    </button>
                    <button
                        className="lightbox-nav lightbox-prev"
                        onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                        }}
                        title="Previous (←)"
                    >
                        <ChevronLeft size={40} />
                    </button>
                    <button
                        className="lightbox-nav lightbox-next"
                        onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                        }}
                        title="Next (→)"
                    >
                        <ChevronRight size={40} />
                    </button>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={images[lightboxImageIndex].imageUrl}
                            alt={images[lightboxImageIndex].name}
                            className="lightbox-image"
                        />
                        <div className="lightbox-info">
                            <div className="lightbox-title">{images[lightboxImageIndex].name}</div>
                            {images[lightboxImageIndex].description && (
                                <div className="lightbox-description">{images[lightboxImageIndex].description}</div>
                            )}
                        </div>
                        <div className="lightbox-counter">
                            {lightboxImageIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminCassandra;
