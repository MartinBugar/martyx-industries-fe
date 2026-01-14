import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { type TabContent } from '../../data/productData';
import { reviewsService, type Review as ReviewModel } from '../../services/reviewsService';
import { useAuth } from '../../context/useAuth';
import { adminService } from '../../services/adminService';
import { profileService } from '../../services/profileService';
import UsernamePromptModal from '../UsernamePromptModal';
import './ProductTabs.css';
import { logError, logInfo } from '../../services/logger';

interface ReviewsTabProps {
  content: TabContent;
  productId: string | number;
}

const renderTabBody = (content: TabContent) => {
  switch (content.kind) {
    case 'text':
      return (
        <div className="rich-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.text) }} />
      );
    case 'list':
      return (
        <ul>
          {content.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case 'image':
      return (
        <figure className="tab-image">
          <img src={content.image.src} alt={content.image.alt ?? ''} />
          {content.image.caption && <figcaption>{content.image.caption}</figcaption>}
        </figure>
      );
    case 'gallery':
      return (
        <div className="tab-gallery">
          {content.images.map((im, i) => (
            <figure key={i} className="tab-gallery-item">
              <img src={im.src} alt={im.alt ?? ''} />
              {im.caption && <figcaption>{im.caption}</figcaption>}
            </figure>
          ))}
        </div>
      );
    case 'downloads':
      return (
        <ul className="downloads-list">
          {content.items.map((d, i) => (
            <li key={i} className="download-item">
              <a href={d.url} download>
                {d.label}
              </a>
              {(d.size || d.format) && (
                <span className="download-meta">
                  {d.format ? ` ${d.format}` : ''}
                  {d.size ? ` · ${d.size}` : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
};

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const Stars: React.FC<{ value: number }> = ({ value }) => {
  const stars = useMemo(() => {
    const v = Math.max(0, Math.min(5, Math.round(value)));
    return '★★★★★☆☆☆☆☆'.slice(5 - v, 10 - v);
  }, [value]);
  return <span aria-label={`${value} out of 5 stars`} title={`${value}/5`}>{stars}</span>;
};

const StarRating: React.FC<{ value: number; onChange: (v: number) => void; id?: string }> = ({ value, onChange, id }) => {
  const [hover, setHover] = useState<number | null>(null);
  const current = hover ?? value;
  return (
    <div className="star-rating" role="radiogroup" aria-labelledby={id ? `${id}-label` : undefined}>
      {[1, 2, 3, 4, 5].map((v) => {
        const filled = v <= current;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            className={`star ${filled ? 'filled' : ''}`}
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(v)}
            onBlur={() => setHover(null)}
            onClick={() => onChange(v)}
            aria-label={`${v} star${v > 1 ? 's' : ''}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
};

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ReviewsTab: React.FC<ReviewsTabProps> = ({ content, productId }) => {
  const { t } = useTranslation('common');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [reviews, setReviews] = useState<Array<ReviewModel & { displayName: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    reviewsService.getReviews(productId)
      .then((data) => { if (!cancelled) setReviews(data); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load reviews'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  // Check if current user is ADMIN to conditionally show delete buttons
  useEffect(() => {
    // Skip while auth is still loading to avoid race conditions
    if (isAuthLoading) return;

    let cancelled = false;
    const check = async () => {
      if (!isAuthenticated) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      try {
        const ok = await adminService.checkAdmin();
        if (!cancelled) setIsAdmin(ok);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    };
    void check();
    return () => { cancelled = true; };
  }, [isAuthenticated, isAuthLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (selectedImages.length + validFiles.length >= MAX_IMAGES) {
        setError(t('reviews.max_images', { max: MAX_IMAGES }));
        break;
      }
      if (!file.type.startsWith('image/')) {
        setError(t('reviews.invalid_file_type'));
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError(t('reviews.file_too_large', { max: '5MB' }));
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedImages(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('You must be logged in to submit a review.');
      return;
    }
    if (!rating || !text.trim()) {
      setError('Please provide both rating and review text.');
      return;
    }

    // Check if user has username before submitting review
    try {
      const { hasUsername } = await profileService.checkHasUsername();
      if (!hasUsername) {
        // Show username prompt modal
        setShowUsernameModal(true);
        return;
      }
    } catch (err) {
      logError('Failed to check username:', err);
      // Continue anyway - backend will handle it
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await reviewsService.addReview(productId, { rating, text });

      // Upload images if any
      if (selectedImages.length > 0 && created.id) {
        try {
          const uploadedImages = await reviewsService.uploadImages(created.id, selectedImages);
          created.images = uploadedImages;
          logInfo('Uploaded review images:', uploadedImages);
        } catch (imgErr) {
          logError('Failed to upload review images:', imgErr);
          // Review was created, just images failed
        }
      }

      setReviews((prev) => [created, ...prev]);
      setText('');
      setRating(5);
      setSelectedImages([]);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews([]);
      setFormOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUsernameModalSuccess = () => {
    // User set username or skipped - close modal and retry submit
    setShowUsernameModal(false);
    // Trigger submit again (username is now set or auto-generated)
    const form = document.getElementById('write-review-form') as HTMLFormElement;
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const handleDelete = async (reviewId: string | number) => {
    if (!isAdmin) return;
    const confirmed = window.confirm(t('admin.confirm_delete_review'));
    if (!confirmed) return;
    try {
      setDeletingId(reviewId);
      await reviewsService.deleteReview(productId, reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const body = renderTabBody(content);

  return (
    <>
      {body}
      <UsernamePromptModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onSuccess={handleUsernameModalSuccess}
      />
      <div className="reviews-section">
        <div className="reviews-header">
          <div className="reviews-title-row">
            <h3 className="reviews-title">{t('reviews.title')}</h3>
            {reviews.length > 0 && (
              <div
                className="reviews-average"
                aria-label={`Average rating ${averageRating.toFixed(1)} out of 5 based on ${reviews.length} reviews`}
                title={`${averageRating.toFixed(1)} / 5 (${reviews.length} review${reviews.length > 1 ? 's' : ''})`}
             >
                <span className="stars"><Stars value={averageRating} /></span>
                <span className="avg-number">{averageRating.toFixed(1)}</span>
                <span className="avg-count">({reviews.length})</span>
              </div>
            )}
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setFormOpen((v) => !v)}
              className="icon-btn"
              aria-label={formOpen ? t('common.close') : t('reviews.write_review')}
              title={formOpen ? t('common.close') : t('reviews.write_review')}
              aria-expanded={formOpen}
              aria-controls="write-review-form"
            >
              {formOpen ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M4 17.25V20h2.75L17.81 8.94l-2.75-2.75L4 17.25z" fill="currentColor"/>
                  <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 2.75 2.75 1.84-1.82z" fill="currentColor"/>
                </svg>
              )}
            </button>
          ) : (
            <Link to="/login" className="secondary-btn chip-btn">{t('reviews.login_to_review')}</Link>
          )}
        </div>

        {formOpen && isAuthenticated && (
          <form id="write-review-form" onSubmit={handleSubmit} className="review-form" aria-label={t('aria.write_review_form')}>
            <div className="form-field">
              <label id="rating-label" htmlFor="rating-stars">{t('reviews.rating')}</label>
              <StarRating id="rating-stars" value={rating} onChange={setRating} />
              <small className="muted">{t('reviews.rating_hint')}</small>
            </div>
            <div className="form-field">
              <label htmlFor="review-text">{t('reviews.your_review')}</label>
              <textarea id="review-text" value={text} onChange={(e) => setText(e.target.value)} rows={5} required placeholder={t('placeholders.review_placeholder')} />
            </div>
            <div className="form-field">
              <label htmlFor="review-images">{t('reviews.add_photos', 'Add Photos')} <small className="muted">({t('reviews.optional', 'optional')}, {t('reviews.max_count', 'max {{max}}', { max: MAX_IMAGES })})</small></label>
              <input
                ref={fileInputRef}
                type="file"
                id="review-images"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageSelect}
                disabled={selectedImages.length >= MAX_IMAGES}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="secondary-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedImages.length >= MAX_IMAGES}
              >
                {t('reviews.choose_photos', 'Choose Photos')}
              </button>
              {imagePreviews.length > 0 && (
                <div className="review-image-previews">
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="image-preview-item">
                      <img src={url} alt={`Preview ${idx + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => handleRemoveImage(idx)}
                        aria-label={t('reviews.remove_image', 'Remove image')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={submitting || !text.trim()}>{submitting ? t('reviews.submitting') : t('reviews.submit_review')}</button>
              <button type="button" className="secondary-btn" onClick={() => setFormOpen(false)} disabled={submitting}>{t('reviews.cancel')}</button>
            </div>
          </form>
        )}

        {loading && <p className="muted">{t('reviews.loading')}</p>}
        {error && <p role="alert" className="error-text">{error}</p>}

        {!loading && !error && (
          reviews.length === 0 ? (
            <p className="muted">{t('reviews.no_reviews')}</p>
          ) : (
            <ul className="reviews-list">
              {reviews.map((r, idx) => (
                <li key={(r.id ?? idx).toString()} className="review-card">
                  <div className="review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div className="review-card-meta" style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{r.displayName}</strong>
                      <small className="muted">{formatDate(r.createdAt)}</small>
                    </div>
                    {isAdmin && r.id != null && (
                      <button
                        type="button"
                        className="review-delete-btn"
                        onClick={() => handleDelete(r.id as string | number)}
                        disabled={deletingId === r.id}
                        aria-label={t('aria.delete_review')}
                        title={t('aria.delete_review')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="review-card-stars">
                    <Stars value={r.rating ?? 0} />
                  </div>
                  <p className="review-card-text">{r.text}</p>
                  {r.images && r.images.length > 0 && (
                    <div className="review-images">
                      {r.images.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          className="review-image-thumb"
                          onClick={() => setLightboxImage(img.cdnUrl)}
                          aria-label={t('reviews.view_photo', 'View photo')}
                        >
                          <img
                            src={img.thumbnailUrl || img.cdnUrl}
                            alt={t('reviews.review_photo', 'Review photo')}
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="review-lightbox"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t('reviews.photo_lightbox', 'Photo viewer')}
        >
          <button
            className="lightbox-close"
            onClick={() => setLightboxImage(null)}
            aria-label={t('common.close', 'Close')}
          >
            ×
          </button>
          <img
            src={lightboxImage}
            alt={t('reviews.review_photo', 'Review photo')}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ReviewsTab;
