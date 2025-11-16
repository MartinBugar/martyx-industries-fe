import React, { useEffect, useMemo, useState } from 'react';
import { Star, X, Award } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import { adminReviewsService } from '../../services/adminReviewsService';
import { type Testimonial } from '../../services/testimonialService';
import { Button, Badge, SkeletonTable } from '../../components/ui';

const formatDateTime = (value: string): string => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString();
};

const AdminReviews: React.FC = () => {
    const [reviews, setReviews] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState<string>('');
    const [filterFeatured, setFilterFeatured] = useState<'all' | 'featured' | 'not-featured'>('all');

    const filtered = useMemo(() => {
        let result = reviews;

        // Apply featured filter
        if (filterFeatured === 'featured') {
            result = result.filter(r => r.isFeatured === true);
        } else if (filterFeatured === 'not-featured') {
            result = result.filter(r => !r.isFeatured);
        }

        // Apply search query
        if (query.trim()) {
            const q = query.toLowerCase();
            result = result.filter(r =>
                `${r.userName ?? ''} ${r.productName ?? ''} ${r.title ?? ''} ${r.comment ?? ''}`.toLowerCase().includes(q)
            );
        }

        return result;
    }, [reviews, query, filterFeatured]);

    const loadReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminReviewsService.getAllReviews();
            setReviews(data);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load reviews';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, []);

    const handleToggleFeatured = async (review: Testimonial) => {
        setError(null);
        try {
            const updated = await adminReviewsService.toggleFeaturedStatus(review.id);
            setReviews(prev => prev.map(r => r.id === review.id ? updated : r));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to toggle featured status';
            setError(msg);
        }
    };

    const handleDelete = async (review: Testimonial) => {
        if (!confirm(`Delete review by ${review.userName}?`)) return;
        setError(null);
        try {
            await adminReviewsService.deleteReview(review.productId, review.id);
            setReviews(prev => prev.filter(r => r.id !== review.id));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to delete review';
            setError(msg);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        size={14}
                        fill={star <= rating ? '#fbbf24' : 'none'}
                        stroke={star <= rating ? '#fbbf24' : '#d1d5db'}
                    />
                ))}
            </div>
        );
    };

    const navTabs = (
        <nav className="dashboard-tabs">
            <button
                className={`dashboard-tab ${filterFeatured === 'all' ? 'active' : ''}`}
                onClick={() => setFilterFeatured('all')}
                aria-label="View all reviews"
            >
                All Reviews
            </button>
            <button
                className={`dashboard-tab ${filterFeatured === 'featured' ? 'active' : ''}`}
                onClick={() => setFilterFeatured('featured')}
                aria-label="View featured reviews"
            >
                Featured
            </button>
            <button
                className={`dashboard-tab ${filterFeatured === 'not-featured' ? 'active' : ''}`}
                onClick={() => setFilterFeatured('not-featured')}
                aria-label="View not featured reviews"
            >
                Not Featured
            </button>
        </nav>
    );

    return (
        <AdminLayout title="Reviews Management" navTabs={navTabs}>
            <div className="admin-page">
                <div className="admin-container">
                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="admin-header-actions">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by user, product, title, or comment..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Button variant="outline" onClick={loadReviews}>
                            Refresh
                        </Button>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="mobile-table-cards">
                        {loading ? (
                            <div className="mobile-table-card">
                                <SkeletonTable rows={5} columns={4} />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="mobile-table-card">
                                <div className="table-empty">No reviews found.</div>
                            </div>
                        ) : (
                            filtered.map(review => (
                                <div key={`mobile-${review.id}`} className="mobile-table-card">
                                    <div className="mobile-card-header">
                                        <div>
                                            <h4 className="mobile-card-title">{review.title}</h4>
                                            <p className="mobile-card-subtitle">
                                                {review.userName} • {review.productName}
                                            </p>
                                        </div>
                                        <div className="mobile-card-actions">
                                            <Button
                                                variant={review.isFeatured ? 'primary' : 'outline'}
                                                size="sm"
                                                onClick={() => handleToggleFeatured(review)}
                                                title={review.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                                            >
                                                <Award size={14} />
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(review)}
                                                title="Delete review"
                                            >
                                                <X size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mobile-card-body">
                                        <div className="mobile-field">
                                            <span className="mobile-field-label">Rating:</span>
                                            <span className="mobile-field-value">{renderStars(review.rating)}</span>
                                        </div>
                                        <div className="mobile-field">
                                            <span className="mobile-field-label">Comment:</span>
                                            <span className="mobile-field-value">{review.comment}</span>
                                        </div>
                                        <div className="mobile-field">
                                            <span className="mobile-field-label">Date:</span>
                                            <span className="mobile-field-value">{formatDateTime(review.createdAt)}</span>
                                        </div>
                                        <div className="mobile-field">
                                            <span className="mobile-field-label">Featured:</span>
                                            <span className="mobile-field-value">
                                                <Badge variant={review.isFeatured ? 'success' : 'default'} size="sm">
                                                    {review.isFeatured ? 'Yes' : 'No'}
                                                </Badge>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 60 }}>ID</th>
                                    <th>User</th>
                                    <th>Product</th>
                                    <th>Rating</th>
                                    <th>Title</th>
                                    <th>Comment</th>
                                    <th>Date</th>
                                    <th>Featured</th>
                                    <th style={{ width: 140 }} className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="table-empty">
                                            <SkeletonTable rows={5} columns={9} />
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="table-empty">No reviews found.</td>
                                    </tr>
                                ) : (
                                    filtered.map(review => (
                                        <tr key={review.id}>
                                            <td>{review.id}</td>
                                            <td>{review.userName ?? '—'}</td>
                                            <td>{review.productName ?? '—'}</td>
                                            <td>{renderStars(review.rating)}</td>
                                            <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {review.title ?? '—'}
                                            </td>
                                            <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {review.comment ?? '—'}
                                            </td>
                                            <td>{formatDateTime(review.createdAt)}</td>
                                            <td>
                                                <Badge variant={review.isFeatured ? 'success' : 'default'} size="sm">
                                                    {review.isFeatured ? 'Yes' : 'No'}
                                                </Badge>
                                            </td>
                                            <td className="text-right">
                                                <div className="action-buttons">
                                                    <Button
                                                        variant={review.isFeatured ? 'primary' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleToggleFeatured(review)}
                                                        title={review.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                                                    >
                                                        <Award size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(review)}
                                                        title="Delete review"
                                                    >
                                                        <X size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminReviews;
