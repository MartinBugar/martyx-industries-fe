import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import './AdminCassandra.css';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import { Button } from '../../components/ui';
import { Plus, Edit, Trash2, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface CassandraImage {
    id: number;
    url: string;
    name: string;
    description?: string;
}

const AdminCassandra: React.FC = () => {
    const [images, setImages] = useState<CassandraImage[]>([
        {
            id: 1,
            url: '/cassandra/Cassandra-life.png',
            name: 'Cassandra Life',
            description: 'Main mascot image'
        }
    ]);
    const [selectedImage, setSelectedImage] = useState<CassandraImage | null>(images[0]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingImage, setEditingImage] = useState<CassandraImage | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

    const [formData, setFormData] = useState({
        url: '',
        name: '',
        description: ''
    });

    const handleAdd = () => {
        setFormData({ url: '', name: '', description: '' });
        setEditingImage(null);
        setShowAddModal(true);
    };

    const handleEdit = (image: CassandraImage) => {
        setFormData({
            url: image.url,
            name: image.name,
            description: image.description || ''
        });
        setEditingImage(image);
        setShowAddModal(true);
    };

    const handleSave = () => {
        if (!formData.url || !formData.name) {
            alert('Please fill in URL and Name');
            return;
        }

        if (editingImage) {
            // Update existing
            setImages(images.map(img =>
                img.id === editingImage.id
                    ? { ...img, url: formData.url, name: formData.name, description: formData.description }
                    : img
            ));
        } else {
            // Add new
            const newImage: CassandraImage = {
                id: Math.max(...images.map(i => i.id), 0) + 1,
                url: formData.url,
                name: formData.name,
                description: formData.description
            };
            setImages([...images, newImage]);
            setSelectedImage(newImage);
        }
        setShowAddModal(false);
    };

    const handleDelete = (id: number) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;
        setImages(images.filter(img => img.id !== id));
        if (selectedImage?.id === id) {
            setSelectedImage(images.find(img => img.id !== id) || null);
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

    return (
        <AdminLayout title="CASSANDRA Mascot">
            <div className="admin-cassandra-container">
                {/* Main Cassandra Display */}
                <div className="cassandra-main-display">
                    {selectedImage && (
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.name}
                            className="cassandra-main-image"
                            onClick={() => {
                                const index = images.findIndex(img => img.id === selectedImage.id);
                                openLightbox(index);
                            }}
                            style={{ cursor: 'pointer' }}
                        />
                    )}
                </div>

                {/* Gallery Management Section */}
                <div className="admin-card" style={{ marginTop: '24px' }}>
                    <div className="admin-header" style={{ marginBottom: '20px' }}>
                        <h3 className="section-title">Cassandra Gallery</h3>
                        <div className="header-actions">
                            <Button variant="primary" onClick={handleAdd}>
                                <Plus size={16} style={{ marginRight: 4 }} />
                                Add Image
                            </Button>
                        </div>
                    </div>

                    <div className="cassandra-gallery-grid">
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                className={`cassandra-gallery-item ${selectedImage?.id === image.id ? 'active' : ''}`}
                            >
                                <div
                                    className="cassandra-thumbnail"
                                    onClick={() => openLightbox(index)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <img src={image.url} alt={image.name} />
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
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(image);
                                        }}
                                        title="Edit image"
                                    >
                                        <Edit size={14} />
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(image.id);
                                        }}
                                        title="Delete image"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
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
                            src={images[lightboxImageIndex].url}
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

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="section-title">{editingImage ? 'Edit Image' : 'Add New Image'}</h3>
                        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div>
                                <label className="form-label">Image URL *</label>
                                <input
                                    className="form-input"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://... or /cassandra/..."
                                />
                            </div>
                            <div>
                                <label className="form-label">Name *</label>
                                <input
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Cassandra Portrait"
                                />
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description..."
                                />
                            </div>
                        </div>
                        <div className="form-actions" style={{ marginTop: 24 }}>
                            <Button variant="primary" onClick={handleSave}>
                                Save
                            </Button>
                            <Button variant="outline" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminCassandra;
