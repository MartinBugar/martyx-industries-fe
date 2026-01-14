import React, { useState, useEffect } from 'react';
import { Star, Trophy, Target, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import cassandraRankService, { type UserCassandraDto } from '../../services/cassandraRankService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './MyCassandra.css';
import { logInfo, logError } from '../../services/logger';

const MyCassandra: React.FC = () => {
    const { t } = useTranslation('cassandra');
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
            logInfo('🔄 Loading user Cassandra data...');
            const data = await cassandraRankService.getUserCassandraInfo();
            setCassandraData(data);
            logInfo('✅ Cassandra data loaded:', data);
        } catch (err) {
            logError('❌ Failed to load Cassandra data:', err);
            setError('Failed to load Cassandra information. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="my-cassandra-container">
                <LoadingSpinner size="small" />
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
            {/* XP Progress Overview */}
            <div className="cassandra-progress-overview">
                <div className="progress-stats">
                    <div className="progress-stat">
                        <Star className="stat-icon" size={20} />
                        <div className="stat-content">
                            <span className="stat-value">{cassandraData.totalXp.toLocaleString()}</span>
                            <span className="stat-label">{t('totalXp', 'Total XP')}</span>
                        </div>
                    </div>
                    <div className="progress-stat">
                        <Trophy className="stat-icon" size={20} />
                        <div className="stat-content">
                            <span className="stat-value">{cassandraData.currentRankName}</span>
                            <span className="stat-label">{t('currentRank', 'Current Rank')}</span>
                        </div>
                    </div>
                    {!cassandraData.isMaxRank && cassandraData.xpNeededForNextRank && (
                        <div className="progress-stat">
                            <Target className="stat-icon" size={20} />
                            <div className="stat-content">
                                <span className="stat-value">{cassandraData.xpNeededForNextRank.toLocaleString()}</span>
                                <span className="stat-label">{t('xpToNext', 'XP to Next Rank')}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Bar to Next Rank */}
                {!cassandraData.isMaxRank && cassandraData.progressPercentage !== undefined && (
                    <div className="rank-progress-section">
                        <div className="rank-progress-header">
                            <span className="current-rank-label">{cassandraData.currentRankName}</span>
                            <span className="progress-percentage">{Math.round(cassandraData.progressPercentage)}%</span>
                            <span className="next-rank-label">{cassandraData.nextRankName}</span>
                        </div>
                        <div className="rank-progress-bar">
                            <div
                                className="rank-progress-fill"
                                style={{ width: `${cassandraData.progressPercentage}%` }}
                            />
                        </div>
                        <div className="rank-progress-xp">
                            <span>{cassandraData.xpInCurrentRank.toLocaleString()} / {((cassandraData.nextRankRequiredXp || 0) - cassandraData.currentRankRequiredXp).toLocaleString()} XP</span>
                        </div>
                    </div>
                )}

                {cassandraData.isMaxRank && (
                    <div className="max-rank-badge">
                        <Trophy size={24} />
                        <span>{t('maxRankReached', 'Maximum Rank Achieved!')}</span>
                    </div>
                )}
            </div>

            {/* Current Cassandra Display */}
            <div className="cassandra-display-section">
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
                            <p>{t('noImage', 'No Cassandra image available for {{rank}} yet!', { rank: cassandraData.currentRankName })}</p>
                            <p className="no-cassandra-hint">{t('checkBackSoon', 'Check back soon...')}</p>
                        </div>
                    )}

                    {cassandraData.currentRankDescription && (
                        <div className="cassandra-description">
                            <p>{cassandraData.currentRankDescription}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* How to Earn XP Section */}
            <div className="cassandra-info-section">
                <div className="info-card">
                    <div className="info-icon"><TrendingUp size={24} /></div>
                    <div className="info-content">
                        <h4>{t('howToEarn', 'How to Earn XP')}</h4>
                        <ul>
                            <li>{t('earnMethod1', 'Purchase products from our store')}</li>
                            <li>{t('earnMethod2', 'Complete your builds and share them')}</li>
                            <li>{t('earnMethod3', 'Unlock achievements')}</li>
                            <li>{t('earnMethod4', 'Refer friends to join')}</li>
                        </ul>
                        <p className="info-note">
                            {t('upgradeNote', 'Cassandra will automatically upgrade to a new outfit when you reach the next rank!')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyCassandra;
