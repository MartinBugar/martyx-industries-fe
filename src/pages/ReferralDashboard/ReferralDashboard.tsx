import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useTranslation } from 'react-i18next';
import {
  referralService,
  userCreditsService,
  type ReferralStatsDto,
  type ReferralDto,
  type UserCreditDto,
  type CreditTransactionDto
} from '../../services/referralService';
import './ReferralDashboard.css';

const ReferralDashboard: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStatsDto | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralUrl, setReferralUrl] = useState<string>('');
  const [credits, setCredits] = useState<UserCreditDto | null>(null);
  const [transactions, setTransactions] = useState<CreditTransactionDto[]>([]);
  const [referrals, setReferrals] = useState<ReferralDto[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'credits'>('overview');
  const [shareEmail, setShareEmail] = useState('');
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadReferralData();
    }
  }, [isAuthenticated]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const [codeData, statsData, creditsData, transactionsData, referralsData] = await Promise.all([
        referralService.getMyReferralCode(),
        referralService.getMyStats(),
        userCreditsService.getBalance(),
        userCreditsService.getTransactions(0, 10),
        referralService.getMyReferrals(0, 10)
      ]);

      setReferralCode(codeData.referralCode);
      setReferralUrl(codeData.referralUrl);
      setStats(statsData);
      setCredits(creditsData);
      setTransactions(transactionsData);
      setReferrals(referralsData);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShareViaEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    try {
      setShareLoading(true);
      await referralService.shareViaEmail({ emails: [shareEmail] });
      setShareEmail('');
      alert(t('referral.shareSuccess'));
    } catch (error) {
      console.error('Failed to share:', error);
      alert(t('referral.shareFailed'));
    } finally {
      setShareLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: t('referral.status.pending'), className: 'status-pending' },
      REGISTERED: { label: t('referral.status.registered'), className: 'status-registered' },
      FIRST_ORDER: { label: t('referral.status.firstOrder'), className: 'status-first-order' },
      ACTIVE: { label: t('referral.status.active'), className: 'status-active' },
      BONUS_EARNED: { label: t('referral.status.bonusEarned'), className: 'status-bonus' },
      CANCELLED: { label: t('referral.status.cancelled'), className: 'status-cancelled' },
      EXPIRED: { label: t('referral.status.expired'), className: 'status-expired' }
    };

    const statusInfo = statusMap[status] || { label: status, className: 'status-default' };
    return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="referral-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="referral-dashboard">
      {/* Floating Cassandra */}
      <div className="referral-floating-mascot">
        <img
          src="/cassandra/Referral-Cass.png"
          alt="Cassandra - Referral Guide"
          className="floating-mascot-image"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="referral-container">
        {/* Stats Overview Cards */}
        <div className="stats-grid">
          <div className="stat-card highlight">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>€{credits?.creditBalance.toFixed(2) || '0.00'}</h3>
              <p>{t('referral.availableCredits')}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats?.successfulReferrals || 0}</h3>
              <p>{t('referral.successfulReferrals')}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎁</div>
            <div className="stat-content">
              <h3>€{stats?.totalEarnings.toFixed(2) || '0.00'}</h3>
              <p>{t('referral.totalEarnings')}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>€{credits?.pendingBalance.toFixed(2) || '0.00'}</h3>
              <p>{t('referral.pendingCredits')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {t('referral.tabs.overview')}
          </button>
          <button
            className={`tab ${activeTab === 'referrals' ? 'active' : ''}`}
            onClick={() => setActiveTab('referrals')}
          >
            {t('referral.tabs.referrals')}
          </button>
          <button
            className={`tab ${activeTab === 'credits' ? 'active' : ''}`}
            onClick={() => setActiveTab('credits')}
          >
            {t('referral.tabs.credits')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-content">
              {/* Referral Code Card */}
              <div className="referral-code-card">
                <h2>{t('referral.yourCode')}</h2>
                <div className="code-display">
                  <div className="code-box">
                    <code>{referralCode}</code>
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(referralCode)}
                  >
                    {copied ? '✓ ' + t('referral.copied') : t('referral.copyCode')}
                  </button>
                </div>

                <div className="url-display">
                  <input
                    type="text"
                    value={referralUrl}
                    readOnly
                    className="url-input"
                  />
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(referralUrl)}
                  >
                    {t('referral.copyLink')}
                  </button>
                </div>
              </div>

              {/* Share via Email */}
              <div className="share-card">
                <h2>{t('referral.shareViaEmail')}</h2>
                <form onSubmit={handleShareViaEmail} className="share-form">
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder={t('referral.emailPlaceholder')}
                    className="email-input"
                    required
                  />
                  <button type="submit" className="share-btn" disabled={shareLoading}>
                    {shareLoading ? t('common.sending') : t('referral.send')}
                  </button>
                </form>
              </div>

              {/* How It Works */}
              <div className="how-it-works-card">
                <h2>{t('referral.howItWorks')}</h2>
                <div className="steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h3>{t('referral.step1.title')}</h3>
                      <p>{t('referral.step1.description')}</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h3>{t('referral.step2.title')}</h3>
                      <p>{t('referral.step2.description')}</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h3>{t('referral.step3.title')}</h3>
                      <p>{t('referral.step3.description')}</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h3>{t('referral.step4.title')}</h3>
                      <p>{t('referral.step4.description')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="referrals-content">
              <h2>{t('referral.yourReferrals')}</h2>
              {referrals.length === 0 ? (
                <div className="empty-state">
                  <p>{t('referral.noReferralsYet')}</p>
                </div>
              ) : (
                <div className="referrals-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('referral.table.email')}</th>
                        <th>{t('referral.table.status')}</th>
                        <th>{t('referral.table.orders')}</th>
                        <th>{t('referral.table.earned')}</th>
                        <th>{t('referral.table.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((ref) => (
                        <tr key={ref.id}>
                          <td>{ref.referredEmail || t('referral.pending')}</td>
                          <td>{getStatusBadge(ref.status)}</td>
                          <td>{ref.referredTotalOrders}</td>
                          <td>
                            €{((ref.referrerRewardPaid ? ref.referrerRewardAmount || 0 : 0) +
                              (ref.bonusRewardPaid ? ref.bonusRewardAmount || 0 : 0)).toFixed(2)}
                          </td>
                          <td>{new Date(ref.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Credits Tab */}
          {activeTab === 'credits' && (
            <div className="credits-content">
              <h2>{t('referral.creditHistory')}</h2>
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <p>{t('referral.noTransactions')}</p>
                </div>
              ) : (
                <div className="transactions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('referral.table.type')}</th>
                        <th>{t('referral.table.amount')}</th>
                        <th>{t('referral.table.balance')}</th>
                        <th>{t('referral.table.description')}</th>
                        <th>{t('referral.table.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>
                            <span className={`tx-type ${tx.amount > 0 ? 'tx-credit' : 'tx-debit'}`}>
                              {t(`referral.txType.${tx.transactionType}`)}
                            </span>
                          </td>
                          <td className={tx.amount > 0 ? 'amount-positive' : 'amount-negative'}>
                            {tx.amount > 0 ? '+' : ''}€{tx.amount.toFixed(2)}
                          </td>
                          <td>€{tx.balanceAfter.toFixed(2)}</td>
                          <td>{tx.description || '-'}</td>
                          <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralDashboard;
