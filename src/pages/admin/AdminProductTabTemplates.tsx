import React, { useEffect, useState } from 'react';
import { FileText, Eye, Code, Component, FileCode, Layout } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css';
import './AdminButtonOverrides.css';
import './AdminProductTabTemplates.css';
import { adminProductTabsService, type ProductTabTemplateDto } from '../../services/adminProductTabsService';
import { Badge, Button, SkeletonTable } from '../../components/ui';

type TabType = 'all-templates' | 'view-template';

const AdminProductTabTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<ProductTabTemplateDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<TabType>('all-templates');
  const [viewingTemplate, setViewingTemplate] = useState<ProductTabTemplateDto | null>(null);

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>('');

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminProductTabsService.getAllActiveTemplates();
      setTemplates(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load templates';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleViewTemplate = (template: ProductTabTemplateDto) => {
    setViewingTemplate(template);
    setActiveTab('view-template');
  };

  const getContentTypeIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'HTML':
        return <Code size={16} className="admin-tab-tpl-icon-html" />;
      case 'MARKDOWN':
        return <FileText size={16} className="admin-tab-tpl-icon-markdown" />;
      case 'JSON':
        return <FileCode size={16} className="admin-tab-tpl-icon-json" />;
      case 'COMPONENT':
        return <Component size={16} className="admin-tab-tpl-icon-component" />;
      default:
        return <FileText size={16} className="admin-tab-tpl-icon-default" />;
    }
  };

  const getContentTypeBadge = (type: string): React.ReactNode => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
      HTML: 'warning',
      MARKDOWN: 'info',
      JSON: 'default',
      COMPONENT: 'success',
    };
    return <Badge variant={variants[type] || 'default'} size="sm">{type}</Badge>;
  };

  const getCategoryBadge = (category?: string): React.ReactNode => {
    if (!category) return null;
    const variants: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
      product_info: 'info',
      technical: 'warning',
      marketing: 'success',
    };
    return <Badge variant={variants[category] || 'default'} size="sm">{category}</Badge>;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredTemplates = templates.filter(t =>
    !filterCategory || t.category === filterCategory
  );

  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'all-templates' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('all-templates');
          setViewingTemplate(null);
        }}
        aria-label="Template library"
      >
        <Layout size={16} />
        Template Library
      </button>
      {viewingTemplate && (
        <button
          className={`dashboard-tab ${activeTab === 'view-template' ? 'active' : ''}`}
          onClick={() => setActiveTab('view-template')}
          aria-label="View template"
        >
          <Eye size={16} />
          Template Details
        </button>
      )}
    </nav>
  );

  return (
    <AdminLayout title="Product Tab Templates" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* All Templates Tab */}
          {activeTab === 'all-templates' && (
            <>
              <div className="admin-header-actions admin-tab-tpl-header-actions">
                <select
                  className="form-input admin-tab-tpl-filter-select"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="admin-tab-tpl-count">
                  {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
                </div>
              </div>

              {/* Template Cards (Grid View) */}
              <div className="admin-tab-tpl-grid">
                {loading ? (
                  <div className="admin-card">
                    <SkeletonTable rows={5} columns={2} />
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="admin-card">
                    <div className="table-empty">No templates found.</div>
                  </div>
                ) : (
                  filteredTemplates.map(template => (
                    <div key={template.id} className="admin-card admin-tab-tpl-card"
                         onClick={() => handleViewTemplate(template)}>
                      <div className="admin-tab-tpl-card-header">
                        <div className="admin-tab-tpl-card-title-wrap">
                          {getContentTypeIcon(template.content_type)}
                          <h4 className="admin-tab-tpl-card-title">{template.template_name}</h4>
                        </div>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewTemplate(template); }}>
                          <Eye size={14} />
                        </Button>
                      </div>

                      <div className="admin-tab-tpl-card-key">
                        {template.template_key}
                      </div>

                      <div className="admin-tab-tpl-card-badges">
                        {getContentTypeBadge(template.content_type)}
                        {template.category && getCategoryBadge(template.category)}
                        {template.is_active && <Badge variant="success" size="sm">Active</Badge>}
                      </div>

                      {template.description && (
                        <div className="admin-tab-tpl-card-desc">
                          {template.description}
                        </div>
                      )}

                      <div className="admin-tab-tpl-card-meta">
                        <div>
                          <div className="admin-tab-tpl-card-meta-label">Default Label:</div>
                          <div>{template.default_tab_label}</div>
                        </div>
                        <div>
                          <div className="admin-tab-tpl-card-meta-label">Display Order:</div>
                          <div>{template.default_display_order}</div>
                        </div>
                        {template.default_icon_name && (
                          <div className="admin-tab-tpl-card-meta-full">
                            <div className="admin-tab-tpl-card-meta-label">Icon:</div>
                            <div>{template.default_icon_name}</div>
                          </div>
                        )}
                        {template.default_component_name && (
                          <div className="admin-tab-tpl-card-meta-full">
                            <div className="admin-tab-tpl-card-meta-label">Component:</div>
                            <div className="admin-tab-tpl-card-meta-mono">{template.default_component_name}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Info Box */}
              {!loading && templates.length > 0 && (
                <div className="admin-tab-tpl-info-box">
                  <strong>ℹ️ Template Library</strong><br />
                  Templates are reusable blueprints for product detail tabs. They provide default content and structure that can be customized for each product.
                  <br /><br />
                  <strong>Content Types:</strong>
                  <ul className="admin-tab-tpl-info-list">
                    <li><strong>HTML:</strong> Rich HTML content with formatting</li>
                    <li><strong>MARKDOWN:</strong> Markdown text that renders to HTML</li>
                    <li><strong>JSON:</strong> Structured data (key-value pairs, lists)</li>
                    <li><strong>COMPONENT:</strong> Custom React component reference</li>
                  </ul>
                </div>
              )}
            </>
          )}

          {/* View Template Details Tab */}
          {activeTab === 'view-template' && viewingTemplate && (
            <div className="admin-card">
              <div className="admin-tab-tpl-view-header">
                <div className="admin-tab-tpl-view-header-row">
                  <div>
                    <div className="admin-tab-tpl-view-title-wrap">
                      {getContentTypeIcon(viewingTemplate.content_type)}
                      <h3 className="section-title admin-tab-tpl-view-title">{viewingTemplate.template_name}</h3>
                    </div>
                    <div className="admin-tab-tpl-view-key">
                      {viewingTemplate.template_key}
                    </div>
                  </div>
                  <div className="admin-tab-tpl-view-badges">
                    {getContentTypeBadge(viewingTemplate.content_type)}
                    {viewingTemplate.category && getCategoryBadge(viewingTemplate.category)}
                    {viewingTemplate.is_active && <Badge variant="success" size="sm">Active</Badge>}
                  </div>
                </div>

                {viewingTemplate.description && (
                  <div className="admin-tab-tpl-description-box">
                    <div className="admin-tab-tpl-description-label">Description</div>
                    <div className="admin-tab-tpl-description-text">{viewingTemplate.description}</div>
                  </div>
                )}

                {/* Template Settings */}
                <div className="form-grid admin-tab-tpl-settings-grid">
                  <div>
                    <label className="form-label">Default Tab Key</label>
                    <div className="admin-tab-tpl-setting-value admin-tab-tpl-setting-value-mono">
                      {viewingTemplate.default_tab_key}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Default Tab Label</label>
                    <div className="admin-tab-tpl-setting-value admin-tab-tpl-setting-value-bold">
                      {viewingTemplate.default_tab_label}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Content Type</label>
                    <div className="admin-tab-tpl-setting-value">
                      {getContentTypeBadge(viewingTemplate.content_type)}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Display Order</label>
                    <div className="admin-tab-tpl-setting-value">
                      {viewingTemplate.default_display_order}
                    </div>
                  </div>
                  {viewingTemplate.default_icon_name && (
                    <div>
                      <label className="form-label">Icon Name</label>
                      <div className="admin-tab-tpl-setting-value">
                        {viewingTemplate.default_icon_name}
                      </div>
                    </div>
                  )}
                  {viewingTemplate.default_component_name && (
                    <div>
                      <label className="form-label">Component Name</label>
                      <div className="admin-tab-tpl-setting-value admin-tab-tpl-setting-value-mono">
                        {viewingTemplate.default_component_name}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                <div className="admin-tab-tpl-content-section">
                  <h4 className="section-title">Default Content</h4>

                  {viewingTemplate.default_content_html && (
                    <div className="admin-tab-tpl-content-block">
                      <div className="admin-tab-tpl-content-label">HTML Content</div>
                      <div className="admin-tab-tpl-code-block">
                        <pre className="admin-tab-tpl-code-pre">
                          {viewingTemplate.default_content_html}
                        </pre>
                      </div>
                    </div>
                  )}

                  {viewingTemplate.default_content_markdown && (
                    <div className="admin-tab-tpl-content-block">
                      <div className="admin-tab-tpl-content-label">Markdown Content</div>
                      <div className="admin-tab-tpl-code-block">
                        <pre className="admin-tab-tpl-code-pre">
                          {viewingTemplate.default_content_markdown}
                        </pre>
                      </div>
                    </div>
                  )}

                  {viewingTemplate.default_content_json && (
                    <div className="admin-tab-tpl-content-block">
                      <div className="admin-tab-tpl-content-label">JSON Content</div>
                      <div className="admin-tab-tpl-code-block">
                        <pre className="admin-tab-tpl-code-pre">
                          {JSON.stringify(JSON.parse(viewingTemplate.default_content_json), null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {!viewingTemplate.default_content_html &&
                   !viewingTemplate.default_content_markdown &&
                   !viewingTemplate.default_content_json && (
                    <div className="admin-tab-tpl-no-content">
                      No default content defined for this template.
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="admin-tab-tpl-metadata">
                  <div>Created: {formatDate(viewingTemplate.created_at)}</div>
                  <div>Last Updated: {formatDate(viewingTemplate.updated_at)}</div>
                  <div>Template ID: {viewingTemplate.id}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductTabTemplates;
