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
      <div className="reviews-section" style={{ marginTop: '16px' }}>
        <div className="reviews-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Reviews</h3>
          {isAuthenticated ? (
            <button onClick={() => setFormOpen((v) => !v)} className="primary-btn">
              {formOpen ? 'Cancel' : 'Write a review'}
            </button>
          ) : (
            <a href="/login" className="secondary-btn">Log in to write a review</a>
          )}
        </div>

        {formOpen && isAuthenticated && (
          <form onSubmit={handleSubmit} style={{ marginTop: '12px', display: 'grid', gap: '8px', maxWidth: '600px' }} aria-label="Write a review form">
            <label>
              Rating
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} aria-label="Rating">
                {[5,4,3,2,1].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Review
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} required aria-label="Review text" />
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="primary-btn" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</button>
              <button type="button" className="secondary-btn" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</button>
            </div>
          </form>
        )}

        {loading && <p>Loading reviews...</p>}
        {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}

        {!loading && !error && (
          reviews.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '12px', display: 'grid', gap: '12px' }}>
              {reviews.map((r, idx) => (
                <li key={(r.id ?? idx).toString()} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong>{r.displayName}</strong>
                    <small style={{ color: '#64748b' }}>{formatDate(r.createdAt)}</small>
                  </div>
                  <div style={{ margin: '4px 0' }}>
                    <Stars value={r.rating ?? 0} />
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.text}</p>
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
