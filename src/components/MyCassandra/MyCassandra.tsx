import React, { useState, useEffect } from 'react';
import cassandraRankService, { type UserCassandraDto } from '../../services/cassandraRankService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './MyCassandra.css';
import { logInfo, logError } from '../../services/logger';

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
