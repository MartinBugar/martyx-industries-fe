import React from 'react';
import { Eye, Trash2, Heart } from 'lucide-react';
import { Badge } from '../ui';
import type { AdminPhotoInfo } from '../../services/adminGalleryService';
import './GalleryPhotoCard.css';

interface GalleryPhotoCardProps {
  photo: AdminPhotoInfo;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onView: () => void;
  isDeleting?: boolean;
}

const GalleryPhotoCard: React.FC<GalleryPhotoCardProps> = ({
  photo,
  isSelected,
  onSelect,
  onDelete,
  onView,
  isDeleting = false,
}) => {
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`gallery-photo-card ${isSelected ? 'selected' : ''}`}>
      {/* Checkbox */}
      <div className="photo-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Photo Thumbnail */}
      <div className="photo-thumbnail" onClick={onView}>
        <img
          src={photo.thumbnailUrl || photo.cdnUrl}
          alt={photo.originalFilename}
          loading="lazy"
        />
        <div className="photo-overlay">
          <button className="photo-overlay-btn" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <Eye size={20} />
          </button>
        </div>
      </div>

      {/* Photo Info */}
      <div className="photo-info">
        <div className="photo-filename" title={photo.originalFilename}>
          {photo.originalFilename}
        </div>
        <div className="photo-meta">
          <span className="photo-meta-item">{formatFileSize(photo.fileSize)}</span>
          {photo.likesCount > 0 && (
            <span className="photo-meta-item">
              <Heart size={12} fill="currentColor" /> {photo.likesCount}
            </span>
          )}
        </div>
        <div className="photo-status">
          <Badge
            variant={photo.verificationStatus === 'APPROVED' ? 'success' : photo.verificationStatus === 'PENDING' ? 'warning' : 'error'}
            size="sm"
          >
            {photo.verificationStatus}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="photo-actions">
        <button
          className="photo-action-btn photo-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          title="Delete photo"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default GalleryPhotoCard;
