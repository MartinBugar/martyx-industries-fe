import React, { useEffect, useState } from 'react';
import type { Avatar } from '../../services/avatarService';
import { avatarService } from '../../services/avatarService';
import './AvatarSelector.css';
import { logInfo, logWarn, logError } from '../../services/logger';

interface AvatarSelectorProps {
  onClose: () => void;
  onAvatarSelected: (avatar: Avatar) => void;
  currentAvatarId?: number;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ onClose, onAvatarSelected, currentAvatarId }) => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(currentAvatarId || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    try {
      setLoading(true);
      const data = await avatarService.getAllAvatars();
      setAvatars(data);
      setError(null);
    } catch (err) {
      setError('Failed to load avatars');
      logError('Error loading avatars:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvatar = (avatar: Avatar) => {
    setSelectedAvatarId(avatar.id);
  };

  const handleConfirm = async () => {
    if (!selectedAvatarId) {
      return;
    }

    try {
      setSaving(true);
      await avatarService.updateUserAvatar(selectedAvatarId);
      const selectedAvatar = avatars.find(a => a.id === selectedAvatarId);
      if (selectedAvatar) {
        onAvatarSelected(selectedAvatar);
      }
      onClose();
    } catch (err) {
      setError('Failed to update avatar');
      logError('Error updating avatar:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="avatar-selector-overlay">
      <div className="avatar-selector-modal">
        <div className="avatar-selector-header">
          <h2>Choose Your Avatar</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {loading && (
          <div className="avatar-selector-loading">
            <p>Loading avatars...</p>
          </div>
        )}

        {error && (
          <div className="avatar-selector-error">
            <p>{error}</p>
            <button onClick={loadAvatars}>Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="avatar-grid">
              {avatars.map((avatar) => (
                <div
                  key={avatar.id}
                  className={`avatar-item ${selectedAvatarId === avatar.id ? 'selected' : ''}`}
                  onClick={() => handleSelectAvatar(avatar)}
                  title={avatar.description}
                >
                  <img src={avatar.imageUrl} alt={avatar.name} />
                  <span className="avatar-name">{avatar.name}</span>
                  {selectedAvatarId === avatar.id && (
                    <div className="avatar-checkmark">✓</div>
                  )}
                </div>
              ))}
            </div>

            <div className="avatar-selector-actions">
              <button
                className="btn-cancel"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirm}
                disabled={!selectedAvatarId || saving}
              >
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AvatarSelector;
