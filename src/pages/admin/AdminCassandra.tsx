import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ConfirmDialog, useConfirmDialog, Button, SkeletonTable } from '../../components/ui';
import { X, ChevronLeft, ChevronRight, Upload, Trash2, Image, Database } from 'lucide-react';
import AdminLayout from './AdminLayout';
import cassandraImageService, { type CassandraImageDto, type UploadImageResponse } from '../../services/cassandraImageService';
import { logInfo, logError } from '../../services/logger';
import toast from 'react-hot-toast';
import './AdminUsers.css';
import './AdminButtonOverrides.css';

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
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h2 className="section-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Database size={24} style={{ color: 'var(--admin-accent)' }} />
                                    Cassandra Mascot Gallery
                                </h2>
                                <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
                                    Upload and manage Cassandra mascot images. Storage: <code style={{ background: 'var(--admin-bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>CASSANDRA/</code>
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
                        <div className="admin-card" style={{ marginBottom: '20px', background: 'var(--admin-info-bg)', borderColor: 'var(--admin-info)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Uploading {uploadProgress.current}/{uploadProgress.total} images...</p>
                                    <div style={{ height: 8, background: 'var(--admin-bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, background: 'var(--admin-accent)', borderRadius: 4, transition: 'width 0.3s' }} />
                                    </div>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--admin-accent)' }}>
                                    {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Upload Summary */}
                    {uploadSummary?.show && (
                        <div className={`alert ${uploadSummary.failed > 0 ? 'alert-error' : ''}`} style={{ marginBottom: '20px', background: uploadSummary.failed > 0 ? 'var(--admin-error-bg)' : 'var(--admin-success-bg)', border: `1px solid ${uploadSummary.failed > 0 ? 'var(--admin-error)' : 'var(--admin-success)'}` }}>
                            <span>
                                {uploadSummary.failed === 0
                                    ? `All ${uploadSummary.successful} images uploaded successfully!`
                                    : `${uploadSummary.successful}/${uploadSummary.total} images uploaded. ${uploadSummary.failed} failed.`}
                            </span>
                            <button onClick={() => setUploadSummary(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </div>
                    )}

                    {/* Main Featured Image */}
                    {!loading && images.length > 0 && (
                        <div className="admin-card" style={{ marginBottom: '24px', padding: 0, overflow: 'hidden' }}>
                            <img
                                src={images[0].imageUrl}
                                alt={images[0].name}
                                style={{ width: '100%', maxHeight: 400, objectFit: 'cover', cursor: 'pointer' }}
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
                        <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <Image size={48} style={{ color: 'var(--admin-secondary)', marginBottom: '16px' }} />
                            <h3 style={{ margin: '0 0 8px', color: 'var(--admin-primary)' }}>No Images</h3>
                            <p style={{ margin: '0 0 20px', color: 'var(--admin-secondary)' }}>Upload some images to create the Cassandra gallery.</p>
                            <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={16} />
                                Upload Images
                            </Button>
                        </div>
                    ) : (
                        <div className="admin-card">
                            <h3 className="section-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Image size={20} style={{ color: 'var(--admin-accent)' }} />
                                Gallery ({images.length} images)
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                {images.map((image, index) => (
                                    <div key={image.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-secondary)' }}>
                                        <div
                                            style={{ aspectRatio: '1', cursor: 'pointer', overflow: 'hidden' }}
                                            onClick={() => openLightbox(index)}
                                        >
                                            <img src={image.thumbnailUrl || image.imageUrl} alt={image.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                                        </div>
                                        <div style={{ padding: '12px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--admin-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {image.name}
                                            </div>
                                            {image.description && (
                                                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {image.description}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ position: 'absolute', top: 8, right: 8 }}>
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
                    <div className="admin-card" style={{ marginTop: '24px' }}>
                        <h3 className="section-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Upload size={20} style={{ color: 'var(--admin-accent)' }} />
                            Upload New Images
                        </h3>
                        <div
                            onDragEnter={uploadProgress.uploading ? undefined : handleDrag}
                            onDragLeave={uploadProgress.uploading ? undefined : handleDrag}
                            onDragOver={uploadProgress.uploading ? undefined : handleDrag}
                            onDrop={uploadProgress.uploading ? undefined : handleDrop}
                            onClick={uploadProgress.uploading ? undefined : () => fileInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${dragActive ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                                borderRadius: '10px',
                                padding: '40px 20px',
                                textAlign: 'center',
                                cursor: uploadProgress.uploading ? 'not-allowed' : 'pointer',
                                background: dragActive ? 'var(--admin-accent-light)' : 'var(--admin-bg-secondary)',
                                opacity: uploadProgress.uploading ? 0.6 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Image size={40} style={{ color: 'var(--admin-secondary)', marginBottom: '12px' }} />
                            {uploadProgress.uploading ? (
                                <>
                                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--admin-primary)' }}>Upload in progress...</p>
                                    <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--admin-secondary)' }}>Please wait for current upload to complete</p>
                                </>
                            ) : (
                                <>
                                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--admin-primary)' }}>Click to upload or drag and drop</p>
                                    <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--admin-secondary)' }}>PNG, JPG, WebP up to 10MB each</p>
                                </>
                            )}
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
            </div>

            {/* Lightbox */}
            {lightboxOpen && images.length > 0 && (
                <div
                    onClick={closeLightbox}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
                >
                    <button onClick={closeLightbox} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title="Close (Esc)">
                        <X size={32} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '16px', borderRadius: '50%', cursor: 'pointer' }} title="Previous (←)">
                        <ChevronLeft size={32} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '16px', borderRadius: '50%', cursor: 'pointer' }} title="Next (→)">
                        <ChevronRight size={32} />
                    </button>
                    <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <img src={images[lightboxImageIndex].imageUrl} alt={images[lightboxImageIndex].name} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }} />
                        <div style={{ marginTop: '16px', textAlign: 'center', color: 'white' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600 }}>{images[lightboxImageIndex].name}</div>
                            {images[lightboxImageIndex].description && (
                                <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '4px' }}>{images[lightboxImageIndex].description}</div>
                            )}
                            <div style={{ fontSize: '14px', opacity: 0.5, marginTop: '8px' }}>{lightboxImageIndex + 1} / {images.length}</div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog {...dialogProps} />
        </AdminLayout>
    );
};

export default AdminCassandra;
