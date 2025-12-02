import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, RefreshCw, Mail, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button, Badge, ConfirmDialog, useConfirmDialog } from '../../components/ui';
import {
  adminAbandonedCartService,
  type ShoppingCartDto,
  type AbandonmentStatsDto
} from '../../services/adminAbandonedCartService';
import './AdminAbandonedCarts.css';
import toast from 'react-hot-toast';

const AdminAbandonedCarts: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'carts' | 'stats'>('carts');

  // Data state
  const [carts, setCarts] = useState<ShoppingCartDto[]>([]);
  const [stats, setStats] = useState<AbandonmentStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Confirm dialog
  const { confirm, dialogProps } = useConfirmDialog({
    title: 'Confirm Action',
    message: 'Are you sure?',
    variant: 'info',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  // Date range for stats (default: last 30 days)
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Load abandoned carts
  const loadCarts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminAbandonedCartService.getCartsForRecovery();
      setCarts(response || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e : new Error('Failed to load abandoned carts'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminAbandonedCartService.getAbandonmentStats(startDate, endDate);
      setStats(response);
    } catch (e: unknown) {
      setError(e instanceof Error ? e : new Error('Failed to load stats'));
    } finally {
      setIsLoading(false);
    }
  };

  // Detect abandoned carts manually
  const handleDetectAbandoned = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Detect Abandoned Carts',
      message: 'Run abandoned cart detection now?',
      variant: 'info',
      confirmText: 'Run Detection',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const detected = await adminAbandonedCartService.detectAbandonedCarts();
      toast.success(`Detected ${detected.length} abandoned carts`);
      await loadCarts();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to detect abandoned carts');
    } finally {
      setIsLoading(false);
    }
  }, [confirm]);

  // Send recovery email
  const handleSendRecoveryEmail = async (cartId: number) => {
    const discountCode = window.prompt('Enter discount code (optional):');

    setActionLoading(cartId);
    try {
      await adminAbandonedCartService.sendRecoveryEmail(cartId, discountCode || undefined);
      toast.success('Recovery email sent successfully!');
      await loadCarts();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send recovery email');
    } finally {
      setActionLoading(null);
    }
  };

  // Mark as recovered
  const handleMarkAsRecovered = useCallback(async (cartId: number) => {
    const confirmed = await confirm({
      title: 'Mark as Recovered',
      message: 'Mark this cart as recovered?',
      variant: 'info',
      confirmText: 'Mark Recovered',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    setActionLoading(cartId);
    try {
      await adminAbandonedCartService.markCartAsRecovered(cartId);
      toast.success('Cart marked as recovered');
      await loadCarts();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark as recovered');
    } finally {
      setActionLoading(null);
    }
  }, [confirm]);

  // Load data on mount or tab change
  useEffect(() => {
    if (activeTab === 'carts') {
      loadCarts();
    } else if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  // Reload stats when date range changes
  useEffect(() => {
    if (activeTab === 'stats' && stats) {
      loadStats();
    }
  }, [startDate, endDate]);

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  // Calculate time since last activity
  const getTimeSince = (dateStr: string) => {
    const now = new Date().getTime();
    const then = new Date(dateStr).getTime();
    const diff = now - then;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h ago`;
    }
    return hours > 0 ? `${hours}h ${minutes}m ago` : `${minutes}m ago`;
  };

  // Navigation tabs
  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'carts' ? 'active' : ''}`}
        onClick={() => setActiveTab('carts')}
        aria-label="View abandoned carts"
      >
        <ShoppingCart size={16} />
        Abandoned Carts
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'stats' ? 'active' : ''}`}
        onClick={() => setActiveTab('stats')}
        aria-label="View statistics"
      >
        <TrendingUp size={16} />
        Statistics
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Abandoned Carts" navTabs={navTabs}>
      <div className="admin-abandoned-carts">

        {/* ABANDONED CARTS TAB */}
        {activeTab === 'carts' && (
          <div className="carts-list">
            <div className="carts-header">
              <Button
                variant="outline"
                onClick={handleDetectAbandoned}
                disabled={isLoading}
              >
                <RefreshCw size={16} />
                Detect Abandoned Carts
              </Button>
            </div>

            {isLoading ? (
              <div className="loading">Loading abandoned carts...</div>
            ) : error ? (
              <div className="error">Error: {error.message}</div>
            ) : carts.length === 0 ? (
              <div className="empty-state">
                <ShoppingCart size={48} />
                <h3>No abandoned carts</h3>
                <p>Great! There are no abandoned carts ready for recovery.</p>
                <Button onClick={handleDetectAbandoned}>
                  <RefreshCw size={16} />
                  Run Detection
                </Button>
              </div>
            ) : (
              <div className="carts-grid">
                {carts.map((cart) => (
                  <div key={cart.id} className="cart-card">
                    <div className="cart-header">
                      <div>
                        <h3>Cart #{cart.id}</h3>
                        <Badge variant="danger">
                          <AlertTriangle size={12} />
                          ABANDONED
                        </Badge>
                      </div>
                      <div className="cart-total">€{cart.total.toFixed(2)}</div>
                    </div>

                    <div className="cart-meta">
                      <div className="meta-item">
                        <span className="meta-label">User ID:</span>
                        <span>{cart.userId || 'Guest'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Last Activity:</span>
                        <span>{getTimeSince(cart.lastActivityAt)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Created:</span>
                        <span>{formatDate(cart.createdAt)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Items:</span>
                        <span>{cart.items?.length || 0} products</span>
                      </div>
                    </div>

                    {cart.items && cart.items.length > 0 && (
                      <div className="cart-items">
                        <h4>Cart Items</h4>
                        <div className="items-list">
                          {cart.items.map((item) => (
                            <div key={item.id} className="cart-item">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="item-image"
                                />
                              )}
                              <div className="item-details">
                                <div className="item-name">{item.productName}</div>
                                {item.variantName && (
                                  <div className="item-variant">{item.variantName}</div>
                                )}
                                <div className="item-price">
                                  {item.quantity} × €{item.unitPrice.toFixed(2)} = €{item.totalPrice.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="cart-actions">
                      <Button
                        size="sm"
                        onClick={() => handleSendRecoveryEmail(cart.id)}
                        disabled={actionLoading === cart.id}
                      >
                        <Mail size={14} />
                        {actionLoading === cart.id ? 'Sending...' : 'Send Recovery Email'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRecovered(cart.id)}
                        disabled={actionLoading === cart.id}
                      >
                        Mark as Recovered
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'stats' && (
          <div className="stats-view">
            <div className="stats-controls">
              <div className="date-range">
                <label>
                  From:
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label>
                  To:
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
                <Button onClick={loadStats} disabled={isLoading}>
                  <RefreshCw size={14} />
                  Refresh Stats
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="loading">Loading statistics...</div>
            ) : error ? (
              <div className="error">Error: {error.message}</div>
            ) : !stats ? (
              <div className="empty-state">
                <TrendingUp size={48} />
                <h3>No statistics available</h3>
                <p>Select a date range to view abandonment statistics</p>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card stat-total">
                    <div className="stat-icon">
                      <ShoppingCart size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Total Abandoned</div>
                      <div className="stat-value">{stats.totalAbandoned}</div>
                      <div className="stat-meta">€{stats.totalAbandonedValue.toFixed(2)} value</div>
                    </div>
                  </div>

                  <div className="stat-card stat-recovered">
                    <div className="stat-icon">
                      <Mail size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Recovered</div>
                      <div className="stat-value">{stats.totalRecovered}</div>
                      <div className="stat-meta">€{stats.totalRecoveredValue.toFixed(2)} value</div>
                    </div>
                  </div>

                  <div className="stat-card stat-converted">
                    <div className="stat-icon">
                      <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Converted</div>
                      <div className="stat-value">{stats.totalConverted}</div>
                      <div className="stat-meta">{stats.conversionRate.toFixed(1)}% rate</div>
                    </div>
                  </div>

                  <div className="stat-card stat-recovery-rate">
                    <div className="stat-icon">
                      <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Recovery Rate</div>
                      <div className="stat-value">{stats.recoveryRate.toFixed(1)}%</div>
                      <div className="stat-meta">{stats.totalRecovered} of {stats.totalAbandoned}</div>
                    </div>
                  </div>
                </div>

                <div className="stats-details">
                  <h3>Detailed Metrics</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Average Cart Value</span>
                      <span className="detail-value">€{stats.averageCartValue.toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Abandonment Rate</span>
                      <span className="detail-value">{stats.abandonmentRate.toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Recovery Emails Sent</span>
                      <span className="detail-value">{stats.recoveryEmailsSent}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Emails Opened</span>
                      <span className="detail-value">
                        {stats.emailsOpened} ({stats.recoveryEmailsSent > 0
                          ? ((stats.emailsOpened / stats.recoveryEmailsSent) * 100).toFixed(1)
                          : 0}%)
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Emails Clicked</span>
                      <span className="detail-value">
                        {stats.emailsClicked} ({stats.recoveryEmailsSent > 0
                          ? ((stats.emailsClicked / stats.recoveryEmailsSent) * 100).toFixed(1)
                          : 0}%)
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date Range</span>
                      <span className="detail-value">
                        {formatDate(stats.startDate)} - {formatDate(stats.endDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <ConfirmDialog {...dialogProps} />
      </div>
    </AdminLayout>
  );
};

export default AdminAbandonedCarts;
