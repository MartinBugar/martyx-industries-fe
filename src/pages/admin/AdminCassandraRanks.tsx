import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { Button } from '../../components/ui';
import cassandraRankService, {
    type CassandraRankImageDto,
    type Rank
} from '../../services/cassandraRankService';
import './AdminCassandraRanks.css';
import { logInfo, logError } from '../../services/logger';

const AdminCassandraRanks: React.FC = () => {
    const [ranks, setRanks] = useState<CassandraRankImageDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRank, setEditingRank] = useState<string | null>(null);
    const [uploadingRank, setUploadingRank] = useState<string | null>(null);
    const [editedDescriptions, setEditedDescriptions] = useState<Record<string, string>>({});
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        loadRanks();
    }, []);

    const loadRanks = async () => {
        try {
            setLoading(true);
            logInfo('🔄 Loading Cassandra ranks...');
            const data = await cassandraRankService.getAllRankImages();
            setRanks(data);
            logInfo(`✅ Loaded ${data.length} Cassandra ranks`);
        } catch (error) {
            logError('❌ Failed to load Cassandra ranks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (rank: Rank, file: File) => {
        try {
            setUploadingRank(rank);
            logInfo(`🚀 Uploading image for rank: ${rank}`);

            await cassandraRankService.uploadRankImage(rank, file);

            logInfo(`✅ Upload successful for rank: ${rank}`);
            await loadRanks(); // Reload all ranks
        } catch (error) {
            logError(`❌ Upload failed for rank ${rank}:`, error);
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploadingRank(null);
        }
    };

    const handleDescriptionEdit = (rankName: string, description: string) => {
        setEditedDescriptions(prev => ({
            ...prev,
            [rankName]: description
        }));
    };

    const handleDescriptionSave = async (rank: Rank) => {
        try {
            const newDescription = editedDescriptions[rank];
            if (newDescription === undefined) {
                setEditingRank(null);
                return;
            }

            logInfo(`💾 Updating description for rank: ${rank}`);
            await cassandraRankService.updateRankDescription(rank, newDescription);

            logInfo(`✅ Description updated for rank: ${rank}`);
            setEditingRank(null);
            setEditedDescriptions(prev => {
                const updated = { ...prev };
                delete updated[rank];
                return updated;
            });
            await loadRanks();
        } catch (error) {
            logError(`❌ Failed to update description for rank ${rank}:`, error);
            alert('Failed to update description. Please try again.');
        }
    };

    const handleDescriptionCancel = (rankName: string) => {
        setEditingRank(null);
        setEditedDescriptions(prev => {
            const updated = { ...prev };
            delete updated[rankName];
            return updated;
        });
    };

    const handleDeleteImage = async (rank: Rank) => {
        if (!window.confirm(`Are you sure you want to delete the image for ${rank}?`)) return;

        try {
            logInfo(`🗑️ Deleting image for rank: ${rank}`);
            await cassandraRankService.deleteRankImage(rank);

            logInfo(`✅ Image deleted for rank: ${rank}`);
            await loadRanks();
        } catch (error) {
            logError(`❌ Failed to delete image for rank ${rank}:`, error);
            alert('Failed to delete image. Please try again.');
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Cassandra Ranks">
                <div className="admin-card">
                    <p className="loading-text">📸 Loading Cassandra ranks...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Cassandra Maskot - Hodnosti">
            <div className="admin-cassandra-ranks">
                <div className="admin-header" style={{ marginBottom: '24px' }}>
                    <p className="subtitle">
                        Priradenie Cassandra obrázkov k 9 vojenským hodnostiam (zoradené od najnižšieho po najvyšší rank).
                        Každá hodnosť má vlastný outfit, ktorý sa automaticky zobrazí keď user dosiahne daný rank.
                    </p>
                </div>

                <div className="ranks-list">
                    {ranks.map((rankData) => {
                        const isEditing = editingRank === rankData.rankName;
                        const isUploading = uploadingRank === rankData.rankName;
                        const currentDescription = editedDescriptions[rankData.rankName] ?? rankData.description;

                        return (
                            <div key={rankData.rank} className="rank-row">
                                {/* Left: Rank Info */}
                                <div className="rank-info-section">
                                    <div className="rank-header-compact">
                                        <h3 className="rank-name">{rankData.rankName}</h3>
                                        <div className="rank-badges">
                                            <span className="rank-badge level">Level {rankData.rankLevel}</span>
                                            <span className="rank-badge xp">{rankData.requiredXp.toLocaleString()} XP</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Description */}
                                <div className="rank-description-section">
                                    {isEditing ? (
                                        <div className="description-edit">
                                            <textarea
                                                value={currentDescription}
                                                onChange={(e) => handleDescriptionEdit(rankData.rankName, e.target.value)}
                                                className="description-textarea"
                                                rows={2}
                                                placeholder="Enter description..."
                                            />
                                            <div className="description-edit-actions">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleDescriptionSave(rankData.rank)}
                                                >
                                                    💾 Save
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleDescriptionCancel(rankData.rankName)}
                                                >
                                                    ❌ Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="description-view"
                                            onClick={() => {
                                                setEditingRank(rankData.rankName);
                                                handleDescriptionEdit(rankData.rankName, rankData.description || '');
                                            }}
                                        >
                                            <p className="description-text">
                                                {rankData.description || 'Click to add description...'}
                                            </p>
                                            <span className="edit-hint">✏️ Edit</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="rank-actions-section">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={isUploading}
                                        className="upload-button"
                                        onClick={() => fileInputRefs.current[rankData.rankName]?.click()}
                                    >
                                        {isUploading ? '⏳ Uploading...' : '📤 Upload'}
                                    </Button>
                                    <input
                                        ref={el => { fileInputRefs.current[rankData.rankName] = el; }}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleImageUpload(rankData.rank, file);
                                            }
                                        }}
                                        disabled={isUploading}
                                        style={{ display: 'none' }}
                                    />

                                    {rankData.hasImage && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDeleteImage(rankData.rank)}
                                            disabled={isUploading}
                                        >
                                            🗑️
                                        </Button>
                                    )}
                                </div>

                                {/* Right: Image Preview */}
                                <div className="rank-image-section">
                                    {rankData.hasImage && rankData.imageUrl ? (
                                        <img
                                            src={rankData.thumbnailUrl || rankData.imageUrl}
                                            alt={rankData.rankName}
                                            className="rank-image-preview"
                                        />
                                    ) : (
                                        <div className="no-image-placeholder">
                                            <div className="placeholder-icon">🎨</div>
                                            <span className="placeholder-text">No Image</span>
                                        </div>
                                    )}
                                </div>

                                {/* Upload Status Overlay */}
                                {isUploading && (
                                    <div className="upload-status-overlay">
                                        <div className="upload-spinner"></div>
                                        <span>Uploading...</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminCassandraRanks;
