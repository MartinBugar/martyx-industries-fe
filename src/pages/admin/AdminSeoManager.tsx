/**
 * Admin SEO Manager Page
 * SEO Audit Dashboard - analýza a prehľad SEO problémov
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  performAudit,
  type SeoAuditDto,
  type SeoIssueDto,
  formatDate,
  getSeverityColor,
  getSeverityBgColor,
  getScoreColor,
  getScoreBgColor,
  getEntityTypeLabel,
  getIssueTypeLabel
} from '../../services/adminSeoService';
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Package,
  FolderOpen,
  FileText,
  ArrowRight,
  TrendingUp,
  Target,
  Gauge
} from 'lucide-react';
import './AdminSeoManager.css';

const AdminSeoManager: React.FC = () => {
  const navigate = useNavigate();
  const [audit, setAudit] = useState<SeoAuditDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'blog'>('overview');

  const loadAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await performAudit();
      setAudit(data);
    } catch (err) {
      console.error('Failed to load SEO audit:', err);
      setError('Nepodarilo sa načítať SEO audit');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  const handleRefresh = () => {
    loadAudit();
  };

  const handleIssueClick = (issue: SeoIssueDto) => {
    switch (issue.entityType) {
      case 'PRODUCT':
        navigate(`/admin/products/${issue.entityId}`);
        break;
      case 'CATEGORY':
        navigate(`/admin/categories/${issue.entityId}`);
        break;
      case 'BLOG_POST':
        navigate(`/admin/blog/posts/${issue.entityId}/edit`);
        break;
    }
  };

  const renderScoreGauge = () => {
    if (!audit) return null;
    const score = audit.overallScore;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="score-gauge">
        <svg viewBox="0 0 100 100" className="gauge-svg">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="gauge-value">
          <span className="score-number">{score}</span>
          <span className="score-label">{audit.scoreLabel}</span>
        </div>
      </div>
    );
  };

  const renderStatsCards = () => {
    if (!audit) return null;

    return (
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{audit.totalProducts}</div>
            <div className="stat-label">Produktov</div>
            <div className="stat-issues">
              {audit.productsWithoutMetaTitle + audit.productsWithoutMetaDescription > 0 && (
                <span className="issues-badge">
                  {audit.productsWithoutMetaTitle + audit.productsWithoutMetaDescription} problémov
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon categories">
            <FolderOpen size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{audit.totalCategories}</div>
            <div className="stat-label">Kategórií</div>
            <div className="stat-issues">
              {audit.categoriesWithoutMetaTitle + audit.categoriesWithoutMetaDescription > 0 && (
                <span className="issues-badge">
                  {audit.categoriesWithoutMetaTitle + audit.categoriesWithoutMetaDescription} problémov
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blog">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{audit.totalBlogPosts}</div>
            <div className="stat-label">Článkov</div>
            <div className="stat-issues">
              {audit.blogPostsWithoutMetaTitle + audit.blogPostsWithoutMetaDescription > 0 && (
                <span className="issues-badge">
                  {audit.blogPostsWithoutMetaTitle + audit.blogPostsWithoutMetaDescription} problémov
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon redirects">
            <ArrowRight size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{audit.activeRedirects}/{audit.totalRedirects}</div>
            <div className="stat-label">Aktívnych presmerovaní</div>
            <div className="stat-issues">
              <span className="hits-badge">{audit.totalRedirectHits} celkových prechodov</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIssuesList = (issues: SeoIssueDto[], title: string) => {
    if (issues.length === 0) {
      return (
        <div className="no-issues">
          <CheckCircle size={48} />
          <p>Žiadne SEO problémy nenájdené</p>
        </div>
      );
    }

    return (
      <div className="issues-list">
        <h3 className="issues-title">{title} ({issues.length})</h3>
        <div className="issues-table">
          <table>
            <thead>
              <tr>
                <th>Entita</th>
                <th>Typ problému</th>
                <th>Závažnosť</th>
                <th>Odporúčanie</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, index) => (
                <tr key={`${issue.entityId}-${issue.issueType}-${index}`}>
                  <td>
                    <div className="entity-info">
                      <span className="entity-type">{getEntityTypeLabel(issue.entityType)}</span>
                      <span className="entity-name">{issue.entityName}</span>
                      <span className="entity-slug">/{issue.entitySlug}</span>
                    </div>
                  </td>
                  <td>
                    <span className="issue-type">{getIssueTypeLabel(issue.issueType)}</span>
                    <span className="issue-description">{issue.issueDescription}</span>
                  </td>
                  <td>
                    <span
                      className="severity-badge"
                      style={{
                        backgroundColor: getSeverityBgColor(issue.severity),
                        color: getSeverityColor(issue.severity)
                      }}
                    >
                      {issue.severity}
                    </span>
                  </td>
                  <td className="recommendation">{issue.recommendation}</td>
                  <td>
                    <button
                      className="btn-action"
                      onClick={() => handleIssueClick(issue)}
                      title="Upraviť"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOverviewTab = () => {
    if (!audit) return null;

    const allIssues = [
      ...audit.productIssues,
      ...audit.categoryIssues,
      ...audit.blogPostIssues
    ].sort((a, b) => {
      const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }).slice(0, 20);

    return (
      <div className="overview-content">
        <div className="overview-header">
          <div className="score-section">
            {renderScoreGauge()}
            <div className="score-details">
              <h3>SEO Skóre</h3>
              <p>Celkové hodnotenie SEO optimalizácie vášho webu</p>
            </div>
          </div>
        </div>

        {renderStatsCards()}

        <div className="issues-summary">
          <h3>Najdôležitejšie problémy na riešenie</h3>
          {allIssues.length > 0 ? (
            renderIssuesList(allIssues, 'Všetky problémy')
          ) : (
            <div className="no-issues">
              <CheckCircle size={48} />
              <p>Gratulujeme! Váš web nemá žiadne SEO problémy.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProductsTab = () => {
    if (!audit) return null;

    return (
      <div className="tab-content">
        <div className="tab-stats">
          <div className="mini-stat">
            <AlertTriangle size={20} color="#ef4444" />
            <span>{audit.productsWithoutMetaTitle} bez meta title</span>
          </div>
          <div className="mini-stat">
            <AlertTriangle size={20} color="#f59e0b" />
            <span>{audit.productsWithoutMetaDescription} bez meta description</span>
          </div>
          <div className="mini-stat">
            <AlertTriangle size={20} color="#6b7280" />
            <span>{audit.productsWithShortDescription} s krátkym popisom</span>
          </div>
          <div className="mini-stat">
            <AlertTriangle size={20} color="#6b7280" />
            <span>{audit.productsWithoutImages} bez obrázkov</span>
          </div>
        </div>
        {renderIssuesList(audit.productIssues, 'Problémy produktov')}
      </div>
    );
  };

  const renderCategoriesTab = () => {
    if (!audit) return null;

    return (
      <div className="tab-content">
        <div className="tab-stats">
          <div className="mini-stat">
            <AlertTriangle size={20} color="#ef4444" />
            <span>{audit.categoriesWithoutMetaTitle} bez meta title</span>
          </div>
          <div className="mini-stat">
            <AlertTriangle size={20} color="#f59e0b" />
            <span>{audit.categoriesWithoutMetaDescription} bez meta description</span>
          </div>
        </div>
        {renderIssuesList(audit.categoryIssues, 'Problémy kategórií')}
      </div>
    );
  };

  const renderBlogTab = () => {
    if (!audit) return null;

    return (
      <div className="tab-content">
        <div className="tab-stats">
          <div className="mini-stat">
            <AlertTriangle size={20} color="#ef4444" />
            <span>{audit.blogPostsWithoutMetaTitle} bez meta title</span>
          </div>
          <div className="mini-stat">
            <AlertTriangle size={20} color="#f59e0b" />
            <span>{audit.blogPostsWithoutMetaDescription} bez meta description</span>
          </div>
        </div>
        {renderIssuesList(audit.blogPostIssues, 'Problémy článkov')}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-seo-manager">
        <div className="page-header">
          <div className="header-left">
            <Gauge size={28} />
            <div>
              <h1>SEO Audit</h1>
              <p>Analýza a optimalizácia SEO</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate('/admin/seo/redirects')}
            >
              <ArrowRight size={20} />
              Presmerovania
            </button>
            <button className="btn-primary" onClick={handleRefresh} disabled={loading}>
              <RefreshCw size={20} className={loading ? 'spinning' : ''} />
              Obnoviť audit
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={20} />
            {error}
            <button onClick={handleRefresh}>Skúsiť znova</button>
          </div>
        )}

        <div className="tabs-navigation">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Target size={18} />
            Prehľad
          </button>
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} />
            Produkty
            {audit && audit.productIssues.length > 0 && (
              <span className="tab-badge">{audit.productIssues.length}</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <FolderOpen size={18} />
            Kategórie
            {audit && audit.categoryIssues.length > 0 && (
              <span className="tab-badge">{audit.categoryIssues.length}</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            <FileText size={18} />
            Blog
            {audit && audit.blogPostIssues.length > 0 && (
              <span className="tab-badge">{audit.blogPostIssues.length}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw size={32} className="spinning" />
            <p>Analyzujem SEO...</p>
          </div>
        ) : (
          <div className="tab-container">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'products' && renderProductsTab()}
            {activeTab === 'categories' && renderCategoriesTab()}
            {activeTab === 'blog' && renderBlogTab()}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSeoManager;
