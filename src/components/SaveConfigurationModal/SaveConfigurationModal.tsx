import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SelectedConfiguration } from '../../types/configurator';
import { saveConfiguration, SavedConfigurationResponse } from '../../services/savedConfigurationService';
import './SaveConfigurationModal.css';

export interface SaveConfigurationModalProps {
  isOpen: boolean;
  masterProductId: number;
  configuration: SelectedConfiguration;
  priceModifier: number;
  onClose: () => void;
  onSaved?: (config: SavedConfigurationResponse) => void;
}

const SaveConfigurationModal: React.FC<SaveConfigurationModalProps> = ({
  isOpen,
  masterProductId,
  configuration,
  priceModifier,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setSaved(false);
      setError(null);
      // Focus input after modal animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Focus trap
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('savedConfig.nameRequired', 'Please enter a name'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await saveConfiguration(
        masterProductId,
        name.trim(),
        configuration,
        priceModifier
      );
      setSaved(true);
      onSaved?.(result);
      // Auto-close after success
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('savedConfig.error', 'Failed to save configuration');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && name.trim()) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="save-modal-overlay"
      onClick={!isLoading ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-modal-title"
    >
      <div
        ref={modalRef}
        className="save-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="save-modal-close"
          onClick={onClose}
          disabled={isLoading}
          aria-label={t('common.close', 'Close')}
        >
          <X size={20} />
        </button>

        <div className={`save-modal-icon ${saved ? 'success' : ''}`}>
          {saved ? <Check size={40} /> : <Save size={40} />}
        </div>

        <h2 id="save-modal-title" className="save-modal-title">
          {saved
            ? t('savedConfig.successTitle', 'Configuration Saved!')
            : t('savedConfig.title', 'Save Configuration')}
        </h2>

        {!saved && (
          <>
            <p className="save-modal-description">
              {t('savedConfig.description', 'Save this configuration to your library for later use')}
            </p>

            <div className="save-modal-form">
              <div className="save-form-group">
                <label htmlFor="save-name">
                  {t('savedConfig.nameLabel', 'Configuration name')}
                </label>
                <input
                  ref={inputRef}
                  id="save-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('savedConfig.namePlaceholder', 'My custom build')}
                  maxLength={255}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && <p className="save-modal-error">{error}</p>}

            <div className="save-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    {t('common.saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {t('savedConfig.save', 'Save')}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SaveConfigurationModal;
