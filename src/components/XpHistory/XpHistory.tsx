import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import xpHistoryService, { type XpTransactionDto } from '../../services/xpHistoryService';
import './XpHistory.css';
import { logInfo, logWarn, logError } from '../../services/logger';

const XpHistory: React.FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<XpTransactionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 20;

    useEffect(() => {
        if (user) {
            loadTransactions();
        }
    }, [user, page]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            logInfo(`🔄 Loading XP history (page ${page})...`);

            const data = await xpHistoryService.getMyXpHistory({
                page,
                size: pageSize
            });

            setTransactions(prev => page === 0 ? data : [...prev, ...data]);
            setHasMore(data.length === pageSize);

            logInfo(`✅ Loaded ${data.length} XP transactions`);
        } catch (err) {
            logError('❌ Failed to load XP history:', err);
            setError('Failed to load XP history. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('sk-SK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSourceIcon = (source: string): string => {
        const iconMap: Record<string, string> = {
            'PURCHASE': '💰',
            'GALLERY_UPLOAD': '🖼️',
            'REVIEW': '⭐',
            'REFERRAL_FIRST_ORDER': '👥',
            'REFERRAL_MILESTONE': '🎉',
            'FORUM_POST': '💬',
            'PHOTO_LIKE': '❤️',
            'SOCIAL_SHARE': '🔗',
            'EMAIL_VERIFICATION': '📧',
            'BIRTHDAY_BONUS': '🎂',
            'TUTORIAL_COMPLETION': '📝',
            'ADMIN_ADJUSTMENT': '⚙️'
        };
        return iconMap[source] || '⭐';
    };

    const getSourceColor = (xpAmount: number): string => {
        if (xpAmount < 0) return 'negative';
        if (xpAmount >= 100) return 'high';
        if (xpAmount >= 50) return 'medium';
        return 'low';
    };

    if (!user) {
        return (
            <div className="xp-history">
                <div className="empty-state">
                    <p>Please log in to view your XP history.</p>
                </div>
            </div>
        );
    }

    if (loading && page === 0) {
        return (
            <div className="xp-history">
                <div className="loading-spinner">Loading your XP history...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="xp-history">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="xp-history">
                <div className="empty-state">
                    <span className="empty-icon">🎮</span>
                    <h3>No XP History Yet</h3>
                    <p>Start earning XP by purchasing products, writing reviews, and uploading build photos!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="xp-history">
            <div className="history-header">
                <h2>🎮 Your XP History</h2>
                <p className="history-subtitle">Track all your XP earnings and progress</p>
            </div>

            <div className="transactions-list">
                {transactions.map((transaction) => (
                    <div key={transaction.id} className={`transaction-row ${getSourceColor(transaction.xpAmount)}`}>
                        <div className="transaction-icon">
                            {getSourceIcon(transaction.xpSource)}
                        </div>

                        <div className="transaction-info">
                            <div className="transaction-description">
                                {transaction.description || transaction.xpSource}
                            </div>
                            <div className="transaction-meta">
                                <span className="transaction-date">
                                    {formatDate(transaction.createdAt)}
                                </span>
                                <span className="transaction-source">
                                    {transaction.xpSource.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>

                        <div className="transaction-xp">
                            <span className={`xp-amount ${transaction.xpAmount >= 0 ? 'positive' : 'negative'}`}>
                                {transaction.xpAmount >= 0 ? '+' : ''}{transaction.xpAmount} XP
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && !loading && (
                <div className="load-more-section">
                    <button onClick={handleLoadMore} className="load-more-button">
                        Load More
                    </button>
                </div>
            )}

            {loading && page > 0 && (
                <div className="loading-more">
                    <div className="spinner-small"></div>
                    <span>Loading more...</span>
                </div>
            )}
        </div>
    );
};

export default XpHistory;
