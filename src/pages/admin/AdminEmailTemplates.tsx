import React, { useEffect, useState } from 'react';
import { emailTemplatesService, type EmailTemplate } from '../../services/emailTemplatesService';
import AdminLayout from './AdminLayout';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import { Mail, Edit, Eye, Save, X, Send, Code, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { logError } from '../../services/logger';
import './AdminUsers.css';
import './AdminButtonOverrides.css';

const AdminEmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    templateName: '',
    subjectLine: '',
    htmlContent: '',
    description: '',
    isActive: true,
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await emailTemplatesService.getAllTemplates();
      setTemplates(data);
    } catch (err: unknown) {
      logError('Failed to fetch templates:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      templateName: template.templateName,
      subjectLine: template.subjectLine,
      htmlContent: template.htmlContent,
      description: template.description,
      isActive: template.isActive,
    });
    setIsEditing(false);
    setShowPreview(false);
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const updated = await emailTemplatesService.updateTemplate(selectedTemplate.id, {
        ...formData,
        templateCode: selectedTemplate.templateCode,
      });

      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelectedTemplate(updated);
      setIsEditing(false);
      setSuccessMessage('Template updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      logError('Failed to update template:', err);
      const message = err instanceof Error ? err.message : 'Failed to update template';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    try {
      setLoading(true);
      setError(null);
      const html = await emailTemplatesService.previewTemplate(selectedTemplate.templateCode);
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (err: unknown) {
      logError('Failed to preview template:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate preview';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      await emailTemplatesService.sendTestEmail(selectedTemplate.templateCode, {
        recipientEmail: testEmail,
      });

      setSuccessMessage(`Test email sent to ${testEmail}!`);
      setTestEmail('');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      logError('Failed to send test email:', err);
      const message = err instanceof Error ? err.message : 'Failed to send test email';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await emailTemplatesService.toggleActive(template.id, !template.isActive);
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (selectedTemplate?.id === updated.id) {
        setSelectedTemplate(updated);
      }
    } catch (err: unknown) {
      logError('Failed to toggle status:', err);
      const message = err instanceof Error ? err.message : 'Failed to toggle status';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Email Templates">
      <div className="admin-page">
        <div className="admin-container" style={{ maxWidth: '1600px' }}>
          {/* Header */}
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={24} style={{ color: 'var(--admin-accent)' }} />
                  Email Templates
                </h2>
                <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
                  Manage and customize email templates for your application.
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
          )}

          {successMessage && (
            <div className="alert" style={{ background: 'var(--admin-success-bg)', color: '#065F46', border: '1px solid var(--admin-success)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}

          {/* Main Content - Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
            {/* Templates Sidebar */}
            <div className="admin-card" style={{ padding: 0, height: 'fit-content', maxHeight: 'calc(100vh - 300px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg-secondary)' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--admin-primary)' }}>
                  Templates ({templates.length})
                </h3>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {loading && templates.length === 0 ? (
                  <div style={{ padding: '20px' }}>
                    <SkeletonTable rows={5} columns={1} />
                  </div>
                ) : (
                  templates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--admin-border)',
                        background: selectedTemplate?.id === template.id ? 'var(--admin-accent-light)' : 'transparent',
                        borderLeft: selectedTemplate?.id === template.id ? '3px solid var(--admin-accent)' : '3px solid transparent',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--admin-primary)' }}>
                          {template.templateName}
                        </h4>
                        <Badge
                          variant={template.isActive ? 'success' : 'warning'}
                          size="sm"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleToggleActive(template); }}
                          style={{ cursor: 'pointer' }}
                        >
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--admin-accent)' }}>
                        {template.templateCode}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--admin-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {template.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Template Editor */}
            <div className="admin-card" style={{ padding: 0 }}>
              {selectedTemplate ? (
                <>
                  {/* Editor Header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-primary)' }}>
                      {selectedTemplate.templateName}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {!isEditing ? (
                        <>
                          <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit size={14} />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={handlePreview} disabled={loading}>
                            <Eye size={14} />
                            Preview
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="primary" size="sm" onClick={handleUpdateTemplate} disabled={loading} loading={loading}>
                            <Save size={14} />
                            Save Changes
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); handleSelectTemplate(selectedTemplate); }} disabled={loading}>
                            <X size={14} />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Editor Content */}
                  <div style={{ padding: '20px' }}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '20px' }}>
                      <div>
                        <label className="form-label">Template Code</label>
                        <input type="text" value={selectedTemplate.templateCode} disabled className="form-input" style={{ fontFamily: 'monospace', background: 'var(--admin-bg-secondary)' }} />
                      </div>
                      <div>
                        <label className="form-label">Template Name</label>
                        <input
                          type="text"
                          value={formData.templateName}
                          onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                          disabled={!isEditing}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label className="form-label">Subject Line</label>
                      <input
                        type="text"
                        value={formData.subjectLine}
                        onChange={(e) => setFormData(prev => ({ ...prev, subjectLine: e.target.value }))}
                        disabled={!isEditing}
                        className="form-input"
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label className="form-label">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        disabled={!isEditing}
                        className="form-input"
                        rows={2}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Code size={16} />
                        HTML Content
                      </label>
                      <textarea
                        value={formData.htmlContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                        disabled={!isEditing}
                        className="form-input"
                        rows={15}
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--admin-secondary)' }}>
                        Use placeholders like {`{{userName}}`}, {`{{userEmail}}`}, etc.
                      </p>
                    </div>

                    {/* Placeholders */}
                    {selectedTemplate.placeholders && Object.keys(selectedTemplate.placeholders).length > 0 && (
                      <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--admin-bg-secondary)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} />
                          Available Placeholders
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
                          {Object.entries(selectedTemplate.placeholders).map(([key, description]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                              <code style={{ padding: '2px 6px', background: 'var(--admin-bg-primary)', borderRadius: '4px', color: 'var(--admin-accent)', fontSize: '12px' }}>
                                {`{{${key}}}`}
                              </code>
                              <span style={{ color: 'var(--admin-secondary)' }}>{description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test Email */}
                    <div style={{ padding: '16px', background: 'var(--admin-info-bg)', borderRadius: '8px', border: '1px solid var(--admin-info)' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Send size={16} />
                        Send Test Email
                      </h4>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="form-input"
                          style={{ flex: 1 }}
                        />
                        <Button variant="primary" onClick={handleSendTestEmail} disabled={loading || !testEmail}>
                          <Send size={14} />
                          Send
                        </Button>
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--admin-secondary)' }}>
                        Test email will use sample data for placeholders.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--admin-secondary)' }}>
                  <Mail size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>Select a template from the list to edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '20px' }} onClick={() => setShowPreview(false)}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} />
                Email Preview
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                <X size={14} />
                Close
              </Button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', background: '#f5f5f5' }}>
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                style={{ width: '100%', height: '600px', border: 'none' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEmailTemplates;
