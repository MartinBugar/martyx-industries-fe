import React, { useEffect, useMemo, useState } from 'react';
import { type TabContent } from '../../data/productData';
import { reviewsService, type Review as ReviewModel } from '../../services/reviewsService';
import { useAuth } from '../../context/useAuth';

interface ReviewsTabProps {
  content: TabContent;
  productId: string;
}

const renderTabBody = (content: TabContent) => {
  switch (content.kind) {
    case 'text':
      return (
        <div className="rich-text" dangerouslySetInnerHTML={{ __html: content.text }} />
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

const ReviewsTab: React.FC<ReviewsTabProps> = ({ content, productId }) => {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Array<ReviewModel & { displayName: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    setError(null);
    try {
      const created = await reviewsService.addReview(productId, { rating, text });
      setReviews((prev) => [created, ...prev]);
      setText('');
      setRating(5);
      setFormOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const body = renderTabBody(content);

  return (
    <>
      {body}
      <div className="reviews-section">
        <div className="reviews-header">
          <h3 className="reviews-title">Reviews</h3>
          {isAuthenticated ? (
            <button onClick={() => setFormOpen((v) => !v)} className="primary-btn">
              {formOpen ? 'Cancel' : 'Write a review'}
            </button>
          ) : (
            <a href="/login" className="secondary-btn">Log in to write a review</a>
          )}
        </div>

        {formOpen && isAuthenticated && (
          <form onSubmit={handleSubmit} className="review-form" aria-label="Write a review form">
            <div className="form-field">
              <label id="rating-label" htmlFor="rating-stars">Rating</label>
              <StarRating id="rating-stars" value={rating} onChange={setRating} />
              <small className="muted">Tap a star to set your rating</small>
            </div>
            <div className="form-field">
              <label htmlFor="review-text">Your review</label>
              <textarea id="review-text" value={text} onChange={(e) => setText(e.target.value)} rows={5} required placeholder="Share your thoughts about this product..." />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={submitting || !text.trim()}>{submitting ? 'Submitting...' : 'Submit Review'}</button>
              <button type="button" className="secondary-btn" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</button>
            </div>
          </form>
        )}

        {loading && <p className="muted">Loading reviews...</p>}
        {error && <p role="alert" className="error-text">{error}</p>}

        {!loading && !error && (
          reviews.length === 0 ? (
            <p className="muted">No reviews yet.</p>
          ) : (
            <ul className="reviews-list">
              {reviews.map((r, idx) => (
                <li key={(r.id ?? idx).toString()} className="review-card">
                  <div className="review-card-header">
                    <strong>{r.displayName}</strong>
                    <small className="muted">{formatDate(r.createdAt)}</small>
                  </div>
                  <div className="review-card-stars">
                    <Stars value={r.rating ?? 0} />
                  </div>
                  <p className="review-card-text">{r.text}</p>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </>
  );
};

export default ReviewsTab;
