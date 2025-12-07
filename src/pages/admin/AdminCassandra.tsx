import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ConfirmDialog, useConfirmDialog, Button, SkeletonTable } from '../../components/ui';
import { X, ChevronLeft, ChevronRight, Upload, Trash2, Image, Database } from 'lucide-react';
import AdminLayout from './AdminLayout';
import cassandraImageService, { type CassandraImageDto, type UploadImageResponse } from '../../services/cassandraImageService';
import { logInfo, logError } from '../../services/logger';
import toast from 'react-hot-toast';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import './AdminCassandra.css';

const AdminCassandra: React.FC = () => {
    const [images, setImages] = useState<CassandraImageDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, uploading: false });
    const [uploadSummary, setUploadSummary] = useState<{ show: boolean; successful: number; failed: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { confirm, dialogProps } = useConfirmDialog({
        title: 'Delete Image',
        message: 'Are you sure you want to delete this image?',
        variant: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel'
    });

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            setLoading(true);
            logInfo('Loading Cassandra images...');
            const data = await cassandraImageService.getAllImages();
            setImages(data);
            logInfo(`Loaded ${data.length} Cassandra images`);
        } catch (error) {
            logError('Failed to load Cassandra images:', error);
        } finally {
            setLoading(false);
        }
    };

    const openLightbox = (index: number) => {
        setLightboxImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => setLightboxOpen(false);
    const nextImage = () => setLightboxImageIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setLightboxImageIndex((prev) => (prev - 1 + images.length) % images.length);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeLightbox();
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
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
        if (e.target.files) handleFiles(Array.from(e.target.files));
    };

    const handleFiles = async (files: File[]) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            toast.error('Please select image files only');
            return;
        }

        setUploadProgress({ current: 0, total: imageFiles.length, uploading: true });
        const results: { success: boolean; error?: string }[] = [];

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            try {
                setUploadProgress({ current: i + 1, total: imageFiles.length, uploading: true });
                const currentOrder = images.length + i;
                const uploadResponse: UploadImageResponse = await cassandraImageService.uploadImageJson(file, currentOrder);
                if (!uploadResponse.success) throw new Error(uploadResponse.message || 'Upload failed');
                results.push({ success: true });
                if (i < imageFiles.length - 1) await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                logError(`Upload ${i + 1}/${imageFiles.length} failed:`, error);
                results.push({ success: false, error: error instanceof Error ? error.message : 'Upload failed' });
            }
        }

        setUploadProgress({ current: 0, total: 0, uploading: false });
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        setUploadSummary({ show: true, successful, failed, total: imageFiles.length });
        setTimeout(() => setUploadSummary(null), 5000);
        await loadImages();
    };

    const handleDelete = useCallback(async (id: number) => {
        const confirmed = await confirm({ title: 'Delete Image', message: 'Are you sure you want to delete this image?' });
        if (!confirmed) return;
        try {
            await cassandraImageService.deleteImage(id);
            logInfo('Image deleted successfully');
            await loadImages();
        } catch (error) {
            logError('Failed to delete image:', error);
            toast.error('Failed to delete image. Please try again.');
        }
    }, [confirm]);

    return (
        <AdminLayout title="Cassandra DB">
            <div className="admin-page">
                <div className="admin-container">
                    {/* Header */}
                    <div className="admin-card admin-cassandra-header-card">
                        <div className="admin-cassandra-header-flex">
                            <div>
                                <h2 className="section-title admin-cassandra-title">
                                    <Database size={24} className="admin-cassandra-title-icon" />
                                    Cassandra Mascot Gallery
                                </h2>
                                <p className="admin-cassandra-desc">
                                    Upload and manage Cassandra mascot images. Storage: <code className="admin-cassandra-code">CASSANDRA/</code>
                                </p>
                            </div>
                            <Button variant="primary" onClick={() => fileInputRef.current?.click()} disabled={uploadProgress.uploading}>
                                <Upload size={16} />
                                Upload Images
                            </Button>
                        </div>
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress.uploading && (
                        <div className="admin-card admin-cassandra-progress-card">
                            <div className="admin-cassandra-progress-flex">
                                <div className="admin-cassandra-progress-content">
                                    <p className="admin-cassandra-progress-text">Uploading {uploadProgress.current}/{uploadProgress.total} images...</p>
                                    <div className="admin-cassandra-progress-bar">
                                        <div className="admin-cassandra-progress-fill" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
                                    </div>
                                </div>
                                <span className="admin-cassandra-progress-percent">
                                    {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Upload Summary */}
                    {uploadSummary?.show && (
                        <div className={`alert admin-cassandra-summary ${uploadSummary.failed > 0 ? 'alert-error admin-cassandra-summary-error' : 'admin-cassandra-summary-success'}`}>
                            <span>
                                {uploadSummary.failed === 0
                                    ? `All ${uploadSummary.successful} images uploaded successfully!`
                                    : `${uploadSummary.successful}/${uploadSummary.total} images uploaded. ${uploadSummary.failed} failed.`}
                            </span>
                            <button onClick={() => setUploadSummary(null)} className="admin-cassandra-summary-close">×</button>
                        </div>
                    )}

                    {/* Main Featured Image */}
                    {!loading && images.length > 0 && (
                        <div className="admin-card admin-cassandra-featured-card">
                            <img
                                src={images[0].imageUrl}
                                alt={images[0].name}
                                className="admin-cassandra-featured-img"
                                onClick={() => openLightbox(0)}
                            />
                        </div>
                    )}

                    {/* Gallery Grid */}
                    {loading ? (
                        <div className="admin-card">
                            <SkeletonTable rows={3} columns={4} />
                        </div>
                    ) : images.length === 0 ? (
                        <div className="admin-card admin-cassandra-empty">
                            <Image size={48} className="admin-cassandra-empty-icon" />
                            <h3 className="admin-cassandra-empty-title">No Images</h3>
                            <p className="admin-cassandra-empty-text">Upload some images to create the Cassandra gallery.</p>
                            <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={16} />
                                Upload Images
                            </Button>
                        </div>
                    ) : (
                        <div className="admin-card">
                            <h3 className="section-title admin-cassandra-gallery-title">
                                <Image size={20} className="admin-cassandra-title-icon" />
                                Gallery ({images.length} images)
                            </h3>
                            <div className="admin-cassandra-gallery-grid">
                                {images.map((image, index) => (
                                    <div key={image.id} className="admin-cassandra-image-card">
                                        <div
                                            className="admin-cassandra-image-wrapper"
                                            onClick={() => openLightbox(index)}
                                        >
                                            <img src={image.thumbnailUrl || image.imageUrl} alt={image.name} className="admin-cassandra-image-thumb" />
                                        </div>
                                        <div className="admin-cassandra-image-info">
                                            <div className="admin-cassandra-image-name">
                                                {image.name}
                                            </div>
                                            {image.description && (
                                                <div className="admin-cassandra-image-desc">
                                                    {image.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className="admin-cassandra-image-delete">
                                            <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(image.id!); }} title="Delete image">
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Drop Zone */}
                    <div className="admin-card admin-cassandra-upload-card">
                        <h3 className="section-title admin-cassandra-upload-title">
                            <Upload size={20} className="admin-cassandra-title-icon" />
                            Upload New Images
                        </h3>
                        <div
                            onDragEnter={uploadProgress.uploading ? undefined : handleDrag}
                            onDragLeave={uploadProgress.uploading ? undefined : handleDrag}
                            onDragOver={uploadProgress.uploading ? undefined : handleDrag}
                            onDrop={uploadProgress.uploading ? undefined : handleDrop}
                            onClick={uploadProgress.uploading ? undefined : () => fileInputRef.current?.click()}
                            className={`admin-cassandra-dropzone ${dragActive ? 'admin-cassandra-dropzone-active' : ''} ${uploadProgress.uploading ? 'admin-cassandra-dropzone-disabled' : ''}`}
                        >
                            <Image size={40} className="admin-cassandra-dropzone-icon" />
                            {uploadProgress.uploading ? (
                                <>
                                    <p className="admin-cassandra-dropzone-text">Upload in progress...</p>
                                    <p className="admin-cassandra-dropzone-hint">Please wait for current upload to complete</p>
                                </>
                            ) : (
                                <>
                                    <p className="admin-cassandra-dropzone-text">Click to upload or drag and drop</p>
                                    <p className="admin-cassandra-dropzone-hint">PNG, JPG, WebP up to 10MB each</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileInput}
                            className="admin-cassandra-file-input"
                        />
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && images.length > 0 && (
                <div
                    onClick={closeLightbox}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    className="admin-cassandra-lightbox"
                >
                    <button onClick={closeLightbox} className="admin-cassandra-lightbox-close" title="Close (Esc)">
                        <X size={32} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="admin-cassandra-lightbox-nav admin-cassandra-lightbox-prev" title="Previous (←)">
                        <ChevronLeft size={32} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="admin-cassandra-lightbox-nav admin-cassandra-lightbox-next" title="Next (→)">
                        <ChevronRight size={32} />
                    </button>
                    <div onClick={(e) => e.stopPropagation()} className="admin-cassandra-lightbox-content">
                        <img src={images[lightboxImageIndex].imageUrl} alt={images[lightboxImageIndex].name} className="admin-cassandra-lightbox-img" />
                        <div className="admin-cassandra-lightbox-info">
                            <div className="admin-cassandra-lightbox-name">{images[lightboxImageIndex].name}</div>
                            {images[lightboxImageIndex].description && (
                                <div className="admin-cassandra-lightbox-desc">{images[lightboxImageIndex].description}</div>
                            )}
                            <div className="admin-cassandra-lightbox-counter">{lightboxImageIndex + 1} / {images.length}</div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog {...dialogProps} />
        </AdminLayout>
    );
};

export default AdminCassandra;
