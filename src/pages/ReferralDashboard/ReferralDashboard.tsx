import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import {
  referralService,
  userCreditsService,
  type ReferralDto,
  type CreditTransactionDto
} from '../../services/referralService';
import './ReferralDashboard.css';
import { logError } from '../../services/logger';

const ReferralDashboard: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation(['referral', 'common']);

  // State
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralUrl, setReferralUrl] = useState<string>('');
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
      const [codeData, transactionsData, referralsData] = await Promise.all([
        referralService.getMyReferralCode(),
        userCreditsService.getTransactions(0, 10),
        referralService.getMyReferrals(0, 10)
      ]);

      setReferralCode(codeData.referralCode);
      setReferralUrl(codeData.referralUrl);
      setTransactions(transactionsData);
      setReferrals(referralsData);
    } catch (error) {
      logError('Failed to load referral data:', error);
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
      logError('Failed to copy:', error);
    }
  };

  const handleShareViaEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    try {
      setShareLoading(true);
      await referralService.shareViaEmail({ emails: [shareEmail] });
      setShareEmail('');
      alert(t('shareSuccess'));
    } catch (error) {
      logError('Failed to share:', error);
      alert(t('shareFailed'));
    } finally {
      setShareLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: t('status.pending'), className: 'status-pending' },
      REGISTERED: { label: t('status.registered'), className: 'status-registered' },
      FIRST_ORDER: { label: t('status.firstOrder'), className: 'status-first-order' },
      ACTIVE: { label: t('status.active'), className: 'status-active' },
      BONUS_EARNED: { label: t('status.bonusEarned'), className: 'status-bonus' },
      CANCELLED: { label: t('status.cancelled'), className: 'status-cancelled' },
      EXPIRED: { label: t('status.expired'), className: 'status-expired' }
    };

    const statusInfo = statusMap[status] || { label: status, className: 'status-default' };
    return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="referral-dashboard">
        <LoadingSpinner size="medium" />
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
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {t('tabs.overview')}
          </button>
          <button
            className={`tab ${activeTab === 'referrals' ? 'active' : ''}`}
            onClick={() => setActiveTab('referrals')}
          >
            {t('tabs.referrals')}
          </button>
          <button
            className={`tab ${activeTab === 'credits' ? 'active' : ''}`}
            onClick={() => setActiveTab('credits')}
          >
            {t('tabs.credits')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-content">
              {/* Referral Code Card */}
              <div className="referral-code-card">
                <h2>{t('yourCode')}</h2>
                <div className="code-display">
                  <div className="code-box">
                    <code>{referralCode}</code>
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(referralCode)}
                  >
                    {copied ? '✓ ' + t('copied') : t('copyCode')}
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
                    {t('copyLink')}
                  </button>
                </div>
              </div>

              {/* Share via Email */}
              <div className="share-card">
                <h2>{t('shareViaEmail')}</h2>
                <form onSubmit={handleShareViaEmail} className="share-form">
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="email-input"
                    required
                  />
                  <button type="submit" className="share-btn" disabled={shareLoading}>
                    {shareLoading ? t('sending', { ns: 'common' }) : t('send')}
                  </button>
                </form>
              </div>

              {/* How It Works */}
              <div className="how-it-works-card">
                <h2>{t('howItWorks')}</h2>
                <div className="steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h3>{t('step1.title')}</h3>
                      <p>{t('step1.description')}</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h3>{t('step2.title')}</h3>
                      <p>{t('step2.description')}</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h3>{t('step3.title')}</h3>
                      <p>{t('step3.description')}</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h3>{t('step4.title')}</h3>
                      <p>{t('step4.description')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Code Info Box */}
              <div className="discount-info-card">
                <div className="info-header">
                  <span className="info-icon">💡</span>
                  <h2>{t('discountInfo.title')}</h2>
                </div>
                <div className="info-content">
                  <p className="info-intro">{t('discountInfo.intro')}</p>
                  <ul className="info-list">
                    <li>
                      <span className="info-bullet">✓</span>
                      <span>{t('discountInfo.benefit1')}</span>
                    </li>
                    <li>
                      <span className="info-bullet">✓</span>
                      <span>{t('discountInfo.benefit2')}</span>
                    </li>
                    <li>
                      <span className="info-bullet">✓</span>
                      <span>{t('discountInfo.benefit3')}</span>
                    </li>
                    <li>
                      <span className="info-bullet">✓</span>
                      <span>{t('discountInfo.benefit4')}</span>
                    </li>
                  </ul>
                  <p className="info-note">{t('discountInfo.note')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="referrals-content">
              <h2>{t('yourReferrals')}</h2>
              {referrals.length === 0 ? (
                <div className="empty-state">
                  <p>{t('noReferralsYet')}</p>
                </div>
              ) : (
                <div className="referrals-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('table.email')}</th>
                        <th>{t('table.status')}</th>
                        <th>{t('table.orders')}</th>
                        <th>{t('table.earned')}</th>
                        <th>{t('table.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((ref) => (
                        <tr key={ref.id}>
                          <td>{ref.referredEmail || t('pending')}</td>
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
              <h2>{t('creditHistory')}</h2>
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <p>{t('noTransactions')}</p>
                </div>
              ) : (
                <div className="transactions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('table.type')}</th>
                        <th>{t('table.amount')}</th>
                        <th>{t('table.balance')}</th>
                        <th>{t('table.description')}</th>
                        <th>{t('table.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>
                            <span className={`tx-type ${tx.amount > 0 ? 'tx-credit' : 'tx-debit'}`}>
                              {t(`txType.${tx.transactionType}`)}
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
