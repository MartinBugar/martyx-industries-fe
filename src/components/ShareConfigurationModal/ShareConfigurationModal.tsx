import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Share2, Copy, Check, Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SelectedConfiguration } from '../../types/configurator';
import { createShare, copyShareUrl, type SharedConfigurationResponse } from '../../services/shareService';
import './ShareConfigurationModal.css';

export interface ShareConfigurationModalProps {
  isOpen: boolean;
  masterProductId: number;
  configuration: SelectedConfiguration;
  priceModifier: number;
  onClose: () => void;
}

const ShareConfigurationModal: React.FC<ShareConfigurationModalProps> = ({
  isOpen,
  masterProductId,
  configuration,
  priceModifier,
  onClose,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [shareResult, setShareResult] = useState<SharedConfigurationResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setExpiresInDays(undefined);
      setShareResult(null);
      setCopied(false);
      setError(null);
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

  const handleShare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createShare(
        masterProductId,
        configuration,
        priceModifier,
        title || undefined,
        expiresInDays
      );
      setShareResult(result);
    } catch {
      setError(t('configurator.share.error', 'Failed to create share link'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareResult) return;

    const success = await copyShareUrl(shareResult.shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="share-modal-overlay"
      onClick={!isLoading ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div
        ref={modalRef}
        className="share-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="share-modal-close"
          onClick={onClose}
          disabled={isLoading}
          aria-label={t('common.close', 'Close')}
        >
          <X size={20} />
        </button>

        <div className="share-modal-icon">
          <Share2 size={40} />
        </div>

        <h2 id="share-modal-title" className="share-modal-title">
          {t('configurator.share.title', 'Share Configuration')}
        </h2>

        {!shareResult ? (
          <>
            <p className="share-modal-description">
              {t('configurator.share.description', 'Create a shareable link for this configuration')}
            </p>

            <div className="share-modal-form">
              <div className="share-form-group">
                <label htmlFor="share-title">
                  {t('configurator.share.titleLabel', 'Name (optional)')}
                </label>
                <input
                  ref={inputRef}
                  id="share-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('configurator.share.titlePlaceholder', 'My custom build')}
                  maxLength={255}
                  disabled={isLoading}
                />
              </div>

              <div className="share-form-group">
                <label htmlFor="share-expires">
                  {t('configurator.share.expiresLabel', 'Link expires in')}
                </label>
                <select
                  id="share-expires"
                  value={expiresInDays || ''}
                  onChange={(e) => setExpiresInDays(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={isLoading}
                >
                  <option value="">{t('configurator.share.never', 'Never')}</option>
                  <option value="7">{t('configurator.share.days', '{{count}} days', { count: 7 })}</option>
                  <option value="30">{t('configurator.share.days', '{{count}} days', { count: 30 })}</option>
                  <option value="90">{t('configurator.share.days', '{{count}} days', { count: 90 })}</option>
                </select>
              </div>
            </div>

            {error && <p className="share-modal-error">{error}</p>}

            <div className="share-modal-actions">
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
                onClick={handleShare}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    {t('common.creating', 'Creating...')}
                  </>
                ) : (
                  <>
                    <Link size={16} />
                    {t('configurator.share.createLink', 'Create Link')}
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="share-modal-description">
              {t('configurator.share.success', 'Your share link is ready!')}
            </p>

            <div className="share-link-container">
              <input
                type="text"
                value={shareResult.shareUrl}
                readOnly
                className="share-link-input"
              />
              <button
                type="button"
                className={`share-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                aria-label={t('common.copy', 'Copy')}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            {shareResult.expiresAt && (
              <p className="share-modal-expires">
                {t('configurator.share.expiresOn', 'Expires on {{date}}', {
                  date: new Date(shareResult.expiresAt).toLocaleDateString()
                })}
              </p>
            )}

            <div className="share-modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
              >
                {t('common.done', 'Done')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShareConfigurationModal;
