import React, { useState, useEffect } from 'react';
import cassandraRankService, { type UserCassandraDto } from '../../services/cassandraRankService';
import './MyCassandra.css';

const MyCassandra: React.FC = () => {
    const [cassandraData, setCassandraData] = useState<UserCassandraDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCassandraData();
    }, []);

    const loadCassandraData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔄 Loading user Cassandra data...');
            const data = await cassandraRankService.getUserCassandraInfo();
            setCassandraData(data);
            console.log('✅ Cassandra data loaded:', data);
        } catch (err) {
            console.error('❌ Failed to load Cassandra data:', err);
            setError('Failed to load Cassandra information. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="my-cassandra-container">
                <div className="cassandra-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your Cassandra...</p>
                </div>
            </div>
        );
    }

    if (error || !cassandraData) {
        return (
            <div className="my-cassandra-container">
                <div className="cassandra-error">
                    <div className="error-icon">⚠️</div>
                    <p>{error || 'Unable to load Cassandra data'}</p>
                    <button onClick={loadCassandraData} className="retry-button">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="my-cassandra-container">
            {/* Header */}
            <header className="cassandra-header">
                <h2 className="cassandra-title">
                    <span className="title-icon">🎖️</span>
                    My Cassandra
                </h2>
                <p className="cassandra-subtitle">
                    Your personal mascot evolves as you progress through military ranks!
                </p>
            </header>

            {/* Current Rank & Progress Section */}
            <div className="rank-progress-section">
                <div className="current-rank-display">
                    <div className="rank-badge-large">{cassandraData.currentRankName}</div>
                    <div className="rank-level">Level {cassandraData.currentRankLevel}</div>
                </div>

                <div className="xp-progress-card">
                    <div className="progress-header">
                        <div className="progress-info">
                            <span className="current-xp">{cassandraData.totalXp.toLocaleString()} XP</span>
                            {!cassandraData.isMaxRank && cassandraData.nextRankName && (
                                <span className="next-rank-info">
                                    Next: <strong>{cassandraData.nextRankName}</strong> ({cassandraData.nextRankRequiredXp?.toLocaleString()} XP)
                                </span>
                            )}
                        </div>
                    </div>

                    {!cassandraData.isMaxRank && cassandraData.progressPercentage !== undefined && (
                        <>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${cassandraData.progressPercentage}%` }}
                                >
                                    <span className="progress-percentage">
                                        {cassandraData.progressPercentage}%
                                    </span>
                                </div>
                            </div>
                            <p className="progress-text">
                                {cassandraData.xpNeededForNextRank?.toLocaleString()} XP needed to reach {cassandraData.nextRankName}
                            </p>
                        </>
                    )}

                    {cassandraData.isMaxRank && (
                        <div className="max-rank-badge">
                            <span className="max-rank-icon">🏆</span>
                            <span className="max-rank-text">Maximum Rank Achieved!</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Current Cassandra Display */}
            <div className="cassandra-display-section">
                <h3 className="section-title">Current Cassandra</h3>
                <div className="cassandra-card">
                    {cassandraData.currentRankImageUrl ? (
                        <div className="cassandra-image-wrapper">
                            <img
                                src={cassandraData.currentRankImageUrl}
                                alt={`Cassandra ${cassandraData.currentRankName}`}
                                className="cassandra-image"
                            />
                        </div>
                    ) : (
                        <div className="no-cassandra">
                            <div className="no-cassandra-icon">🎨</div>
                            <p>No Cassandra image available for {cassandraData.currentRankName} yet!</p>
                            <p className="no-cassandra-hint">Check back soon...</p>
                        </div>
                    )}

                    {cassandraData.currentRankDescription && (
                        <div className="cassandra-description">
                            <p>{cassandraData.currentRankDescription}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Next Cassandra Preview (if not max rank) */}
            {!cassandraData.isMaxRank && cassandraData.nextRankName && (
                <div className="next-cassandra-section">
                    <h3 className="section-title">
                        <span className="preview-icon">🔮</span>
                        Next Rank Preview: {cassandraData.nextRankName}
                    </h3>
                    <div className="next-cassandra-card">
                        {cassandraData.nextRankThumbnailUrl ? (
                            <div className="next-cassandra-preview">
                                <img
                                    src={cassandraData.nextRankThumbnailUrl}
                                    alt={`Next Cassandra ${cassandraData.nextRankName}`}
                                    className="next-cassandra-image"
                                />
                                {cassandraData.nextRankDescription && (
                                    <p className="next-cassandra-description">
                                        {cassandraData.nextRankDescription}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="no-next-cassandra">
                                <div className="no-next-icon">🎨</div>
                                <p>Next Cassandra image coming soon!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Info Section */}
            <div className="cassandra-info-section">
                <div className="info-card">
                    <div className="info-icon">💡</div>
                    <div className="info-content">
                        <h4>How to Earn XP</h4>
                        <ul>
                            <li>Purchase products from our store</li>
                            <li>Complete your builds and share them</li>
                            <li>Unlock achievements</li>
                            <li>Refer friends to join</li>
                        </ul>
                        <p className="info-note">
                            Cassandra will automatically upgrade to a new outfit when you reach the next rank!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyCassandra;
