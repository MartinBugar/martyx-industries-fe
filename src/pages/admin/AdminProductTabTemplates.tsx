import React, { useEffect, useState } from 'react';
import { FileText, Eye, Code, Component, FileCode, Layout } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css';
import './AdminButtonOverrides.css';
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
        return <Code size={16} style={{ color: '#f59e0b' }} />;
      case 'MARKDOWN':
        return <FileText size={16} style={{ color: '#3b82f6' }} />;
      case 'JSON':
        return <FileCode size={16} style={{ color: '#8b5cf6' }} />;
      case 'COMPONENT':
        return <Component size={16} style={{ color: '#059669' }} />;
      default:
        return <FileText size={16} style={{ color: '#6b7280' }} />;
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
              <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select
                  className="form-input"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ maxWidth: '200px' }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
                </div>
              </div>

              {/* Template Cards (Grid View) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
              }}>
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
                    <div key={template.id} className="admin-card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                         onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                         onMouseLeave={(e) => e.currentTarget.style.boxShadow = ''}
                         onClick={() => handleViewTemplate(template)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getContentTypeIcon(template.content_type)}
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{template.template_name}</h4>
                        </div>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewTemplate(template); }}>
                          <Eye size={14} />
                        </Button>
                      </div>

                      <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace', marginBottom: '12px' }}>
                        {template.template_key}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {getContentTypeBadge(template.content_type)}
                        {template.category && getCategoryBadge(template.category)}
                        {template.is_active && <Badge variant="success" size="sm">Active</Badge>}
                      </div>

                      {template.description && (
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.5' }}>
                          {template.description}
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#6b7280', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>Default Label:</div>
                          <div>{template.default_tab_label}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>Display Order:</div>
                          <div>{template.default_display_order}</div>
                        </div>
                        {template.default_icon_name && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontWeight: 600 }}>Icon:</div>
                            <div>{template.default_icon_name}</div>
                          </div>
                        )}
                        {template.default_component_name && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontWeight: 600 }}>Component:</div>
                            <div style={{ fontFamily: 'monospace' }}>{template.default_component_name}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Info Box */}
              {!loading && templates.length > 0 && (
                <div style={{ padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '13px', color: '#0369a1' }}>
                  <strong>ℹ️ Template Library</strong><br />
                  Templates are reusable blueprints for product detail tabs. They provide default content and structure that can be customized for each product.
                  <br /><br />
                  <strong>Content Types:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '24px' }}>
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
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {getContentTypeIcon(viewingTemplate.content_type)}
                      <h3 className="section-title" style={{ margin: 0 }}>{viewingTemplate.template_name}</h3>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>
                      {viewingTemplate.template_key}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {getContentTypeBadge(viewingTemplate.content_type)}
                    {viewingTemplate.category && getCategoryBadge(viewingTemplate.category)}
                    {viewingTemplate.is_active && <Badge variant="success" size="sm">Active</Badge>}
                  </div>
                </div>

                {viewingTemplate.description && (
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>Description</div>
                    <div style={{ fontSize: '14px', color: '#374151' }}>{viewingTemplate.description}</div>
                  </div>
                )}

                {/* Template Settings */}
                <div className="form-grid" style={{ marginBottom: '24px' }}>
                  <div>
                    <label className="form-label">Default Tab Key</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px' }}>
                      {viewingTemplate.default_tab_key}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Default Tab Label</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', fontSize: '14px', fontWeight: 600 }}>
                      {viewingTemplate.default_tab_label}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Content Type</label>
                    <div style={{ padding: '8px' }}>
                      {getContentTypeBadge(viewingTemplate.content_type)}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Display Order</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', fontSize: '14px' }}>
                      {viewingTemplate.default_display_order}
                    </div>
                  </div>
                  {viewingTemplate.default_icon_name && (
                    <div>
                      <label className="form-label">Icon Name</label>
                      <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', fontSize: '13px' }}>
                        {viewingTemplate.default_icon_name}
                      </div>
                    </div>
                  )}
                  {viewingTemplate.default_component_name && (
                    <div>
                      <label className="form-label">Component Name</label>
                      <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px' }}>
                        {viewingTemplate.default_component_name}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 className="section-title">Default Content</h4>

                  {viewingTemplate.default_content_html && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>HTML Content</div>
                      <div style={{ padding: '16px', background: '#1f2937', color: '#e5e7eb', borderRadius: '6px', overflow: 'auto', maxHeight: '300px' }}>
                        <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          {viewingTemplate.default_content_html}
                        </pre>
                      </div>
                    </div>
                  )}

                  {viewingTemplate.default_content_markdown && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>Markdown Content</div>
                      <div style={{ padding: '16px', background: '#1f2937', color: '#e5e7eb', borderRadius: '6px', overflow: 'auto', maxHeight: '300px' }}>
                        <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          {viewingTemplate.default_content_markdown}
                        </pre>
                      </div>
                    </div>
                  )}

                  {viewingTemplate.default_content_json && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>JSON Content</div>
                      <div style={{ padding: '16px', background: '#1f2937', color: '#e5e7eb', borderRadius: '6px', overflow: 'auto', maxHeight: '300px' }}>
                        <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(JSON.parse(viewingTemplate.default_content_json), null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {!viewingTemplate.default_content_html &&
                   !viewingTemplate.default_content_markdown &&
                   !viewingTemplate.default_content_json && (
                    <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', color: '#6b7280', textAlign: 'center' }}>
                      No default content defined for this template.
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px', color: '#6b7280' }}>
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
